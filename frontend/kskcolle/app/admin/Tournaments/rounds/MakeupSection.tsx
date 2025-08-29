"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import useSWRMutation from "swr/mutation"
import { save } from "../../../api/index"
import type { MakeupDay, Round, Game } from "@/data/types"
import { format } from "date-fns"
import { Calendar, Clock, ChevronRight, CheckCircle, XCircle, Minus } from "lucide-react"

interface Props {
  makeup: MakeupDay & { calendar_event_id?: number }
  rounds: Round[]
  tournamentId: number
  onUpdate(): void
}

export default function MakeupSection({ makeup, rounds, onUpdate }: Props) {
  const { trigger: saveGame, isMutating } = useSWRMutation("spel", save)
  const { trigger: saveEvent, isMutating: savingEvent } = useSWRMutation("calendar", save)
  const { trigger: saveMakeup, isMutating: savingMakeup } = useSWRMutation("makeupDay", save)

  // Local state voor datum, startuur en eventId
  const [date, setDate] = useState("")
  const [startuur, setStartuur] = useState("20:00")
  const [eventId, setEventId] = useState<number | undefined>(undefined)

  // Hydrate state wanneer makeup data binnenkomt
  useEffect(() => {
    if (makeup) {
      if (makeup.date) {
        // Aangezien makeup.date een string is, kunnen we het direct gebruiken
        const dateValue = typeof makeup.date === "string" ? makeup.date : new Date(makeup.date).toISOString()
        setDate(dateValue.split("T")[0])
      }
      if (makeup.startuur) {
        setStartuur(makeup.startuur)
      }
      setEventId(makeup.calendar_event_id)
    }
  }, [makeup])

  // verzamel alle games met exact deze datum
  const games: Game[] = rounds
    .flatMap((r) => r.games)
    .filter((g) => {
      if (!g.uitgestelde_datum) return false
      return new Date(g.uitgestelde_datum).toDateString() === new Date(makeup.date).toDateString()
    })

  const handleResultChange = async (gameId: number, result: string) => {
    // bewaar resultaat, laat uitgestelde datum staan
    await saveGame({ id: gameId, result })
    onUpdate()
  }

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setDate(newDate)

    // 1) Als we al een eventId hebben, update het; anders maak nieuw aan
    if (eventId) {
      await saveEvent({ id: eventId, date: newDate, startuur })
    } else {
      const created = await saveEvent({
        id: undefined,
        title: `${makeup.label || format(new Date(makeup.date), "dd-MM-yyyy")}`,
        description: `Inhaaldag voor uitgestelde partijen`,
        type: "Inhaaldag",
        date: newDate,
        startuur,
        tournament_id: tournamentId,
      })

      // Onthoud lokaal zodat volgende keer we updaten ipv opnieuw aanmaken
      setEventId(created.event_id)

      // Persisteer ook naar de makeup day
      await saveMakeup({ id: makeup.id, calendar_event_id: created.event_id })
    }

    // 2) Update de makeup day's eigen datum
    await saveMakeup({ id: makeup.id, date: newDate })

    // 3) Vertel parent om te re-fetchen
    onUpdate()
  }

  const handleStartuurChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartuur = e.target.value
    setStartuur(newStartuur)

    // Update the calendar event with new startuur
    if (eventId) {
      await saveEvent({ id: eventId, startuur: newStartuur })
    }

    // Update the makeup day's startuur
    await saveMakeup({ id: makeup.id, startuur: newStartuur })

    // Tell the parent to re-fetch
    onUpdate()
  }

  const getResultIcon = (result: string | null) => {
    switch (result) {
      case "1-0":
      case "0-1":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "1/2-1/2":
        return <Minus className="h-4 w-4 text-yellow-500" />
      case "1-0FF":
      case "0-1FF":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "0-0":
        return <Minus className="h-4 w-4 text-blue-500" />
      case "not_played":
      case null:
        return <XCircle className="h-4 w-4 text-gray-400" />
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getResultColor = (result: string | null) => {
    switch (result) {
      case "1-0":
      case "0-1":
        return "bg-green-100 text-green-800 border-green-200"
      case "1/2-1/2":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "1-0FF":
      case "0-1FF":
        return "bg-red-100 text-red-800 border-red-200"
      case "0-0":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "not_played":
      case null:
        return "bg-gray-100 text-gray-600 border-gray-200"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 overflow-hidden">
      <div className="bg-gradient-to-r from-amber-200 to-orange-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-amber-800 flex items-center gap-2">
            <div className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              I
            </div>
            {makeup.label ?? format(new Date(makeup.date), "dd-MM-yyyy")}
          </h3>

          {/* Datum en Startuur inputs voor kalender event */}
          <div className="flex items-center gap-3">
            {/* Datum input */}
            <div className="relative">
              <Input
                type="date"
                value={date}
                onChange={handleDateChange}
                disabled={savingMakeup || savingEvent}
                className="bg-white/10 border-amber-300/50 text-amber-800 placeholder:text-amber-700/70 focus:bg-white/20 focus:border-amber-400 focus:ring-amber-300/20 min-w-[140px] backdrop-blur-sm"
              />
              {(savingMakeup || savingEvent) && (
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-700/70" />
                </div>
              )}
            </div>

            {/* Startuur input */}
            <div className="relative">
              <Input
                type="time"
                value={startuur}
                onChange={handleStartuurChange}
                disabled={savingMakeup || savingEvent}
                className="bg-white/10 border-amber-300/50 text-amber-800 placeholder:text-amber-700/70 focus:bg-white/20 focus:border-amber-400 focus:ring-amber-300/20 min-w-[120px] backdrop-blur-sm"
              />
            </div>
          </div>
        </div>

        <p className="text-amber-700 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {format(new Date(makeup.date), "dd-MM-yyyy")}
        </p>
      </div>

      <div className="p-6">
        {games.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
            <h4 className="text-lg font-semibold text-amber-700 mb-2">Geen uitgestelde partijen</h4>
            <p className="text-amber-600">Er zijn geen partijen uitgesteld naar deze inhaaldag.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <div
                key={game.game_id}
                className="bg-white rounded-lg p-4 border border-amber-200 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  {/* Players */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white border-2 border-amber-300 rounded-full flex items-center justify-center text-xs font-bold">
                        W
                      </div>
                      <span className="font-medium text-gray-800">
                        {game.speler1.voornaam} {game.speler1.achternaam}
                      </span>
                    </div>

                    <ChevronRight className="h-4 w-4 text-amber-400" />

                    <div className="flex items-center gap-3">
                      {game.speler2 ? (
                        <>
                          <div className="w-8 h-8 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                            Z
                          </div>
                          <span className="font-medium text-gray-800">
                            {game.speler2.voornaam} {game.speler2.achternaam}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 bg-amber-200 border-2 border-amber-300 rounded-full flex items-center justify-center text-xs">
                            -
                          </div>
                          <span className="text-amber-600 italic">Bye</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Result Selector */}
                  <div className="flex items-center gap-2">
                    {getResultIcon(game.result)}
                    <Select
                      onValueChange={(val) => handleResultChange(game.game_id, val)}
                      defaultValue={game.result || "not_played"}
                      disabled={isMutating}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Selecteer" />
                      </SelectTrigger>
                                        <SelectContent>
                    <SelectItem value="1-0">1-0 (Wit wint)</SelectItem>
                    <SelectItem value="0-1">0-1 (Zwart wint)</SelectItem>
                    <SelectItem value="1/2-1/2">½-½ (Remise)</SelectItem>
                    <SelectItem value="1-0FF">1-0FF (Zwart forfait)</SelectItem>
                    <SelectItem value="0-1FF">0-1FF (Wit forfait)</SelectItem>
                    <SelectItem value="0-0">0-0 (Scheidsrechterlijke beslissing)</SelectItem>
                    <SelectItem value="not_played">Niet gespeeld</SelectItem>
                  </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Result Status */}
                <div className="mt-3 flex justify-end">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getResultColor(game.result)}`}>
                    {game.result === "not_played" || !game.result ? "Nog te spelen" : game.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

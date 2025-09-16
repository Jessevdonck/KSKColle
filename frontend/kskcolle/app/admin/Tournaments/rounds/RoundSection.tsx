"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import useSWRMutation from "swr/mutation"
import { save as saveRound, save as saveEvent } from "../../../api/index"
import type { Round, MakeupDay } from "@/data/types"
import RoundGames from "./RoundGames"
import RoundExport from "./RoundExport"
import { Play, Trophy } from "lucide-react"

interface Props {
  roundNumber: number
  roundData?: Round & { calendar_event_id?: number }
  tournamentId: number
  tournamentName: string
  makeupDays: MakeupDay[]
  participations?: Array<{
    user_id: number
    score: number
    tie_break: number
  }>
  isSevillaImported?: boolean
  onGenerate(): void
  canGenerate: boolean
  onUpdate(): void
  isGenerating?: boolean
}

export default function RoundSection({
  roundNumber,
  roundData,
  tournamentId,
  tournamentName,
  makeupDays,
  participations,
  isSevillaImported,
  onGenerate,
  canGenerate,
  onUpdate,
  isGenerating = false,
}: Props) {
  // local date for the <Input>
  const [date, setDate] = useState("")
  // local startuur for the <Input>
  const [startuur, setStartuur] = useState("20:00")
  // local eventId so we know when we've created it
  const [eventId, setEventId] = useState<number | undefined>(undefined)

  // when roundData arrives, hydrate both date & eventId
  useEffect(() => {
    if (roundData) {
      if (roundData.ronde_datum) {
        const d =
          roundData.ronde_datum instanceof Date
            ? roundData.ronde_datum.toISOString()
            : new Date(roundData.ronde_datum).toISOString()
        setDate(d.split("T")[0])
      }
      if (roundData.startuur) {
        setStartuur(roundData.startuur)
      }
      setEventId(roundData.calendar_event_id)
    }
  }, [roundData])

  // SWR mutation for rounds
  const { trigger: mutateRound, isMutating: savingRound } = useSWRMutation("rondes", saveRound)
  // SWR mutation for calendar
  const { trigger: mutateEvent, isMutating: savingEvent } = useSWRMutation("calendar", saveEvent)

  // Helper function to update round with correct URL structure
  const updateRound = async (roundId: number, data: any) => {
    return await mutateRound({ 
      id: `${tournamentId}/rondes/${roundId}`,
      ...data
    })
  }

  const showGenerateButton = canGenerate && (roundData?.games.length ?? 0) === 0

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setDate(newDate)

    // 1) If we already have an eventId, update it; otherwise create & keep it
    if (eventId) {
      await mutateEvent({ id: eventId, date: newDate, startuur })
    } else {
      const created = await mutateEvent({
        id: undefined,
        title: `Ronde ${roundNumber} - ${tournamentName}`,
        description: `${tournamentName} – ronde ${roundNumber}`,
        type: "Ronde",
        date: newDate,
        startuur,
        tournament_id: tournamentId,
      })
      // remember it locally so next time we update instead of re-create
      setEventId(created.event_id)
      // also persist to the DB-round row
      if (roundData) {
        await updateRound(roundData.round_id, { 
          calendar_event_id: created.event_id,
          startuur: startuur
        })
      }
    }

    // 2) update the round's own date and startuur
    if (roundData) {
      await updateRound(roundData.round_id, { 
        ronde_datum: newDate,
        startuur: startuur
      })
    }

    // 3) tell the parent to re-fetch its SWR (and pick up the new event_id in roundData if it wants)
    onUpdate()
  }

  const handleStartuurChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartuur = e.target.value
    setStartuur(newStartuur)

    // Update the calendar event with new startuur
    if (eventId) {
      await mutateEvent({ id: eventId, startuur: newStartuur })
    }

    // Update the round's startuur
    if (roundData) {
      await updateRound(roundData.round_id, { 
        startuur: newStartuur
      })
    }

    // Tell the parent to re-fetch
    onUpdate()
  }

  const games = roundData?.games ?? []

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold text-white">Ronde {roundNumber}</h3>

          {/* Datum en Startuur velden */}
          <div className="flex items-center gap-3">
            {/* Datum veld */}
            <div className="relative">
              <Input
                type="date"
                value={date}
                onChange={handleDateChange}
                disabled={savingRound || savingEvent}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20 focus:border-white/40 focus:ring-white/20 min-w-[160px] backdrop-blur-sm"
                style={{
                  colorScheme: "dark",
                }}
              />
              {(savingRound || savingEvent) && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/70" />
                </div>
              )}
            </div>

            {/* Startuur veld */}
            <div className="relative">
              <Input
                type="time"
                value={startuur}
                onChange={handleStartuurChange}
                disabled={savingRound || savingEvent}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/70 focus:bg-white/20 focus:border-white/40 focus:ring-white/20 min-w-[120px] backdrop-blur-sm"
                style={{
                  colorScheme: "dark",
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {showGenerateButton && (
            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 transition-all duration-200"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Genereren...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-white" />
                  Genereer Paringen
                </div>
              )}
            </Button>
          )}
          
          {games.length > 0 && roundData && (
            <RoundExport
              tournamentId={tournamentId}
              roundId={roundData.round_id}
              roundNumber={roundNumber}
              tournamentName={tournamentName}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30"
            />
          )}
        </div>
      </div>

      <div className="p-6">
        {games.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-mainAccent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-mainAccent" />
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">Nog geen paringen</h4>
            <p className="text-gray-500">
              {showGenerateButton
                ? "Klik op 'Genereer Paringen' om de partijen voor deze ronde aan te maken."
                : "Wacht tot de vorige ronde voltooid is voordat je paringen kunt genereren."}
            </p>
          </div>
        ) : (
          <RoundGames 
            games={games} 
            tournamentId={tournamentId} 
            makeupDays={makeupDays} 
            participations={participations}
            roundNumber={roundNumber}
            isSevillaImported={isSevillaImported}
            onUpdateGame={onUpdate} 
          />
        )}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import useSWRMutation from "swr/mutation"
import { save } from "../../../api/index"
import { format } from "date-fns"
import type { Game, MakeupDay } from "@/data/types"
import { Clock, ChevronRight, CheckCircle, XCircle, Minus } from "lucide-react"

interface Props {
  games: Game[]
  tournamentId: number
  makeupDays: MakeupDay[]
  onUpdateGame(): void
}

export default function RoundGames({ games, makeupDays, onUpdateGame }: Props) {
  const { trigger: saveGame, isMutating } = useSWRMutation("spel", save)
  const [postponing, setPostponing] = useState<number | null>(null)
  const [selectedMD, setSelectedMD] = useState<number | "">("")

  const handleResultChange = async (gameId: number, result: string) => {
    await saveGame({ id: gameId, result })
    onUpdateGame()
  }

  const handlePostpone = async () => {
    if (postponing && selectedMD) {
      const md = makeupDays.find((m) => m.id === selectedMD)!
      // zet uitgestelde datum in game
      await saveGame({ id: postponing, uitgestelde_datum: md.date })
      setPostponing(null)
      setSelectedMD("")
      onUpdateGame()
    }
  }

  const getResultIcon = (result: string | null) => {
    switch (result) {
      case "1-0":
      case "0-1":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case "1/2-1/2":
        return <Minus className="h-3 w-3 text-yellow-500" />
      case "not_played":
      case null:
        return <XCircle className="h-3 w-3 text-gray-400" />
      default:
        return <XCircle className="h-3 w-3 text-gray-400" />
    }
  }

  const getResultColor = (result: string | null) => {
    switch (result) {
      case "1-0":
      case "0-1":
        return "bg-green-100 text-green-800 border-green-200"
      case "1/2-1/2":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "not_played":
      case null:
        return "bg-gray-100 text-gray-600 border-gray-200"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500 text-sm">Geen partijen beschikbaar voor deze ronde.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {games.map((game) => (
        <div
          key={game.game_id}
          className="border border-neutral-200 rounded-lg p-3 hover:border-mainAccent/30 transition-colors"
        >
          {/* Main game row - responsive flex layout */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Players - takes full width on mobile, flex-1 on desktop */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-6 h-6 bg-white border-2 border-neutral-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  W
                </div>
                <span className="font-medium text-textColor truncate text-sm">
                  {game.speler1.voornaam} {game.speler1.achternaam}
                </span>
              </div>

              <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />

              <div className="flex items-center gap-2 flex-1 min-w-0">
                {game.speler2 ? (
                  <>
                    <div className="w-6 h-6 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      Z
                    </div>
                    <span className="font-medium text-textColor truncate text-sm">
                      {game.speler2.voornaam} {game.speler2.achternaam}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 bg-gray-200 border-2 border-gray-300 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                      -
                    </div>
                    <span className="text-gray-500 italic text-sm">Bye</span>
                  </>
                )}
              </div>
            </div>

            {/* Result and Actions - stacks on mobile, inline on desktop */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              {/* Result Selector */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {getResultIcon(game.result)}
                <Select
                  onValueChange={(val) => handleResultChange(game.game_id, val)}
                  defaultValue={game.result || "not_played"}
                  disabled={isMutating}
                >
                  <SelectTrigger className="w-full sm:w-28 text-sm">
                    <SelectValue placeholder="Selecteer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-0">1-0</SelectItem>
                    <SelectItem value="0-1">0-1</SelectItem>
                    <SelectItem value="1/2-1/2">½-½</SelectItem>
                    <SelectItem value="not_played">Niet gespeeld</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Postpone Button */}
              {!game.uitgestelde_datum && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPostponing(game.game_id)}
                  className="border-amber-200 text-amber-600 hover:bg-amber-50 w-full sm:w-auto text-sm bg-transparent"
                >
                  <Clock className="h-3 w-3 mr-2 sm:mr-0" />
                  <span className="sm:hidden">Uitstellen</span>
                </Button>
              )}
            </div>
          </div>

          {/* Result Status */}
          <div className="mt-2 flex justify-start sm:justify-end">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getResultColor(game.result)}`}>
              {game.result === "not_played" || !game.result ? "Nog te spelen" : game.result}
            </span>
          </div>

          {/* Postpone Selection */}
          {postponing === game.game_id && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2 text-sm">
                <Clock className="h-3 w-3" />
                Partij uitstellen
              </h4>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Select
                  onValueChange={(val) => setSelectedMD(Number(val))}
                  value={selectedMD === "" ? undefined : selectedMD.toString()}
                >
                  <SelectTrigger className="flex-1 text-sm">
                    <SelectValue placeholder="Kies inhaaldag" />
                  </SelectTrigger>
                  <SelectContent>
                    {makeupDays.map((md) => (
                      <SelectItem key={md.id} value={md.id.toString()}>
                        {md.label || format(new Date(md.date), "dd-MM-yyyy")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    onClick={handlePostpone}
                    disabled={selectedMD === ""}
                    className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none text-sm"
                  >
                    Bevestig
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPostponing(null)}
                    className="flex-1 sm:flex-none text-sm bg-transparent"
                  >
                    Annuleer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

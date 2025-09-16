"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import useSWRMutation from "swr/mutation"
import { save, postponeGame } from "../../../api/index"
import { format } from "date-fns"
import type { Game, MakeupDay } from "@/data/types"
import { Clock, ChevronRight, CheckCircle, XCircle, Minus } from "lucide-react"
import { sortGamesByScore, sortGamesByPairingOrder } from "@/lib/gameSorting"

const createUrlFriendlyName = (voornaam: string, achternaam: string) => {
  return `${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, "_")
}

const getByeText = (result: string | null) => {
  if (!result) return "Bye"
  if (result.startsWith("ABS-")) return "Abs with msg"
  return "Bye"
}

interface Props {
  games: Game[]
  tournamentId: number
  makeupRounds?: Array<{
    round_id: number
    ronde_datum: string
    startuur: string
    label: string | null
  }>
  participations?: Array<{
    user_id: number
    score: number
    tie_break: number
  }>
  roundNumber?: number
  isSevillaImported?: boolean
  onUpdateGame(): void
}

export default function RoundGames({ games, makeupRounds = [], participations, roundNumber, isSevillaImported, onUpdateGame }: Props) {
  const { trigger: saveGame, isMutating } = useSWRMutation("spel", save)
  const [postponing, setPostponing] = useState<number | null>(null)
  const [selectedMD, setSelectedMD] = useState<number | "">("")

  // Check if a game is actually played (not just placeholder values)
  const isGamePlayed = (result: string | null) => {
    if (!result) return false
    return result !== "..." && result !== "not_played" && result !== "null"
  }

  const handleResultChange = async (gameId: number, result: string) => {
    await saveGame({ id: gameId, result })
    onUpdateGame()
  }

  const handlePostpone = async () => {
    if (postponing && selectedMD) {
      const makeupRound = makeupRounds.find((r) => r.round_id === selectedMD)!
      // Use the new postpone API
      try {
        await postponeGame('', {
          arg: {
            game_id: postponing,
            makeup_round_id: selectedMD
          }
        })
        setPostponing(null)
        setSelectedMD("")
        onUpdateGame()
      } catch (error) {
        console.error('Failed to postpone game:', error)
        alert('Kon game niet uitstellen')
      }
    }
  }

  const getResultIcon = (result: string | null) => {
    switch (result) {
      case "1-0":
      case "0-1":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case "1/2-1/2":
        return <Minus className="h-3 w-3 text-yellow-500" />
      case "1-0FF":
      case "0-1FF":
        return <XCircle className="h-3 w-3 text-red-500" />
      case "0-0":
        return <Minus className="h-3 w-3 text-blue-500" />
      case "not_played":
      case "...":
      case null:
        return <XCircle className="h-3 w-3 text-gray-400" />
      default:
        return <XCircle className="h-3 w-3 text-gray-400" />
    }
  }

  const getResultColor = (result: string | null, uitgestelde_datum?: Date | null) => {
    if (uitgestelde_datum) {
      return "bg-amber-100 text-amber-800 border-amber-200"
    }
    
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
      case "...":
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

  // Sort games to maintain consistent pairing order
  const sortedGames = sortGamesByPairingOrder(games, isSevillaImported);

  return (
    <div className="space-y-3">
      {sortedGames.map((game) => (
        <div
          key={game.game_id}
          className={`border rounded-lg p-3 transition-colors ${
            game.uitgestelde_datum 
              ? 'border-amber-200 bg-amber-50 hover:border-amber-300' 
              : 'border-neutral-200 hover:border-mainAccent/30'
          }`}
        >
          {/* Main game row - responsive flex layout */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Players - takes full width on mobile, flex-1 on desktop */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {/* Postponed indicator */}
              {game.uitgestelde_datum && (
                <div className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                  <Clock className="h-3 w-3" />
                  <span>Uitgesteld</span>
                </div>
              )}
              <Link
                href={`/profile/${createUrlFriendlyName(game.speler1.voornaam, game.speler1.achternaam)}`}
                className="group flex items-center gap-2 flex-1 min-w-0 hover:text-mainAccent transition-colors"
              >
                <div className="w-6 h-6 bg-white border-2 border-neutral-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:border-mainAccent transition-colors">
                  W
                </div>
                <span className="font-medium text-textColor truncate text-sm group-hover:text-mainAccent transition-colors">
                  {game.speler1.voornaam} {game.speler1.achternaam}
                </span>
              </Link>

              <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />

              <div className="flex items-center gap-2 flex-1 min-w-0">
                {game.speler2 ? (
                  <Link
                    href={`/profile/${createUrlFriendlyName(game.speler2.voornaam, game.speler2.achternaam)}`}
                    className="group flex items-center gap-2 flex-1 min-w-0 hover:text-mainAccent transition-colors"
                  >
                    <div className="w-6 h-6 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 group-hover:border-mainAccent transition-colors">
                      Z
                    </div>
                    <span className="font-medium text-textColor truncate text-sm group-hover:text-mainAccent transition-colors">
                      {game.speler2.voornaam} {game.speler2.achternaam}
                    </span>
                  </Link>
                ) : (
                  <>
                    <div className="w-6 h-6 bg-gray-200 border-2 border-gray-300 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                      -
                    </div>
                    <span className="text-gray-500 italic text-sm">{getByeText(game.result)}</span>
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

              {/* Postpone Button - only show for non-postponed, non-played games */}
              {!game.uitgestelde_datum && !isGamePlayed(game.result) && (
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
              
              {/* Postponed game info */}
              {game.uitgestelde_datum && (
                <div className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                  Uitgesteld naar {new Date(game.uitgestelde_datum).toLocaleDateString('nl-NL')}
                </div>
              )}
            </div>
          </div>

          {/* Result Status */}
          <div className="mt-2 flex justify-start sm:justify-end">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getResultColor(game.result, game.uitgestelde_datum)}`}>
            {game.uitgestelde_datum ? "Uitgesteld" :
             game.result === "not_played" || game.result === "..." || !game.result ? "Nog te spelen" : 
             game.result === "1-0FF" ? "Zwart forfait" :
             game.result === "0-1FF" ? "Wit forfait" :
             game.result === "0-0" ? "Scheidsrechterlijke beslissing" :
             game.result}
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
                    {makeupRounds.map((round) => (
                      <SelectItem key={round.round_id} value={round.round_id.toString()}>
                        {round.label || format(new Date(round.ronde_datum), "dd-MM-yyyy")}
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

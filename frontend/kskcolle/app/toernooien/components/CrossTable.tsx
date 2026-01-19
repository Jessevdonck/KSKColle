"use client"

import * as React from "react"
import Link from "next/link"
import { calculateStandings } from "./Standings"

const createUrlFriendlyName = (voornaam: string, achternaam: string) =>
  `${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, "_")

type Game = {
  game_id: number
  result: string | null
  speler1: { user_id: number; voornaam: string; achternaam: string }
  speler2: { user_id: number; voornaam: string; achternaam: string } | null
}

type Round = {
  round_id: number | null
  ronde_nummer: number
  games: Game[]
  ronde_datum?: string | null
  startuur?: string
  type: "REGULAR" | "MAKEUP"
  label?: string | null
  is_sevilla_imported?: boolean
}

type Tournament = {
  tournament_id: number
  naam: string
  rondes: number
  type: "SWISS" | "ROUND_ROBIN"
  rating_enabled?: boolean
  megaschaak_enabled?: boolean
  is_youth?: boolean
  participations: Array<{
    user: {
      user_id: number
      voornaam: string
      achternaam: string
      schaakrating_elo?: number
    }
    sevilla_rating_change?: number | null
    tie_break?: number | null
    score?: number | null
  }>
  class_name?: string | null
}

interface CrossTableProps {
  tournament: Tournament
  rounds: Round[]
}

export default function CrossTable({ tournament, rounds }: CrossTableProps) {
  // Calculate standings to get sorted players and their stats
  const standings = React.useMemo(() => {
    return calculateStandings(tournament, rounds)
  }, [tournament, rounds])

  // Build cross table data - map of playerId -> opponentId -> result (1, 0.5, 0, or null)
  const crossTableData = React.useMemo(() => {
    const data = new Map<number, Map<number, number | null>>()

    // Initialize all player combinations
    standings.forEach(player1 => {
      const playerMap = new Map<number, number | null>()
      standings.forEach(player2 => {
        if (player1.user_id !== player2.user_id) {
          playerMap.set(player2.user_id, null)
        }
      })
      data.set(player1.user_id, playerMap)
    })

    // Fill in actual game results
    rounds.forEach(round => {
      round.games.forEach(game => {
        if (!game.speler2) return // Skip bye games

        const player1Id = game.speler1.user_id
        const player2Id = game.speler2.user_id

        // Determine result from player1's perspective (1 = win, 0.5 = draw, 0 = loss)
        let result: number | null = null
        if (game.result) {
          if (game.result === "1-0" || game.result === "1-0R") {
            result = 1 // Player1 wins
          } else if (game.result === "0-1" || game.result === "0-1R") {
            result = 0 // Player1 loses
          } else if (game.result === "1/2-1/2" || game.result === "½-½") {
            result = 0.5 // Draw
          }
        }

        // Store result from player1's perspective
        const player1Map = data.get(player1Id)
        if (player1Map && result !== null) {
          player1Map.set(player2Id, result)
        }

        // Store result from player2's perspective (inverted)
        const player2Map = data.get(player2Id)
        if (player2Map && result !== null) {
          player2Map.set(player1Id, result === 1 ? 0 : result === 0 ? 1 : 0.5)
        }
      })
    })

    return data
  }, [standings, rounds])

  // Get result cell class
  const getResultClass = (result: number | null) => {
    if (result === 1) return "bg-green-100 text-green-800"
    if (result === 0) return "bg-red-100 text-red-800"
    if (result === 0.5) return "bg-yellow-100 text-yellow-800"
    return "bg-gray-50 text-gray-400"
  }

  if (standings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500 text-center">Geen spelers gevonden</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="border-collapse text-xs" style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead>
              <tr className="bg-gradient-to-r from-mainAccent to-mainAccentDark">
                <th className="sticky left-0 z-20 bg-gradient-to-r from-mainAccent to-mainAccentDark border-r border-white/20 px-2 py-2 text-center font-semibold text-white" style={{ width: '40px' }}>
                  #
                </th>
                <th className="sticky left-[40px] z-20 bg-gradient-to-r from-mainAccent to-mainAccentDark border-r border-white/20 px-3 py-2 text-left font-semibold text-white" style={{ width: '200px' }}>
                  Naam
                </th>
                <th className="border-r border-white/20 px-1 py-2 text-center font-semibold text-white" style={{ width: '35px' }}>
                  PT
                </th>
                <th className="border-r border-white/20 px-1 py-2 text-center font-semibold text-white" style={{ width: '35px' }}>
                  Part
                </th>
                {!tournament.is_youth && (
                  <th className="border-r border-white/20 px-1 py-2 text-center font-semibold text-white" style={{ width: '50px' }}>
                    ELIO
                  </th>
                )}
                <th className="border-r border-white/20 px-1 py-2 text-center font-semibold text-white" style={{ width: '50px' }}>
                  SB²
                </th>
                {/* Column headers with player names (vertical) */}
                {standings.map((player, index) => (
                  <th
                    key={player.user_id}
                    className="border-r border-white/20 px-1 py-2 text-center font-semibold text-white last:border-r-0"
                    style={{ 
                      width: '35px',
                      minWidth: '35px',
                      height: '80px'
                    }}
                  >
                    <div className="flex items-center justify-center h-full">
                      <div 
                        className="text-[10px] leading-tight"
                        style={{ 
                          writingMode: 'vertical-rl',
                          textOrientation: 'mixed',
                          transform: 'rotate(180deg)'
                        }}
                      >
                        <Link
                          href={`/profile/${createUrlFriendlyName(player.voornaam, player.achternaam)}`}
                          className="hover:text-yellow-200 transition-colors inline-block"
                          title={`${player.voornaam} ${player.achternaam}`}
                        >
                          <span className="whitespace-nowrap">{player.voornaam.substring(0, 1)}. {player.achternaam}</span>
                        </Link>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {standings.map((player, rowIndex) => {
                const playerResults = crossTableData.get(player.user_id)
                return (
                  <tr key={player.user_id} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {/* Position number */}
                    <td className="sticky left-0 z-10 bg-inherit border-r border-gray-200 px-2 py-2 text-center font-bold text-gray-700" style={{ width: '40px' }}>
                      {rowIndex + 1}
                    </td>
                    {/* Player name */}
                    <td className="sticky left-[40px] z-10 bg-inherit border-r border-gray-200 px-3 py-2 font-medium text-gray-900" style={{ width: '200px' }}>
                      <Link
                        href={`/profile/${createUrlFriendlyName(player.voornaam, player.achternaam)}`}
                        className="hover:text-mainAccent transition-colors truncate block"
                        title={`${player.voornaam} ${player.achternaam}`}
                      >
                        {player.voornaam} {player.achternaam}
                      </Link>
                    </td>
                    {/* Points */}
                    <td className="border-r border-gray-200 px-1 py-2 text-center font-bold text-gray-900" style={{ width: '35px' }}>
                      {player.score}
                    </td>
                    {/* Games played */}
                    <td className="border-r border-gray-200 px-1 py-2 text-center text-gray-700" style={{ width: '35px' }}>
                      {player.gamesPlayed}
                    </td>
                    {/* ELIO */}
                    {!tournament.is_youth && (
                      <td className="border-r border-gray-200 px-1 py-2 text-center text-gray-700" style={{ width: '50px' }}>
                        {player.schaakrating_elo || '-'}
                      </td>
                    )}
                    {/* SB² */}
                    <td className="border-r border-gray-200 px-1 py-2 text-center text-gray-700" style={{ width: '50px' }}>
                      {player.tieBreak.toFixed(2)}
                    </td>
                    {/* Game results */}
                    {standings.map((opponent, colIndex) => {
                      if (player.user_id === opponent.user_id) {
                        return (
                          <td
                            key={opponent.user_id}
                            className="border-r border-gray-200 px-1 py-2 text-center bg-green-50 last:border-r-0"
                            style={{ width: '35px', minWidth: '35px' }}
                          >
                            <span className="text-gray-600 font-semibold">x</span>
                          </td>
                        )
                      }
                      const result = playerResults?.get(opponent.user_id)
                      return (
                        <td
                          key={opponent.user_id}
                          className={`border-r border-gray-200 px-1 py-2 text-center font-medium last:border-r-0 ${getResultClass(result ?? null)}`}
                          style={{ width: '35px', minWidth: '35px' }}
                        >
                          {result !== null && result !== undefined ? result : "-"}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View - Simplified */}
      <div className="md:hidden space-y-4">
        {standings.map((player, index) => {
          const playerResults = crossTableData.get(player.user_id)
          return (
            <div key={player.user_id} className="bg-white rounded-lg shadow-md p-4">
              <div className="mb-3 pb-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {index + 1}.{' '}
                      <Link
                        href={`/profile/${createUrlFriendlyName(player.voornaam, player.achternaam)}`}
                        className="hover:text-mainAccent transition-colors"
                      >
                        {player.voornaam} {player.achternaam}
                      </Link>
                    </h3>
                    <div className="flex gap-4 mt-1 text-sm text-gray-600">
                      <span>PT: {player.score}</span>
                      <span>Part: {player.gamesPlayed}</span>
                      {!tournament.is_youth && <span>ELIO: {player.schaakrating_elo || '-'}</span>}
                      <span>SB²: {player.tieBreak.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-1 text-xs">
                {standings.map((opponent, oppIndex) => {
                  if (player.user_id === opponent.user_id) {
                    return (
                      <div
                        key={opponent.user_id}
                        className="bg-green-50 text-center p-1 rounded text-gray-600 font-semibold"
                      >
                        x
                      </div>
                    )
                  }
                  const result = playerResults?.get(opponent.user_id)
                  return (
                    <div
                      key={opponent.user_id}
                      className={`text-center p-1 rounded font-medium ${getResultClass(result ?? null)}`}
                      title={`vs ${opponent.voornaam} ${opponent.achternaam}`}
                    >
                      <div className="text-[10px] text-gray-500">{oppIndex + 1}</div>
                      <div>{result !== null && result !== undefined ? result : "-"}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

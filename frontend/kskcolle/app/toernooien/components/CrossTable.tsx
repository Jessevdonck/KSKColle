"use client"

import * as React from "react"

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
  }>
  class_name?: string | null
}

interface CrossTableProps {
  tournament: Tournament
  rounds: Round[]
}

type GameResult = {
  opponentId: number
  result: string // "1-0", "0-1", "1/2-1/2", or "-" if not played
  isWhite: boolean
}

export default function CrossTable({ tournament, rounds }: CrossTableProps) {
  // Get all players from participations, sorted by rating (high to low)
  const players = React.useMemo(() => {
    const playersList = tournament.participations.map(p => p.user)
    // Sort by rating (high to low)
    return playersList.sort((a, b) => {
      const ratingA = a.schaakrating_elo || 0
      const ratingB = b.schaakrating_elo || 0
      return ratingB - ratingA
    })
  }, [tournament.participations])

  // Build cross table data
  const crossTableData = React.useMemo(() => {
    const data = new Map<number, Map<number, GameResult>>()

    // Initialize all player combinations
    players.forEach(player1 => {
      const playerMap = new Map<number, GameResult>()
      players.forEach(player2 => {
        if (player1.user_id !== player2.user_id) {
          playerMap.set(player2.user_id, {
            opponentId: player2.user_id,
            result: "-",
            isWhite: false
          })
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

        // Determine result from player1's perspective
        let result = "-"
        if (game.result) {
          if (game.result === "1-0" || game.result === "1-0R") {
            result = "1-0" // Player1 (white) wins
          } else if (game.result === "0-1" || game.result === "0-1R") {
            result = "0-1" // Player2 (black) wins
          } else if (game.result === "1/2-1/2" || game.result === "½-½") {
            result = "1/2-1/2" // Draw
          }
        }

        // Store result from player1's perspective
        const player1Map = data.get(player1Id)
        if (player1Map) {
          player1Map.set(player2Id, {
            opponentId: player2Id,
            result: result,
            isWhite: true
          })
        }

        // Store result from player2's perspective (inverted)
        const player2Map = data.get(player2Id)
        if (player2Map) {
          let invertedResult = "-"
          if (result === "1-0") {
            invertedResult = "0-1"
          } else if (result === "0-1") {
            invertedResult = "1-0"
          } else if (result === "1/2-1/2") {
            invertedResult = "1/2-1/2"
          }
          
          player2Map.set(player1Id, {
            opponentId: player1Id,
            result: invertedResult,
            isWhite: false
          })
        }
      })
    })

    return data
  }, [players, rounds])

  // Get player name
  const getPlayerName = (userId: number) => {
    const player = players.find(p => p.user_id === userId)
    return player ? `${player.voornaam} ${player.achternaam}` : "Unknown"
  }

  // Get result cell class
  const getResultClass = (result: string) => {
    if (result === "1-0") return "bg-green-100 text-green-800"
    if (result === "0-1") return "bg-red-100 text-red-800"
    if (result === "1/2-1/2") return "bg-yellow-100 text-yellow-800"
    return "bg-gray-50 text-gray-400"
  }

  if (players.length === 0) {
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
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-mainAccent to-mainAccentDark">
                <th className="sticky left-0 z-20 bg-gradient-to-r from-mainAccent to-mainAccentDark border-r border-white/20 px-4 py-3 text-left font-semibold text-white min-w-[180px]">
                  Speler
                </th>
                {players.map(player => (
                  <th
                    key={player.user_id}
                    className="border-r border-white/20 px-3 py-3 text-center font-semibold text-white min-w-[90px] last:border-r-0"
                  >
                    <div className="text-xs leading-tight">
                      {player.voornaam.split(' ')[0]}
                      <br />
                      {player.achternaam}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((player, rowIndex) => {
                const playerResults = crossTableData.get(player.user_id)
                return (
                  <tr key={player.user_id} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="sticky left-0 z-10 bg-inherit border-r border-gray-200 px-4 py-3 font-medium text-gray-900">
                      {player.voornaam} {player.achternaam}
                    </td>
                    {players.map(opponent => {
                      if (player.user_id === opponent.user_id) {
                        return (
                          <td
                            key={opponent.user_id}
                            className="border-r border-gray-200 px-2 py-3 text-center bg-gray-100 last:border-r-0"
                          >
                            <span className="text-gray-400">-</span>
                          </td>
                        )
                      }
                      const result = playerResults?.get(opponent.user_id)
                      const displayResult = result?.result || "-"
                      return (
                        <td
                          key={opponent.user_id}
                          className={`border-r border-gray-200 px-2 py-3 text-center font-medium last:border-r-0 ${getResultClass(displayResult)}`}
                        >
                          {displayResult}
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

      {/* Mobile View - Card based */}
      <div className="md:hidden space-y-4">
        {players.map(player => {
          const playerResults = crossTableData.get(player.user_id)
          const allGames = Array.from(playerResults?.entries() || [])
            .map(([opponentId, result]) => ({
              opponentId,
              opponentName: getPlayerName(opponentId),
              result: result.result
            }))
            .sort((a, b) => {
              // Sort: played games first, then by name
              if (a.result !== "-" && b.result === "-") return -1
              if (a.result === "-" && b.result !== "-") return 1
              return a.opponentName.localeCompare(b.opponentName)
            })

          return (
            <div key={player.user_id} className="bg-white rounded-lg shadow-md p-4">
              <div className="mb-3 pb-3 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 text-lg">
                  {player.voornaam} {player.achternaam}
                </h3>
              </div>
              <div className="space-y-2">
                {allGames.map(game => (
                  <div
                    key={game.opponentId}
                    className={`flex justify-between items-center px-3 py-2.5 rounded-lg border transition-all ${
                      game.result !== "-"
                        ? `${getResultClass(game.result)} border-transparent`
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <span className={`font-medium ${game.result === "-" ? 'text-gray-600' : 'text-gray-900'}`}>
                      {game.opponentName}
                    </span>
                    <span className={`text-sm font-semibold ${
                      game.result === "-" 
                        ? 'text-gray-400' 
                        : game.result === "1-0"
                        ? 'text-green-800'
                        : game.result === "0-1"
                        ? 'text-red-800'
                        : 'text-yellow-800'
                    }`}>
                      {game.result}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


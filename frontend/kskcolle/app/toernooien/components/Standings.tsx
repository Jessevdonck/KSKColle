"use client"

import Link from "next/link"
import { Trophy, Medal, Award, User, X, Calendar } from "lucide-react"
import { useState } from "react"

interface StandingsProps {
  tournament: {
    tournament_id: number
    naam: string
    rondes: number
    type: "SWISS" | "ROUND_ROBIN"
    participations: Array<{
      user: {
        user_id: number
        voornaam: string
        achternaam: string
      }
    }>
  }
  rounds: Array<{
    round_id: number
    ronde_nummer: number
    games: Array<{
      game_id: number
      speler1: { user_id: number; voornaam: string; achternaam: string }
      speler2: { user_id: number; voornaam: string; achternaam: string } | null
      result: string | null
    }>
  }>
}

interface PlayerScore {
  user_id: number
  voornaam: string
  achternaam: string
  score: number
  gamesPlayed: number
  tieBreak: number
}

interface PlayerGame {
  round: number
  opponent: string | null
  result: string | null
  color: "white" | "black" | null
  score: number
}

const createUrlFriendlyName = (voornaam: string, achternaam: string) =>
  `${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, "_")

export default function Standings({ tournament, rounds }: StandingsProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerScore | null>(null)

  const getByeText = (result: string | null) => {
    // Always show "BYE" in player history modal
    return "BYE"
  }
  const playerScores = calculateStandings(tournament, rounds)

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />
      default:
        return <span className="text-xs font-bold text-gray-600 w-4 text-center">{position}</span>
    }
  }

  const getPositionStyle = (position: number) => {
    const base = "flex items-center justify-center w-8 h-8 rounded-full font-bold transition-all"
    switch (position) {
      case 1:
        return `${base} bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-md`
      case 2:
        return `${base} bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-sm`
      case 3:
        return `${base} bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm`
      default:
        return `${base} bg-gradient-to-br from-neutral-100 to-neutral-200 text-gray-700`
    }
  }

  const getPlayerHistory = (playerId: number): PlayerGame[] => {
    const history: PlayerGame[] = []

    rounds.forEach((round) => {
      const playerGame = round.games.find(
        (game) => game.speler1.user_id === playerId || game.speler2?.user_id === playerId,
      )

      if (playerGame) {
        const isPlayer1 = playerGame.speler1.user_id === playerId
        const opponent = isPlayer1 ? playerGame.speler2 : playerGame.speler1

        let score = 0
        if (playerGame.result === "1-0") {
          score = isPlayer1 ? 1 : 0
        } else if (playerGame.result === "0-1") {
          score = isPlayer1 ? 0 : 1
        } else if (playerGame.result === "½-½" || playerGame.result === "1/2-1/2") {
          score = 0.5
        } else if (playerGame.result === "0.5-0") {
          // Absent with message - player gets 0.5 points
          score = isPlayer1 ? 0.5 : 0
        } else if (playerGame.result && playerGame.result.startsWith("ABS-")) {
          // Absent with message from Sevilla import - extract score
          const absScore = parseFloat(playerGame.result.substring(4)) || 0
          score = isPlayer1 ? absScore : 0
        }

        // Determine opponent display
        let opponentDisplay: string | null = null
        if (opponent) {
          opponentDisplay = `${opponent.voornaam} ${opponent.achternaam}`
        } else {
          // No opponent - check if result contains ABS
          if (playerGame.result && playerGame.result.includes("ABS")) {
            opponentDisplay = "Abs with msg"
          } else {
            opponentDisplay = null // Will be displayed as "BYE" in UI
          }
        }

        history.push({
          round: round.ronde_nummer,
          opponent: opponentDisplay,
          result: playerGame.result,
          color: isPlayer1 ? "white" : "black",
          score,
        })
      } else {
        // Player is bye - BYE gives 0.5 points
        history.push({
          round: round.ronde_nummer,
          opponent: null,
          result: null,
          color: null,
          score: 0.5,
        })
      }
    })

    return history.sort((a, b) => a.round - b.round)
  }

  const getResultDisplay = (result: string | null, score: number) => {
    if (!result) return "Bye"
    if (score === 1) return "Winst"
    if (score === 0.5) {
      // Check if it's absent with message or draw
      if (result && result.includes("ABS")) return "Abs with msg"
      return "Remise"
    }
    if (score === 0) return "Verlies"
    
    // Handle special results
    switch (result) {
      case "1-0FF":
        return "Zwart forfait"
      case "0-1FF":
        return "Wit forfait"
      case "0-0":
        return "Scheidsrechterlijke beslissing"
      default:
        return result
    }
  }

  const getResultColor = (score: number) => {
    if (score === 1) return "text-green-600 bg-green-50"
    if (score === 0.5) return "text-yellow-600 bg-yellow-50"
    if (score === 0) return "text-red-600 bg-red-50"
    return "text-gray-600 bg-gray-50"
  }

  return (
    <>
      <div className="space-y-1">
        {playerScores.map((player, idx) => {
          const position = idx + 1
          const isTop = position <= 3
          return (
            <div
              key={player.user_id}
              className={`rounded-lg border transition-all hover:shadow-sm cursor-pointer ${
                isTop
                  ? "bg-gradient-to-r from-mainAccent/5 to-mainAccentDark/5 border-mainAccent/20 shadow-sm"
                  : "bg-white border-neutral-200 hover:border-mainAccent/30"
              }`}
              onClick={() => setSelectedPlayer(player)}
            >
              <div className="p-2 flex items-center gap-2">
                {/* Position */}
                <div className={getPositionStyle(position)}>{getPositionIcon(position)}</div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-textColor group-hover:text-mainAccent transition-colors truncate text-xs">
                    {player.voornaam} {player.achternaam}
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {player.gamesPlayed}
                    </span>
                  </div>
                </div>

                {/* Score & Tie-break */}
                <div className="text-right">
                  <div className={`text-lg font-bold ${isTop ? "text-mainAccent" : "text-textColor"}`}>
                    {player.score}
                  </div>
                  <div className="text-xs text-gray-500">
                    {tournament.type === "SWISS" ? (
                      <>Bh-W: {player.tieBreak.toFixed(2)}</>
                    ) : (
                      <>
                        SB<sup>2</sup>: {player.tieBreak.toFixed(2)}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-mainAccent/10 to-mainAccentDark/10 border-b border-mainAccent/20 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-mainAccent/20 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-mainAccent" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-textColor">
                    {selectedPlayer.voornaam} {selectedPlayer.achternaam}
                  </h2>
                  <p className="text-xs text-gray-600">Toernooi geschiedenis</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Stats Summary */}
            <div className="p-3 border-b border-gray-200">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-mainAccent">{selectedPlayer.score}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Punten</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-textColor">{selectedPlayer.gamesPlayed}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Partijen</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-textColor">{selectedPlayer.tieBreak.toFixed(2)}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    {tournament.type === "SWISS" ? "Bh-W" : "SB²"}
                  </div>
                </div>
              </div>
            </div>

            {/* Games History */}
            <div className="p-3 max-h-80 overflow-y-auto">
              <h3 className="font-semibold text-textColor mb-2 flex items-center gap-1 text-sm">
                <Calendar className="h-3 w-3" />
                Partijen per ronde
              </h3>
              <div className="space-y-1">
                {getPlayerHistory(selectedPlayer.user_id).map((game, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-mainAccent/20 rounded-full flex items-center justify-center text-xs font-semibold text-mainAccent">
                        R{game.round}
                      </div>
                      <div>
                        <div className="font-medium text-xs text-textColor">
                          {game.opponent ? game.opponent : "BYE"}
                        </div>
                        {game.color && (
                          <div className="text-xs text-gray-500">{game.color === "white" ? "Wit" : "Zwart"}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getResultColor(game.score)}`}>
                        {game.result ? getResultDisplay(game.result, game.score) : "Bye"}
                      </span>
                      <div className="text-sm font-bold text-textColor min-w-[1.5rem] text-center">{game.score}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <Link
                  href={`/profile/${createUrlFriendlyName(selectedPlayer.voornaam, selectedPlayer.achternaam)}`}
                  className="text-xs text-mainAccent hover:text-mainAccentDark transition-colors font-medium"
                >
                  Bekijk volledig profiel →
                </Link>
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="px-3 py-1.5 bg-mainAccent text-white rounded-lg hover:bg-mainAccentDark transition-colors text-xs font-medium"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function calculateStandings(tournament: StandingsProps["tournament"], rounds: StandingsProps["rounds"]): PlayerScore[] {
  // 1) init
  const scoreMap: Record<number, number> = {}
  const gamesPlayed: Record<number, number> = {}
  const buchholzList: Record<number, number[]> = {}
  const sbMap: Record<number, number> = {}

  // deelnemers
  tournament.participations.forEach(({ user }) => {
    scoreMap[user.user_id] = 0
    gamesPlayed[user.user_id] = 0
    buchholzList[user.user_id] = []
    sbMap[user.user_id] = 0
  })

  // 2) score & gamesPlayed
  rounds.forEach(({ games }) => {
    // First, process all games with results
    games.forEach(({ speler1, speler2, result }) => {
      const p1 = speler1.user_id
      const p2 = speler2?.user_id ?? null

      if (result) {
        gamesPlayed[p1]++
        if (p2) gamesPlayed[p2]++

        if (result === "1-0") {
          scoreMap[p1] += 1
        } else if (result === "0-1" && p2) {
          scoreMap[p2] += 1
        } else if (result === "½-½" || result === "1/2-1/2") {
          scoreMap[p1] += 0.5
          if (p2) scoreMap[p2] += 0.5
        } else if (result === "0.5-0") {
          // Absent with message - player gets 0.5 points
          scoreMap[p1] += 0.5
        } else if (result && result.startsWith("ABS-")) {
          // Absent with message from Sevilla import - extract score
          const absScore = parseFloat(result.substring(4)) || 0
          scoreMap[p1] += absScore
        }
      }
    })

    // Then, check for BYE players (players who didn't play any game this round)
    const playersWhoPlayed = new Set<number>()
    games.forEach(({ speler1, speler2 }) => {
      playersWhoPlayed.add(speler1.user_id)
      if (speler2) playersWhoPlayed.add(speler2.user_id)
    })

    // Any participant who didn't play gets a BYE (0.5 points)
    tournament.participations.forEach(({ user }) => {
      if (!playersWhoPlayed.has(user.user_id)) {
        scoreMap[user.user_id] += 0.5
        // Note: BYE doesn't count as a played game, so gamesPlayed stays the same
      }
    })
  })

  // 3) buchholzList & sbMap
  rounds.forEach(({ games }) =>
    games.forEach(({ speler1, speler2, result }) => {
      const p1 = speler1.user_id
      const p2 = speler2?.user_id ?? null

      // Buchholz: volledige score van tegenstander
      if (p2) {
        buchholzList[p1].push(scoreMap[p2])
        buchholzList[p2].push(scoreMap[p1])
      }

      // SB-score
      if (result === "1-0" && p2) {
        sbMap[p1] += scoreMap[p2]
      } else if (result === "0-1" && p2) {
        sbMap[p2] += scoreMap[p1]
      } else if ((result === "½-½" || result === "1/2-1/2") && p2) {
        sbMap[p1] += scoreMap[p2] * 0.5
        sbMap[p2] += scoreMap[p1] * 0.5
      }
    }),
  )

  // 4) finally: bouw array met tieBreak
  const players: PlayerScore[] = Object.entries(scoreMap).map(([uid, s]) => {
    const id = Number(uid)
    let tie: number

    if (tournament.type === "SWISS") {
      const opps = buchholzList[id]
      const sum = opps.reduce((a, b) => a + b, 0)
      const worst = opps.length > 0 ? Math.min(...opps) : 0
      tie = sum - worst
    } else {
      tie = Math.pow(sbMap[id], 2)
    }

    return {
      user_id: id,
      voornaam: "", // vullen we hieronder
      achternaam: "",
      score: s,
      gamesPlayed: gamesPlayed[id],
      tieBreak: tie,
    }
  })

  // vul voornaam/achternaam
  tournament.participations.forEach(({ user }) => {
    const p = players.find((p) => p.user_id === user.user_id)!
    p.voornaam = user.voornaam
    p.achternaam = user.achternaam
  })

  // 5) sorteren: eerst op score, dan tieBreak
  players.sort((a, b) => (b.score !== a.score ? b.score - a.score : b.tieBreak - a.tieBreak))

  return players
}

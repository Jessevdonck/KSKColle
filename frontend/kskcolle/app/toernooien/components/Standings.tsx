import React from "react"
import Link from "next/link"
import { Trophy, Medal, Award, User } from "lucide-react"

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

const createUrlFriendlyName = (voornaam: string, achternaam: string) =>
  `${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, "_")

export default function Standings({ tournament, rounds }: StandingsProps) {
  const playerScores = calculateStandings(tournament, rounds)

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-sm font-bold text-gray-600 w-5 text-center">{position}</span>
    }
  }

  const getPositionStyle = (position: number) => {
    const base = "flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all"
    switch (position) {
      case 1:
        return `${base} bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-lg`
      case 2:
        return `${base} bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md`
      case 3:
        return `${base} bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md`
      default:
        return `${base} bg-gradient-to-br from-neutral-100 to-neutral-200 text-gray-700`
    }
  }

  return (
    <div className="space-y-4">
      {playerScores.map((player, idx) => {
        const position = idx + 1
        const isTop = position <= 3

        return (
          <div
            key={player.user_id}
            className={`rounded-lg border transition-all hover:shadow-md ${
              isTop
                ? "bg-gradient-to-r from-mainAccent/5 to-mainAccentDark/5 border-mainAccent/20 shadow-sm"
                : "bg-white border-neutral-200 hover:border-mainAccent/30"
            }`}
          >
            <div className="p-4 flex items-center gap-4">
              {/* Position */}
              <div className={getPositionStyle(position)}>{getPositionIcon(position)}</div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/profile/${createUrlFriendlyName(player.voornaam, player.achternaam)}`}
                  className="block group"
                >
                  <div className="font-semibold text-textColor group-hover:text-mainAccent transition-colors truncate">
                    {player.voornaam} {player.achternaam}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {player.gamesPlayed} gespeeld
                    </span>
                  </div>
                </Link>
              </div>

              {/* Score & Tie-break */}
              <div className="text-right">
                <div className={`text-2xl font-bold ${isTop ? "text-mainAccent" : "text-textColor"}`}>
                  {player.score}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">punten</div>
                <div className="text-xs text-gray-500 mt-1">
                  {tournament.type === "SWISS" ? (
                    <>Bh-W: {player.tieBreak.toFixed(2)}</>
                  ) : (
                    <>SB<sup>2</sup>: {player.tieBreak.toFixed(2)}</>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function calculateStandings(
  tournament: StandingsProps["tournament"],
  rounds: StandingsProps["rounds"]
): PlayerScore[] {
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
  rounds.forEach(({ games }) =>
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
        }
      }
    })
  )

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
    })
  )

  // 4) finally: bouw array met tieBreak
  const players: PlayerScore[] = Object.entries(scoreMap).map(([uid, s]) => {
    const id = Number(uid)
    let tie: number
    if (tournament.type === "SWISS") {
      const opps = buchholzList[id]
      const sum   = opps.reduce((a, b) => a + b, 0)
      const worst = opps.length > 0 ? Math.min(...opps) : 0
      tie = sum - worst
    } else {
      tie = Math.pow(sbMap[id], 2)
    }
    return {
      user_id:      id,
      voornaam:     "",     // vullen we hieronder
      achternaam:   "",
      score:        s,
      gamesPlayed:  gamesPlayed[id],
      tieBreak:     tie,
    }
  })

  // vul voornaam/achternaam
  tournament.participations.forEach(({ user }) => {
    const p = players.find((p) => p.user_id === user.user_id)!
    p.voornaam   = user.voornaam
    p.achternaam = user.achternaam
  })

  // 5) sorteren: eerst op score, dan tieBreak
  players.sort((a, b) =>
    b.score !== a.score ? b.score - a.score : b.tieBreak - a.tieBreak
  )

  return players
}

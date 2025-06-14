import Link from "next/link"
import { Trophy, Medal, Award, User } from "lucide-react"

interface StandingsProps {
  tournament: {
    tournament_id: number
    naam: string
    rondes: number
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
}

const createUrlFriendlyName = (voornaam: string, achternaam: string) => {
  return `${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, "_")
}

export default function Standings({ tournament, rounds }: StandingsProps) {
  const playerScores: PlayerScore[] = calculateStandings(tournament, rounds)

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
    const baseStyle = "flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all"
    switch (position) {
      case 1:
        return `${baseStyle} bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-lg`
      case 2:
        return `${baseStyle} bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md`
      case 3:
        return `${baseStyle} bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md`
      default:
        return `${baseStyle} bg-gradient-to-br from-neutral-100 to-neutral-200 text-gray-700`
    }
  }

  return (
    <div className="space-y-4">
      {playerScores.map((player, index) => {
        const position = index + 1
        const isTopThree = position <= 3

        return (
          <div
            key={player.user_id}
            className={`rounded-lg border transition-all hover:shadow-md ${
              isTopThree
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

              {/* Score */}
              <div className="text-right">
                <div className={`text-2xl font-bold ${isTopThree ? "text-mainAccent" : "text-textColor"}`}>
                  {player.score}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">punten</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function calculateStandings(tournament: StandingsProps["tournament"], rounds: StandingsProps["rounds"]): PlayerScore[] {
  const playerScores: { [key: number]: PlayerScore } = {}

  tournament.participations.forEach((participation) => {
    const player = participation.user
    playerScores[player.user_id] = {
      user_id: player.user_id,
      voornaam: player.voornaam,
      achternaam: player.achternaam,
      score: 0,
      gamesPlayed: 0,
    }
  })

  rounds.forEach((round) => {
    round.games.forEach((game) => {
      const { speler1, speler2, result } = game

      if (result) {
        if (playerScores[speler1.user_id]) {
          playerScores[speler1.user_id].gamesPlayed++
        }

        if (speler2 && playerScores[speler2.user_id]) {
          playerScores[speler2.user_id].gamesPlayed++
        }

        if (result === "1-0" && playerScores[speler1.user_id]) {
          playerScores[speler1.user_id].score += 1
        } else if (result === "0-1" && speler2 && playerScores[speler2.user_id]) {
          playerScores[speler2.user_id].score += 1
        } else if (result === "½-½" || result === "1/2-1/2") {
          if (playerScores[speler1.user_id]) {
            playerScores[speler1.user_id].score += 0.5
          }
          if (speler2 && playerScores[speler2.user_id]) {
            playerScores[speler2.user_id].score += 0.5
          }
        }
      }
    })
  })

  return Object.values(playerScores).sort((a, b) => b.score - a.score)
}

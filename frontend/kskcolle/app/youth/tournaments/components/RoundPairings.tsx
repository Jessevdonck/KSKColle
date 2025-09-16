import Link from "next/link"
import { ChevronRight, User, Calendar, Clock } from "lucide-react"
import { sortGamesByScore, sortGamesByPairingOrder, sortSevillaGamesWithPostponed } from '@/lib/gameSorting'

interface PlayerScore {
  user_id: number
  voornaam: string
  achternaam: string
  score: number
  gamesPlayed: number
  tieBreak: number
}

interface RoundPairingsProps {
  round: {
    round_id: number
    ronde_nummer: number
    ronde_datum?: string | null
    startuur?: string
    games?: Array<{
      game_id: number
      speler1: { user_id: number; voornaam: string; achternaam: string }
      speler2: { user_id: number; voornaam: string; achternaam: string } | null
      result: string | null
    }>
  }
  tournament?: {
    tournament_id: number
    naam: string
    rondes: number
    type: "SWISS" | "ROUND_ROBIN"
    is_sevilla_imported?: boolean
    participations: Array<{
      user: {
        user_id: number
        voornaam: string
        achternaam: string
      }
    }>
  }
  allRounds?: Array<{
    round_id: number
    ronde_nummer: number
    type: 'REGULAR' | 'MAKEUP'
    games: Array<{
      game_id: number
      speler1: { user_id: number; voornaam: string; achternaam: string }
      speler2: { user_id: number; voornaam: string; achternaam: string } | null
      result: string | null
    }>
  }>
}

export default function RoundPairings({ round, tournament, allRounds }: RoundPairingsProps) {
  const createUrlFriendlyName = (voornaam: string, achternaam: string) => {
    return `${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, "_")
  }

  // Calculate player scores if tournament data is available
  const playerScores = tournament && allRounds ? calculateStandings(tournament, allRounds) : []
  const getPlayerScore = (userId: number) => {
    const player = playerScores.find(p => p.user_id === userId)
    return player ? player.score : 0
  }

  if (!round.games || round.games.length === 0) {
    return (
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-bold text-textColor mb-2 flex items-center gap-2">
            <div className="bg-mainAccent text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {round.ronde_nummer}
            </div>
            Ronde {round.ronde_nummer}
          </h3>
        </div>

        <div className="text-center py-12">
          <div className="bg-mainAccent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <User className="h-8 w-8 text-mainAccent" />
          </div>
          <h4 className="text-base font-semibold text-gray-700 mb-2">Nog geen partijen</h4>
          <p className="text-gray-500 text-sm">De partijen voor deze ronde zijn nog niet gegenereerd.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-xl font-bold text-textColor mb-2 flex items-center gap-2">
          <div className="bg-mainAccent text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {round.ronde_nummer}
          </div>
          Ronde {round.ronde_nummer}
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
          <p>{round.games.length} partijen</p>
          {round.ronde_datum && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(round.ronde_datum).toLocaleDateString('nl-NL', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              {round.startuur && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{round.startuur}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-mainAccent to-mainAccentDark text-white">
              <th className="px-2 py-1 text-left font-semibold text-sm">Wit</th>
              <th className="px-2 py-1 text-center font-semibold w-8"></th>
              <th className="px-2 py-1 text-left font-semibold text-sm">Zwart</th>
              <th className="px-2 py-1 text-center font-semibold text-sm">Uitslag</th>
            </tr>
          </thead>
          <tbody>
        {(() => {
          return tournament?.is_sevilla_imported 
            ? sortSevillaGamesWithPostponed(round.games)
            : round.games;
        })().map((game, index) => (
              <tr
                key={game.game_id}
                className={`border-b border-neutral-100 ${
                  index % 2 === 0 ? "bg-white" : "bg-neutral-50/50"
                } hover:bg-mainAccent/5 transition-colors`}
              >
                <td className="px-2 py-1">
                  <Link
                    href={`/profile/${createUrlFriendlyName(game.speler1.voornaam, game.speler1.achternaam)}`}
                    className="font-medium text-textColor hover:text-mainAccent transition-colors flex items-center gap-2 group text-sm"
                  >
                    <div className="w-6 h-6 bg-white border-2 border-neutral-300 rounded-full flex items-center justify-center text-xs font-bold group-hover:border-mainAccent transition-colors">
                      W
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{`${game.speler1.voornaam} ${game.speler1.achternaam}`}</span>
                      {playerScores.length > 0 && (
                        <span className="text-xs text-gray-500 font-normal">
                          ({getPlayerScore(game.speler1.user_id)} pt)
                        </span>
                      )}
                    </div>
                  </Link>
                </td>

                <td className="px-2 py-1 text-center">
                  <ChevronRight className="h-3 w-3 text-gray-400 mx-auto" />
                </td>

                <td className="px-2 py-1">
                  {game.speler2 ? (
                    <Link
                      href={`/profile/${createUrlFriendlyName(game.speler2.voornaam, game.speler2.achternaam)}`}
                      className="font-medium text-textColor hover:text-mainAccent transition-colors flex items-center gap-2 group text-sm"
                    >
                      <div className="w-6 h-6 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white group-hover:border-mainAccent transition-colors">
                        Z
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{`${game.speler2.voornaam} ${game.speler2.achternaam}`}</span>
                        {playerScores.length > 0 && (
                          <span className="text-xs text-gray-500 font-normal">
                            ({getPlayerScore(game.speler2.user_id)} pt)
                          </span>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500 italic text-sm">
                      <div className="w-6 h-6 bg-gray-200 border-2 border-gray-300 rounded-full flex items-center justify-center text-xs">
                        -
                      </div>
                      Bye
                    </div>
                  )}
                </td>

                <td className="px-2 py-1 text-center">
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      game.result && game.result !== "not_played"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                  >
                    {game.result && game.result !== "not_played" ? game.result : "Nog te spelen"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function calculateStandings(tournament: RoundPairingsProps["tournament"], rounds: RoundPairingsProps["allRounds"]): PlayerScore[] {
  if (!tournament || !rounds) return []

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
  rounds.forEach(({ games, type: roundType }) => {
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
  })

  // 3) buchholz & sonneborn-berger
  rounds.forEach(({ games, type: roundType }) => {
    games.forEach(({ speler1, speler2, result }) => {
      const p1 = speler1.user_id
      const p2 = speler2?.user_id ?? null

      if (result && p2) {
        const p1Score = scoreMap[p1]
        const p2Score = scoreMap[p2]

        // Buchholz: sum of opponents' scores
        buchholzList[p1].push(p2Score)
        buchholzList[p2].push(p1Score)

        // Sonneborn-Berger: sum of (opponent's score * result)
        const p1Result = result === "1-0" ? 1 : result === "0-1" ? 0 : 0.5
        const p2Result = result === "1-0" ? 0 : result === "0-1" ? 1 : 0.5

        sbMap[p1] += p2Score * p1Result
        sbMap[p2] += p1Score * p2Result
      }
    })
  })

  // 4) final standings
  return tournament.participations
    .map(({ user }) => ({
      user_id: user.user_id,
      voornaam: user.voornaam,
      achternaam: user.achternaam,
      score: scoreMap[user.user_id] || 0,
      gamesPlayed: gamesPlayed[user.user_id] || 0,
      tieBreak: sbMap[user.user_id] || 0,
    }))
    .sort((a, b) => {
      // Primary: score (descending)
      if (b.score !== a.score) return b.score - a.score
      // Secondary: tiebreak (descending)
      return b.tieBreak - a.tieBreak
    })
}

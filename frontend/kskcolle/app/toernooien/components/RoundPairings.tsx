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
  schaakrating_elo?: number
}

interface RoundPairingsProps {
  round: {
    round_id: number
    ronde_nummer: number
    ronde_datum?: string | null
    startuur?: string
    games?: Array<{
      game_id: number
      speler1: { user_id: number; voornaam: string; achternaam: string; schaakrating_elo?: number }
      speler2: { user_id: number; voornaam: string; achternaam: string; schaakrating_elo?: number } | null
      result: string | null
      uitgestelde_datum?: string
    }>
  }
  tournament?: {
    tournament_id: number
    naam: string
    rondes: number
    type: "SWISS" | "ROUND_ROBIN"
    rating_enabled?: boolean
    is_youth?: boolean
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


  // Calculate player scores BEFORE this round (up to but not including current round)
  const playerScores = tournament && allRounds 
    ? calculateStandingsBeforeRound(tournament, allRounds, round.ronde_nummer) 
    : []
  const getPlayerScore = (userId: number) => {
    const player = playerScores.find(p => p.user_id === userId)
    return player ? player.score : 0
  }

  const getByeText = (result: string | null) => {
    if (!result || result === "...") return "Nog te spelen"
    
    // Check if it's an absent with message result (ABS-0.5, ABS-1, etc.)
    if (result.startsWith("ABS-")) {
      return "Abs with msg"
    }
    
    // Check if it's a bye result (e.g., "0.5-0", "1-0", "0-0")
    if (result.includes("-0") && result !== "0-0") {
      return "Bye"
    }
    
    return "Bye"
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
    <div className="text-[0.9em]">
      <div className="mb-3">
        <h3 className="text-lg font-bold text-textColor mb-1.5 flex items-center gap-1.5">
          <div className="bg-mainAccent text-white rounded-full w-5 h-5 flex items-center justify-center text-[0.7em] font-bold">
            {round.ronde_nummer}
          </div>
          Ronde {round.ronde_nummer}
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-xs text-gray-600">
          <p>
            {round.games.length} partijen
            {!round.round_id && <span className="text-gray-500 ml-2">(Nog niet gegenereerd)</span>}
          </p>
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

      {round.games.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-mainAccent to-mainAccentDark text-white">
                  <th className="px-1.5 py-0.5 text-center font-semibold text-xs w-12">Bord</th>
                  <th className="px-1.5 py-0.5 text-left font-semibold text-xs">Wit</th>
                  {tournament?.is_youth !== true && (
                    <th className="px-1.5 py-0.5 text-center font-semibold text-xs w-16">Rating</th>
                  )}
                  <th className="px-1.5 py-0.5 text-center font-semibold text-xs w-12">Punten</th>
                  <th className="px-1.5 py-0.5 text-center font-semibold w-8"></th>
                  <th className="px-1.5 py-0.5 text-left font-semibold text-xs">Zwart</th>
                  {tournament?.is_youth !== true && (
                    <th className="px-1.5 py-0.5 text-center font-semibold text-xs w-16">Rating</th>
                  )}
                  <th className="px-1.5 py-0.5 text-center font-semibold text-xs w-12">Punten</th>
                  <th className="px-1.5 py-0.5 text-center font-semibold text-xs w-24">Uitslag</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const tournamentWithSevilla = tournament as any;
                  return tournamentWithSevilla?.is_sevilla_imported 
                    ? sortSevillaGamesWithPostponed(round.games as any)
                    : round.games;
                })().map((game, index) => (
                <tr
                  key={game.game_id}
                  className={`border-b border-neutral-100 ${
                    index % 2 === 0 ? "bg-white" : "bg-neutral-50/50"
                  } hover:bg-mainAccent/5 transition-colors`}
                >
                  <td className="px-1.5 py-0.5 text-center">
                    <div className="bg-mainAccent/10 text-mainAccent rounded-full w-5 h-5 flex items-center justify-center text-[0.7em] font-bold">
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-1.5 py-0.5">
                    <Link
                      href={`/profile/${createUrlFriendlyName(game.speler1.voornaam, game.speler1.achternaam)}`}
                      className="font-medium text-textColor hover:text-mainAccent transition-colors flex items-center gap-1.5 group text-xs whitespace-nowrap"
                    >
                      <div className="w-5 h-5 bg-white border-2 border-neutral-300 rounded-full flex items-center justify-center text-[0.7em] font-bold group-hover:border-mainAccent transition-colors">
                        W
                      </div>
                      <span>{`${game.speler1.voornaam} ${game.speler1.achternaam}`}</span>
                    </Link>
                  </td>
                  {tournament?.is_youth !== true && (
                    <td className="px-1.5 py-0.5 text-center">
                      <span className="text-sm font-medium text-gray-700">
                        {game.speler1.schaakrating_elo}
                      </span>
                    </td>
                  )}
                  <td className="px-1.5 py-0.5 text-center">
                    {playerScores.length > 0 ? (
                      <span className="text-sm font-medium text-mainAccent">
                        {getPlayerScore(game.speler1.user_id)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>

                  <td className="px-1.5 py-0.5 text-center">
                    <ChevronRight className="h-3 w-3 text-gray-400 mx-auto" />
                  </td>

                  <td className="px-1.5 py-0.5">
                    {game.speler2 ? (
                      <Link
                        href={`/profile/${createUrlFriendlyName(game.speler2.voornaam, game.speler2.achternaam)}`}
                        className="font-medium text-textColor hover:text-mainAccent transition-colors flex items-center gap-2 group text-xs whitespace-nowrap"
                      >
                        <div className="w-5 h-5 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center text-[0.7em] font-bold text-white group-hover:border-mainAccent transition-colors">
                          Z
                        </div>
                        <span>{`${game.speler2.voornaam} ${game.speler2.achternaam}`}</span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500 italic text-sm whitespace-nowrap">
                        <div className="w-5 h-5 bg-gray-200 border-2 border-gray-300 rounded-full flex items-center justify-center text-[0.7em]">
                          -
                        </div>
                        {getByeText(game.result)}
                      </div>
                    )}
                  </td>
                  {tournament?.is_youth !== true && (
                    <td className="px-1.5 py-0.5 text-center">
                      {game.speler2 ? (
                        <span className="text-sm font-medium text-gray-700">
                          {game.speler2.schaakrating_elo}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  )}
                  <td className="px-1.5 py-0.5 text-center">
                    {game.speler2 && playerScores.length > 0 ? (
                      <span className="text-sm font-medium text-mainAccent">
                        {getPlayerScore(game.speler2.user_id)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>

                  <td className="px-1.5 py-0.5 text-center">
                    <span
                      className={`px-0.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                        game.uitgestelde_datum
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : game.result && game.result !== "not_played" && game.result !== "..."
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {game.uitgestelde_datum
                        ? "Uitgesteld"
                        : game.result && game.result !== "not_played" && game.result !== "..."
                        ? game.result
                        : "..."}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {(() => {
            const tournamentWithSevilla = tournament as any;
            return tournamentWithSevilla?.is_sevilla_imported 
              ? sortSevillaGamesWithPostponed(round.games as any)
              : round.games;
          })().map((game, index) => (
            <div
              key={game.game_id}
              className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4"
            >
              {/* Header with Board Number and Result */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-mainAccent/10 text-mainAccent rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="text-sm font-medium text-gray-600">Bord {index + 1}</div>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    game.uitgestelde_datum
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : game.result && game.result !== "not_played" && game.result !== "..."
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-gray-100 text-gray-600 border border-gray-200"
                  }`}
                >
                  {game.uitgestelde_datum
                    ? "Uitgesteld"
                    : game.result && game.result !== "not_played" && game.result !== "..."
                    ? game.result
                    : "..."}
                </span>
              </div>

              {/* Players */}
              <div className="space-y-4">
                {/* White Player */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white border-2 border-neutral-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    W
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/profile/${createUrlFriendlyName(game.speler1.voornaam, game.speler1.achternaam)}`}
                      className="font-medium text-textColor hover:text-mainAccent transition-colors block whitespace-nowrap"
                    >
                      {game.speler1.voornaam} {game.speler1.achternaam}
                    </Link>
                    <div className="flex items-center gap-4 mt-0.5 text-xs text-gray-500">
                      {tournament?.is_youth !== true && (
                        <span>ELIO: {game.speler1.schaakrating_elo}</span>
                      )}
                      {playerScores.length > 0 && (
                        <span className="text-mainAccent font-medium">
                          {getPlayerScore(game.speler1.user_id)} pt
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* VS Divider */}
                <div className="flex items-center justify-center">
                  <div className="text-gray-400 text-sm font-medium">VS</div>
                </div>

                {/* Black Player */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    Z
                  </div>
                  <div className="flex-1 min-w-0">
                    {game.speler2 ? (
                      <Link
                        href={`/profile/${createUrlFriendlyName(game.speler2.voornaam, game.speler2.achternaam)}`}
                        className="font-medium text-textColor hover:text-mainAccent transition-colors block whitespace-nowrap"
                      >
                        {game.speler2.voornaam} {game.speler2.achternaam}
                      </Link>
                    ) : (
                      <div className="font-medium text-gray-500 italic whitespace-nowrap">
                        {getByeText(game.result)}
                      </div>
                    )}
                    {game.speler2 && (
                      <div className="flex items-center gap-4 mt-0.5 text-xs text-gray-500">
                        {tournament?.is_youth !== true && (
                          <span>ELIO: {game.speler2.schaakrating_elo}</span>
                        )}
                        {playerScores.length > 0 && (
                          <span className="text-mainAccent font-medium">
                            {getPlayerScore(game.speler2.user_id)} pt
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-8 text-center">
          <div className="text-gray-500 text-lg mb-2">Ronde {round.ronde_nummer}</div>
          <div className="text-gray-400 text-sm">
            {!round.round_id ? "Nog niet gegenereerd" : "Geen partijen beschikbaar"}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Calculate standings BEFORE a specific round (i.e., scores at the time of pairing)
 * This shows what the score was when the pairings were made, not the current score
 */
function calculateStandingsBeforeRound(
  tournament: RoundPairingsProps["tournament"], 
  rounds: RoundPairingsProps["allRounds"],
  beforeRoundNumber: number
): PlayerScore[] {
  if (!tournament || !rounds) return []

  // 1) init
  const scoreMap: Record<number, number> = {}
  const gamesPlayed: Record<number, number> = {}

  // deelnemers
  tournament.participations.forEach(({ user }) => {
    scoreMap[user.user_id] = 0
    gamesPlayed[user.user_id] = 0
  })

  // 2) score & gamesPlayed - only for rounds BEFORE the current round
  rounds.forEach(({ games, type: roundType, ronde_nummer }) => {
    // Skip makeup rounds for points calculation - they don't count for standings
    const isMakeupRound = roundType === 'MAKEUP'
    if (isMakeupRound) return
    
    // Only count rounds that happened BEFORE this round
    if (ronde_nummer >= beforeRoundNumber) return
    
    // Process all games with results (only for regular rounds before current)
    games.forEach(({ speler1, speler2, result }) => {
      const p1 = speler1.user_id
      const p2 = speler2?.user_id ?? null

      // Only count games that are actually played (not postponed or not yet played)
      const isPlayed = result && result !== "..." && result !== "uitgesteld" && result !== null
      
      if (isPlayed) {
        gamesPlayed[p1]++
        if (p2) gamesPlayed[p2]++

        if (result?.startsWith("1-0")) {
          scoreMap[p1] += 1
        } else if (result?.startsWith("0-1") && p2) {
          scoreMap[p2] += 1
        } else if (["½-½", "1/2-1/2", "�-�"].includes(result)) {
          scoreMap[p1] += 0.5
          if (p2) scoreMap[p2] += 0.5
        } else if (result === "0.5-0") {
          scoreMap[p1] += 0.5
        } else if (result?.startsWith("ABS-")) {
          const absScore = parseFloat(result.substring(4)) || 0
          scoreMap[p1] += absScore
        }
      }
    })
  })

  // 3) return standings
  return tournament.participations
    .map(({ user }) => ({
      user_id: user.user_id,
      voornaam: user.voornaam,
      achternaam: user.achternaam,
      score: scoreMap[user.user_id] || 0,
      gamesPlayed: gamesPlayed[user.user_id] || 0,
      tieBreak: 0, // Not needed for pairing display
    }))
}

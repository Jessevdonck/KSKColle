"use client"

import useSWR from "swr"
import PlayerHeader from "./PlayerHeader"
import RecentGames from "./RecentGames"
import ProfileStats from "./ProfileStats"
import AsyncData from "../../components/AsyncData"
import { getById } from "../../api/index"
import type { User, GameWithRoundAndTournament } from "../../../data/types"
import { useAuth } from "../../contexts/auth"

export default function PlayerProfile({ name }: { name: string }) {
  const { user: currentUser } = useAuth()

  // Split name into first and last
  const [voornaam, ...achternaamParts] = name
    .split("_")
    .map(part => decodeURIComponent(part.charAt(0).toUpperCase() + part.slice(1)))
  const achternaam = achternaamParts.join(" ")

  // Endpoint for player
  const userEndpoint = currentUser
    ? `users/by-name?voornaam=${encodeURIComponent(voornaam)}&achternaam=${encodeURIComponent(achternaam)}`
    : `users/by-name/public?voornaam=${encodeURIComponent(voornaam)}&achternaam=${encodeURIComponent(achternaam)}`

  const { data: player, error: playerError } = useSWR<User>(
    ["player", voornaam, achternaam, currentUser?.user_id],
    () => getById(userEndpoint)
  )

  // Endpoint for recent games
  const gamesEndpoint = player
    ? currentUser
      ? `spel/speler/${player.user_id}`
      : `spel/speler/${player.user_id}/public`
    : null

  const { data: recentGamesData } = useSWR<any>(
    gamesEndpoint ? ["recentGames", gamesEndpoint] : null,
    async () => {
      if (!player) return { items: [] }
      try {
        const data = await getById(gamesEndpoint!)
        return data
      } catch {
        return { items: [] }
      }
    },
    { revalidateOnFocus: false }
  )

  const isLoading = !player && !playerError
  const error = playerError

  // Always ensure array
  const recentGames: GameWithRoundAndTournament[] = Array.isArray(recentGamesData?.items)
    ? recentGamesData.items
    : []

  // Filter out test tournaments (Board Order)
  const filteredGames = recentGames.filter(game => 
    !game.round?.tournament?.naam?.includes("Board Order")
  )

  // Deduplicate games by game_id (behoud eerste match)
  const uniqueGames = Array.from(new Map(filteredGames.map(game => [game.game_id, game])).values()) as GameWithRoundAndTournament[]

  // Filter: only games with results (played games), last 2 years so custom range has data
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

  const playedGamesWithResults = uniqueGames.filter(game => {
    const result = game.result?.trim() ?? ''
    if (!result || result === '...' || result.toLowerCase() === 'uitgesteld' || result === 'not_played') {
      return false
    }
    if (game.round?.ronde_datum) {
      const gameDate = new Date(game.round.ronde_datum)
      return gameDate >= twoYearsAgo
    }
    return false
  })

  return (
    <AsyncData loading={isLoading} error={error}>
      {player && (
        <div className="container mx-auto px-4 py-4 md:py-6 min-h-screen">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <PlayerHeader player={player} />
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 lg:gap-6 items-start">
                <div className="order-2 lg:order-1 min-w-0">
                  <RecentGames games={playedGamesWithResults} playerId={player.user_id} compact />
                </div>
                <div className="order-1 lg:order-2 min-w-0">
                  <ProfileStats games={playedGamesWithResults} playerId={player.user_id} compact />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AsyncData>
  )
}
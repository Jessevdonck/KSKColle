"use client"

import useSWR from "swr"
import PlayerHeader from "./PlayerHeader"
import RecentGames from "./RecentGames"
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

  const { data: recentGamesData, error: recentGamesError } = useSWR<any>(
    gamesEndpoint ? ["recentGames", gamesEndpoint] : null,
    async () => {
      if (!player) return { items: [] }
      try {
        const data = await getById(gamesEndpoint!)
        return data
      } catch (error) {
        // Als er geen games zijn, return een lege array in plaats van een error
        console.log("No games found for player, returning empty array")
        return { items: [] }
      }
    },
    { revalidateOnFocus: false }
  )

  const isLoading = !player && !playerError
  // Don't treat missing games as an error
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
  const uniqueGames = Array.from(new Map(filteredGames.map(game => [game.game_id, game])).values())

  // Filter: only games with results (played games) and from last 1 year
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  
  const playedGamesWithResults = uniqueGames.filter(game => {
    // Check if game has a valid result (not empty, not "...", not "uitgesteld", not "not_played")
    const result = game.result?.trim() ?? ''
    if (!result || result === '...' || result.toLowerCase() === 'uitgesteld' || result === 'not_played') {
      return false
    }
    
    // Check if game date is within last year
    if (game.round?.ronde_datum) {
      const gameDate = new Date(game.round.ronde_datum)
      return gameDate >= oneYearAgo
    }
    
    return false
  })

  return (
    <AsyncData loading={isLoading} error={error}>
      {player && (
        <div className="container mx-auto px-4 py-8 min-h-screen">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <PlayerHeader player={player} />
            <RecentGames games={playedGamesWithResults} playerId={player.user_id} />
          </div>
        </div>
      )}
    </AsyncData>
  )
}
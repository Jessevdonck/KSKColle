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
  const [voornaam, ...achternaamParts] = name
    .split("_")
    .map((part) => decodeURIComponent(part.charAt(0).toUpperCase() + part.slice(1)))
  const achternaam = achternaamParts.join(" ")

  // Use public endpoint if user is not logged in, authenticated endpoint if logged in
  const userEndpoint = currentUser 
    ? `users/by-name?voornaam=${encodeURIComponent(voornaam)}&achternaam=${encodeURIComponent(achternaam)}`
    : `users/by-name/public?voornaam=${encodeURIComponent(voornaam)}&achternaam=${encodeURIComponent(achternaam)}`

  const { data: player, error: playerError } = useSWR<User>(["player", voornaam, achternaam, currentUser?.user_id], () =>
    getById(userEndpoint),
  )

  const { data: recentGames = [] } = useSWR<GameWithRoundAndTournament[]>(
    player ? ["recentGames", player.user_id, currentUser?.user_id] : null,
    () => {
      if (!player) return null;
      
      // Use public endpoint if user is not logged in, authenticated endpoint if logged in
      const gamesEndpoint = currentUser 
        ? `spel/speler/${player.user_id}`
        : `spel/speler/${player.user_id}/public`
      
      return getById(gamesEndpoint);
    },
  )

  const isLoading = !player && !playerError
  const error = playerError

  return (
    <AsyncData loading={isLoading} error={error}>
      {player && (
        <div className="container mx-auto px-4 py-8 min-h-screen">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <PlayerHeader player={player} />

            <RecentGames games={recentGames} playerId={player.user_id} />
          </div>
        </div>
      )}
    </AsyncData>
  )
}

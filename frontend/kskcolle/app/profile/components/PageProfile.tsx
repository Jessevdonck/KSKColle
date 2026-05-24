"use client"

import useSWR from "swr"
import { useParams } from "next/navigation"
import PlayerHeader from "./PlayerHeader"
import RecentGames from "./RecentGames"
import UpcomingGames from "./UpcomingGames"
import ProfileStats from "./ProfileStats"
import AsyncData from "../../components/AsyncData"
import { getById } from "../../api/index"
import type { User, GameWithRoundAndTournament } from "../../../data/types"
import { useAuth } from "../../contexts/auth"
import { normalizedResultForDisplay } from "@/lib/gameResultDisplay"

function slugToNameParts(slug: string | undefined): { voornaam: string; achternaam: string } | null {
  if (!slug?.trim()) return null
  const decoded = decodeURIComponent(slug)
  const parts = decoded.split("_").filter(Boolean)
  if (parts.length === 0) return null
  const formatPart = (part: string) =>
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  return {
    voornaam: formatPart(parts[0]),
    achternaam: parts.slice(1).map(formatPart).join(" "),
  }
}

export default function PlayerProfile() {
  const { user: currentUser } = useAuth()
  const params = useParams()
  const slug = typeof params.name === "string" ? params.name : params.name?.[0]
  const nameParts = slugToNameParts(slug)
  const voornaam = nameParts?.voornaam ?? ""
  const achternaam = nameParts?.achternaam ?? ""

  const userEndpoint = nameParts
    ? currentUser
      ? `users/by-name?voornaam=${encodeURIComponent(voornaam)}&achternaam=${encodeURIComponent(achternaam)}`
      : `users/by-name/public?voornaam=${encodeURIComponent(voornaam)}&achternaam=${encodeURIComponent(achternaam)}`
    : null

  const { data: player, error: playerError } = useSWR<User>(
    nameParts ? ["player", voornaam, achternaam, currentUser?.user_id] : null,
    () => getById(userEndpoint!),
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
    const result =
      normalizedResultForDisplay(game.result?.trim() ?? null, game.uitgestelde_datum) ?? ""
    if (!result || result === "..." || result.toLowerCase() === "uitgesteld" || result === "not_played") {
      return false
    }
    if (game.round?.ronde_datum) {
      const gameDate = new Date(game.round.ronde_datum)
      return gameDate >= twoYearsAgo
    }
    return false
  })

  const upcomingOrMakeupGames = uniqueGames.filter(game => {
    const result =
      normalizedResultForDisplay(game.result?.trim() ?? null, game.uitgestelde_datum) ?? ""
    return (
      !result ||
      result === "..." ||
      result === "not_played" ||
      result.toLowerCase() === "uitgesteld"
    )
  })

  if (!nameParts) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <p className="text-gray-600">Speler niet gevonden.</p>
      </div>
    )
  }

  return (
    <AsyncData loading={isLoading} error={error}>
      {player && (
        <div className="container mx-auto px-4 py-4 md:py-6 min-h-screen">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <PlayerHeader player={player} />
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 lg:gap-6 items-start">
                <div className="order-2 lg:order-1 min-w-0">
                  <div className="space-y-4">
                    <UpcomingGames games={upcomingOrMakeupGames} playerId={player.user_id} compact />
                    <RecentGames games={playedGamesWithResults} playerId={player.user_id} compact />
                  </div>
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
"use client"

import useSWR from "swr"
import { useParams } from "next/navigation"
import PlayerHeader from "./PlayerHeader"
import Palmares from "./Palmares"
import RecentGames from "./RecentGames"
import UpcomingGames from "./UpcomingGames"
import EloHistoryChart from "./EloHistoryChart"
import ResultsDonut from "./ResultsDonut"
import ProfileStatTiles from "./ProfileStatTiles"
import HeadToHead from "./HeadToHead"
import AsyncData from "../../components/AsyncData"
import { getById, getUserBlitzHistory, getUserEloHistory } from "../../api/index"
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

  const { data: eloHistory } = useSWR<Array<{ period: string; rating: number }>>(
    player ? ["eloHistory", player.user_id] : null,
    () => getUserEloHistory(player!.user_id),
    { revalidateOnFocus: false }
  )

  const { data: blitzHistory } = useSWR<Array<{ period: string; rating: number }>>(
    player ? ["blitzHistory", player.user_id] : null,
    () => getUserBlitzHistory(player!.user_id),
    { revalidateOnFocus: false }
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

  // Onderlinge resultaten: alle gespeelde partijen, zonder tijdslimiet
  const allPlayedGames = uniqueGames.filter(game => {
    const result =
      normalizedResultForDisplay(game.result?.trim() ?? null, game.uitgestelde_datum) ?? ""
    return !!result && result !== "..." && result.toLowerCase() !== "uitgesteld" && result !== "not_played"
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
        <div className="mx-auto min-h-screen max-w-[1400px] px-3 py-4 md:px-4 md:py-5">
          {/* Bovenste rij: spelerskaart · ratinggrafiek · resultaten */}
          <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.6fr)_minmax(0,0.85fr)]">
            <PlayerHeader player={player} />
            <div className="min-w-0 [&>*]:h-full">
              {(eloHistory?.length ?? 0) + (blitzHistory?.length ?? 0) > 0 ? (
                <EloHistoryChart history={eloHistory ?? []} blitzHistory={blitzHistory ?? []} compact />
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-border/50 bg-white p-4 text-sm text-muted-foreground">
                  Nog geen ratinghistoriek.
                </div>
              )}
            </div>
            <div className="min-w-0">
              <ResultsDonut games={allPlayedGames} playerId={player.user_id} />
            </div>
          </div>

          {/* Onderste rij: partijen · palmares · statistieken */}
          <div className="mt-3 grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.6fr)_minmax(0,0.85fr)]">
            <div className="order-2 min-w-0 space-y-3 lg:order-1">
              <UpcomingGames games={upcomingOrMakeupGames} playerId={player.user_id} compact />
              <HeadToHead games={allPlayedGames} playerId={player.user_id} />
              <RecentGames games={playedGamesWithResults} playerId={player.user_id} compact />
            </div>
            <div className="order-1 min-w-0 lg:order-2">
              <Palmares playerId={player.user_id} voornaam={player.voornaam} achternaam={player.achternaam} />
            </div>
            <div className="order-3 min-w-0">
              <ProfileStatTiles games={allPlayedGames} playerId={player.user_id} />
            </div>
          </div>
        </div>
      )}
    </AsyncData>
  )
}

"use client"

import Link from "next/link"
import useSWR from "swr"
import { useAuth } from "../contexts/auth"
import { getById } from "../api/index"
import type { GameWithRoundAndTournament } from "@/data/types"
import { normalizedResultForDisplay } from "@/lib/gameResultDisplay"

const isPending = (game: GameWithRoundAndTournament) => {
  const result = (normalizedResultForDisplay(game.result ?? null, game.uitgestelde_datum) ?? "").toLowerCase()
  return !result || result === "..." || result === "not_played" || result === "uitgesteld"
}

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Eerstvolgende partij (vandaag of later) in een lopend toernooi. */
const findNextGame = (games: GameWithRoundAndTournament[]) =>
  games
    .filter((g) => g.speler2_id != null && !g.round?.tournament?.finished && isPending(g))
    .filter((g) => g.round?.ronde_datum && new Date(g.round.ronde_datum).getTime() >= startOfToday())
    .sort((a, b) => new Date(a.round.ronde_datum).getTime() - new Date(b.round.ronde_datum).getTime())[0]

/**
 * Minimalistische homepage-regel voor ingelogde spelers: je kleur (bolletje), je tegenstander en wanneer.
 * Verschijnt niet als je niet ingelogd bent of geen geplande partij hebt.
 */
export default function NextGameCard() {
  const { user } = useAuth()
  const userId: number | undefined = user?.user_id

  const { data } = useSWR<{ items: GameWithRoundAndTournament[] }>(
    userId ? ["nextGame", userId] : null,
    () => getById(`spel/speler/${userId}`).catch(() => ({ items: [] })),
    { revalidateOnFocus: false },
  )

  const game = data?.items ? findNextGame(data.items) : undefined
  if (!userId || !game) return null

  const isWhite = game.speler1_id === userId
  const opponent = isWhite ? game.speler2_naam : game.speler1_naam
  const tournament = game.round.tournament
  const when = new Date(game.round.ronde_datum).toLocaleDateString("nl-BE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
  const href = tournament.is_youth
    ? `/youth/tournaments/${tournament.tournament_id}`
    : `/toernooien/${tournament.tournament_id}`

  return (
    <Link
      href={href}
      title={`Jouw volgende partij: ${isWhite ? "wit" : "zwart"} tegen ${opponent}`}
      className="mx-auto mb-5 inline-flex max-w-full items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-sm text-white/90 backdrop-blur-sm transition-colors hover:bg-black/45 hover:text-white"
    >
      {/* Bolletje in je eigen kleur */}
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full border border-white ${isWhite ? "bg-white" : "bg-gray-900"}`}
        aria-hidden
      />
      <span className="truncate font-medium">{opponent}</span>
      <span className="shrink-0 text-white/60">
        {when}
        {game.round.startuur ? ` · ${game.round.startuur}` : ""}
      </span>
    </Link>
  )
}

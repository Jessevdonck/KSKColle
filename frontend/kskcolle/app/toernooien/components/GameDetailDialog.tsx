"use client"

import { useMemo } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Calendar, Clock, Swords, TrendingUp } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { GameWithRoundAndTournament } from "@/data/types"
import { getById } from "@/app/api/index"
import { expectedScore, hasRatings } from "@/lib/elio"
import {
  normalizedResultForDisplay,
  pairingResultBadgeClass,
  pairingResultBadgeText,
} from "@/lib/gameResultDisplay"
import { countsAsSpeeldagPartij, isDrawResult, isForfeitResult, normalizeResultFlat } from "@/lib/countsAsSpeeldagPartij"

export type DetailPlayer = {
  user_id: number
  voornaam: string
  achternaam: string
  schaakrating_elo?: number
}

export type DetailGame = {
  game_id: number
  speler1: DetailPlayer
  speler2: DetailPlayer | null
  result: string | null
  uitgestelde_datum?: string | null
}

interface GameDetailDialogProps {
  game: DetailGame | null
  onOpenChange: (open: boolean) => void
  /** "Ronde 3" of "Inhaaldag 2" */
  roundTitle: string
  roundDate?: string | null
  startuur?: string
  board?: number
  tournamentName?: string
  /** Punten vóór deze ronde; null als er (nog) geen stand is */
  getScore?: ((userId: number) => number) | null
  /** ELIO en winstkans tonen (niet bij de jeugd) */
  showRatings?: boolean
}

const profileHref = ({ voornaam, achternaam }: DetailPlayer) =>
  `/profile/${`${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, "_")}`

const fullName = (p: DetailPlayer) => `${p.voornaam} ${p.achternaam}`

/** Score van `playerId` in een beslist resultaat (forfait inbegrepen), anders null. */
function scoreFor(game: GameWithRoundAndTournament, playerId: number): number | null {
  const result = normalizedResultForDisplay(game.result ?? null, game.uitgestelde_datum)
  if (!countsAsSpeeldagPartij(result, game.speler2_id)) return null
  const flat = normalizeResultFlat(result)
  const isWhite = game.speler1_id === playerId
  if (flat.startsWith("1-0")) return isWhite ? 1 : 0
  if (flat.startsWith("0-1")) return isWhite ? 0 : 1
  if (isDrawResult(result)) return 0.5
  return 0 // dubbel forfait
}

type FormEntry = { g: GameWithRoundAndTournament; kind: "W" | "R" | "V" | "Afw"; s: number | null }

/**
 * Vormvakje voor `playerId`: W/R/V voor gespeelde partijen, "Afw" bij afwezigheid
 * (afwezig met/zonder bericht of forfaitverlies). Null voor byes en nog te spelen partijen.
 */
function formEntryFor(game: GameWithRoundAndTournament, playerId: number): FormEntry | null {
  const result = normalizedResultForDisplay(game.result ?? null, game.uitgestelde_datum)
  const flat = normalizeResultFlat(result)
  if (!flat || flat === "..." || flat === "NOT_PLAYED" || flat === "UITGESTELD") return null
  if (game.speler2_id == null) {
    // zonder tegenstander: afwezigheid telt als "Afw", een bye niet
    return flat.startsWith("ABS") || flat === "0-0" ? { g: game, kind: "Afw", s: null } : null
  }
  const s = scoreFor(game, playerId)
  if (s === null) return null
  if (isDrawResult(result)) return { g: game, kind: "R", s: 0.5 }
  if (isForfeitResult(result) && s === 0) return { g: game, kind: "Afw", s: null }
  return { g: game, kind: s === 1 ? "W" : "V", s }
}

/**
 * Inhaaldagen bevatten een kopie van de oorspronkelijke partij: die niet dubbel tellen.
 */
function withoutMakeupCopies(games: GameWithRoundAndTournament[]): GameWithRoundAndTournament[] {
  const ids = new Set(games.map((g) => g.game_id))
  const pairKey = (g: GameWithRoundAndTournament) =>
    `${g.round?.tournament_id}:${Math.min(g.speler1_id, g.speler2_id ?? 0)}-${Math.max(g.speler1_id, g.speler2_id ?? 0)}`
  const regularPairs = new Set(games.filter((g) => g.round?.type !== "MAKEUP").map(pairKey))
  return games.filter((g) => {
    if (g.round?.type !== "MAKEUP") return true
    if (g.original_game_id && ids.has(g.original_game_id)) return false
    return !regularPairs.has(pairKey(g))
  })
}

const byDateDesc = (a: GameWithRoundAndTournament, b: GameWithRoundAndTournament) =>
  new Date(b.round?.ronde_datum ?? 0).getTime() - new Date(a.round?.ronde_datum ?? 0).getTime()

const fmtDate = (d: Date | string | null | undefined, long = false) =>
  d
    ? new Date(d).toLocaleDateString("nl-BE", long
        ? { weekday: "long", day: "numeric", month: "long", year: "numeric" }
        : { day: "2-digit", month: "2-digit", year: "2-digit" })
    : ""

const tournamentLabel = (g: GameWithRoundAndTournament) =>
  [g.round?.tournament?.naam, g.round?.tournament?.class_name].filter(Boolean).join(" · ")

/**
 * Alle partijen van een speler (zelfde publieke bron als het profiel), aangevuld met
 * zijn afwezigheden (zonder tegenstander) voor de vorm.
 */
function usePlayerGames(userId: number | undefined, enabled: boolean) {
  return useSWR<GameWithRoundAndTournament[]>(
    enabled && userId ? ["gameDetailPlayerGames", userId] : null,
    () =>
      getById(`spel/speler/${userId}/public`)
        .then((d: { items?: GameWithRoundAndTournament[]; absences?: GameWithRoundAndTournament[] }) => [
          ...(d.items ?? []),
          ...(d.absences ?? []).map((a) => ({ ...a, speler2_id: null, uitgestelde_datum: null })),
        ])
        .catch(() => []),
    { revalidateOnFocus: false },
  )
}

export default function GameDetailDialog({
  game,
  onOpenChange,
  roundTitle,
  roundDate,
  startuur,
  board,
  tournamentName,
  getScore,
  showRatings = true,
}: GameDetailDialogProps) {
  const open = game !== null && game.speler2 !== null
  const white = game?.speler1
  const black = game?.speler2 ?? undefined

  const { data: whiteGames, isLoading: loadingWhite } = usePlayerGames(white?.user_id, open)
  const { data: blackGames, isLoading: loadingBlack } = usePlayerGames(black?.user_id, open)

  const h2h = useMemo(() => {
    if (!white || !black || !whiteGames) return null
    const games = withoutMakeupCopies(whiteGames)
      .filter((g) => g.game_id !== game?.game_id)
      .filter((g) => (g.speler1_id === black.user_id || g.speler2_id === black.user_id) && scoreFor(g, white.user_id) !== null)
      .sort(byDateDesc)
    let whiteWins = 0, draws = 0, blackWins = 0
    for (const g of games) {
      const s = scoreFor(g, white.user_id)
      if (s === 1) whiteWins++
      else if (s === 0.5) draws++
      else if (s === 0) blackWins++
    }
    return { games, whiteWins, draws, blackWins }
  }, [whiteGames, white, black, game?.game_id])

  // Vorm: laatste 5 partijen of afwezigheden vóór deze ronde (ronde zelf niet meegeteld)
  const formOf = (games: GameWithRoundAndTournament[] | undefined, playerId: number | undefined) => {
    if (!games || !playerId) return null
    const cutoff = roundDate ? new Date(roundDate).getTime() : Number.POSITIVE_INFINITY
    return withoutMakeupCopies(games)
      .filter((g) => g.game_id !== game?.game_id && new Date(g.round?.ronde_datum ?? 0).getTime() < cutoff)
      .map((g) => formEntryFor(g, playerId))
      .filter((x): x is FormEntry => x !== null)
      .sort((a, b) => byDateDesc(a.g, b.g))
      .slice(0, 5)
  }
  const whiteForm = formOf(whiteGames, white?.user_id)
  const blackForm = formOf(blackGames, black?.user_id)

  if (!game || !white || !black) {
    return <Dialog open={false} onOpenChange={onOpenChange} />
  }

  const whiteElo = white.schaakrating_elo
  const blackElo = black.schaakrating_elo
  const withRatings = showRatings && hasRatings(whiteElo, blackElo)
  const chance = withRatings ? expectedScore(whiteElo as number, blackElo as number) : null
  const effective = normalizedResultForDisplay(game.result, game.uitgestelde_datum)
  const flat = normalizeResultFlat(effective)
  const isPending = flat === "" || flat === "..." || flat === "NOT_PLAYED" || flat === "UITGESTELD"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid-cols-[minmax(0,1fr)] w-[calc(100vw-1.5rem)] max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-5 gap-3 rounded-lg">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-base">
            {roundTitle}
            {board ? ` · Bord ${board}` : ""}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
            {tournamentName && <span>{tournamentName}</span>}
            {roundDate && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {fmtDate(roundDate, true)}
              </span>
            )}
            {startuur && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {startuur}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Spelers + uitslag */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-lg border border-neutral-200 p-3">
          <PlayerBlock player={white} color="white" score={getScore?.(white.user_id)} showRating={showRatings} />
          <span
            className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${pairingResultBadgeClass(game.result, game.uitgestelde_datum)}`}
          >
            {flat === "" || flat === "..." || flat === "NOT_PLAYED"
              ? "Nog te spelen"
              : pairingResultBadgeText(game.result, game.uitgestelde_datum)}
          </span>
          <PlayerBlock player={black} color="black" score={getScore?.(black.user_id)} showRating={showRatings} align="right" />
        </div>

        {/* Winstkans */}
        {chance !== null && (
          <section className="space-y-1.5">
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-textColor">
              <TrendingUp className="h-4 w-4 text-mainAccent" />
              {isPending ? "Winstkans" : "Winstkans vooraf"}
            </h4>
            <div className="flex items-center gap-2 text-xs font-semibold tabular-nums">
              <span className="w-9 text-right">{Math.round(chance * 100)}%</span>
              <div className="flex h-3 flex-1 overflow-hidden rounded-full bg-gray-800 ring-1 ring-neutral-300">
                <div className="h-full bg-white" style={{ width: `${chance * 100}%` }} />
              </div>
              <span className="w-9">{100 - Math.round(chance * 100)}%</span>
            </div>
          </section>
        )}

        {/* Onderlinge duels */}
        <section className="space-y-1.5">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold text-textColor">
            <Swords className="h-4 w-4 text-mainAccent" />
            Onderlinge duels
          </h4>
          {loadingWhite || !h2h ? (
            <p className="text-xs text-muted-foreground">Laden…</p>
          ) : h2h.games.length === 0 ? (
            <p className="text-xs text-muted-foreground">Deze spelers speelden nog niet tegen elkaar.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label={`Winst ${white.voornaam}`} value={h2h.whiteWins} className="text-green-600" />
                <Stat label="Remise" value={h2h.draws} className="text-purple-600" />
                <Stat label={`Winst ${black.voornaam}`} value={h2h.blackWins} className="text-red-600" />
              </div>
              {h2h.games.length > 5 && (
                <p className="text-[11px] text-muted-foreground">Laatste 5 van {h2h.games.length}</p>
              )}
              <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
                {h2h.games.slice(0, 5).map((g) => {
                  // Kleuren zoals in die partij: wit = speler1, zwart = speler2
                  const gameWhite = g.speler1_id === white.user_id ? white : black
                  const gameBlack = gameWhite === white ? black : white
                  const ws = scoreFor(g, g.speler1_id)
                  const result = ws === 1 ? "1-0" : ws === 0 ? "0-1" : "½-½"
                  return (
                    <li
                      key={g.game_id}
                      className="flex items-center gap-2 px-2 py-1.5 text-xs"
                      title={tournamentLabel(g)}
                    >
                      <span className="w-14 shrink-0 tabular-nums text-muted-foreground">{fmtDate(g.round?.ronde_datum)}</span>
                      <span className="flex min-w-0 flex-1 items-center gap-1.5">
                        <ColorDot color="white" />
                        <span className="min-w-0 truncate">{fullName(gameWhite)}</span>
                      </span>
                      <span className="flex min-w-0 flex-1 items-center gap-1.5">
                        <ColorDot color="black" />
                        <span className="min-w-0 truncate">{fullName(gameBlack)}</span>
                      </span>
                      <span className="w-8 shrink-0 text-right font-semibold tabular-nums text-textColor">{result}</span>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>

        {/* Vorm */}
        <section className="space-y-1.5">
          <h4 className="text-sm font-semibold text-textColor">Vorm</h4>
          <div className="space-y-1">
            <FormRow name={fullName(white)} form={whiteForm} loading={loadingWhite} />
            <FormRow name={fullName(black)} form={blackForm} loading={loadingBlack} />
          </div>
        </section>
      </DialogContent>
    </Dialog>
  )
}

function PlayerBlock({
  player,
  color,
  score,
  showRating,
  align = "left",
}: {
  player: DetailPlayer
  color: "white" | "black"
  score?: number
  showRating: boolean
  align?: "left" | "right"
}) {
  return (
    <div className={`min-w-0 space-y-0.5 ${align === "right" ? "text-right" : ""}`}>
      <div className={`flex items-center gap-1.5 ${align === "right" ? "justify-end" : ""}`}>
        <span
          className={`h-3 w-3 shrink-0 rounded-full border ${
            color === "white" ? "bg-white border-neutral-400" : "bg-gray-800 border-gray-800"
          }`}
          aria-label={color === "white" ? "Wit" : "Zwart"}
        />
        <Link href={profileHref(player)} className="truncate text-sm font-semibold text-textColor hover:text-mainAccent">
          {fullName(player)}
        </Link>
      </div>
      <div className="text-xs text-muted-foreground tabular-nums">
        {showRating && player.schaakrating_elo ? <>ELIO {player.schaakrating_elo}</> : null}
        {showRating && player.schaakrating_elo && score !== undefined ? " · " : null}
        {score !== undefined ? <>{score} pt</> : null}
      </div>
    </div>
  )
}

function Stat({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 py-1.5">
      <div className={`text-lg font-bold ${className}`}>{value}</div>
      <div className="truncate px-1 text-[10px] text-muted-foreground">{label}</div>
    </div>
  )
}

function FormRow({
  name,
  form,
  loading,
}: {
  name: string
  form: FormEntry[] | null
  loading: boolean
}) {
  const played = form?.filter((x) => x.s !== null) ?? []
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {loading || !form ? (
        <span className="text-muted-foreground">Laden…</span>
      ) : form.length === 0 ? (
        <span className="text-muted-foreground">Nog geen partijen</span>
      ) : (
        <span className="flex shrink-0 items-center gap-2">
          {/* Vaste breedte voor 5 vakjes (rechts uitgelijnd), zodat beide rijen onder elkaar staan;
              oudste links, recentste rechts */}
          <span className="flex w-[136px] justify-end gap-1">
            {[...form].reverse().map(({ g, kind }) => (
              <span
                key={g.game_id}
                title={`${fmtDate(g.round?.ronde_datum)} · ${tournamentLabel(g)}${kind === "Afw" ? " · afwezig" : ""}`}
                className={`flex h-5 w-6 items-center justify-center rounded font-bold text-white ${
                  kind === "Afw" ? "bg-gray-400 text-[9px]" : "text-[10px]"
                } ${kind === "W" ? "bg-green-500" : kind === "V" ? "bg-red-500" : kind === "R" ? "bg-yellow-500" : ""}`}
              >
                {kind}
              </span>
            ))}
          </span>
          {/* Score enkel over gespeelde partijen (afwezigheden niet) */}
          <span className="w-10 text-right tabular-nums text-muted-foreground">
            {played.length > 0 ? `${played.reduce((sum, x) => sum + (x.s ?? 0), 0)}/${played.length}` : "–"}
          </span>
        </span>
      )}
    </div>
  )
}

function ColorDot({ color }: { color: "white" | "black" }) {
  return (
    <span
      className={`h-2.5 w-2.5 shrink-0 rounded-full border ${
        color === "white" ? "bg-white border-gray-500" : "bg-gray-800 border-gray-800"
      }`}
      aria-label={color === "white" ? "Wit" : "Zwart"}
    />
  )
}

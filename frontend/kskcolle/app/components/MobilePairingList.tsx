import type { ReactNode } from "react"
import Link from "next/link"
import {
  pairingResultBadgeClass,
  pairingResultBadgeText,
} from "@/lib/gameResultDisplay"

type PairingPlayer = {
  user_id: number
  voornaam: string
  achternaam: string
  schaakrating_elo?: number
}

type PairingGame = {
  game_id: number
  speler1: PairingPlayer
  speler2: PairingPlayer | null
  result: string | null
  uitgestelde_datum?: string | null
}

interface MobilePairingListProps {
  games: PairingGame[]
  /** Punten vóór de ronde; null als er (nog) geen stand is. */
  getScore: ((userId: number) => number) | null
  showRating?: boolean
  byeLabel?: (result: string | null) => string
  /** Label als er nog geen uitslag is (bv. "..." of "Nog te spelen"). */
  emptyLabel?: string
  /** Eigen uitslagbadge, bv. op inhaaldagen waar "Uitgesteld" niet getoond mag worden. */
  renderResult?: (game: PairingGame) => ReactNode
  /** Extra knop naast de uitslag, bv. uitstel ongedaan maken. */
  renderAction?: (game: PairingGame) => ReactNode
  className?: string
}

const profileHref = ({ voornaam, achternaam }: PairingPlayer) =>
  `/profile/${`${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, "_")}`

/**
 * Compacte paringen voor mobiel: per partij twee regels (wit boven, zwart onder)
 * met bordnummer links en de uitslag rechts.
 */
export default function MobilePairingList({
  games,
  getScore,
  showRating = false,
  byeLabel = () => "Bye",
  emptyLabel = "...",
  renderResult,
  renderAction,
  className = "",
}: MobilePairingListProps) {
  return (
    <ul className={`bg-white rounded-lg border border-neutral-200 shadow-sm divide-y divide-neutral-100 overflow-hidden ${className}`}>
      {games.map((game, index) => (
        <li
          key={game.game_id}
          className={`flex items-center gap-2 px-2 py-1.5 ${index % 2 === 0 ? "bg-white" : "bg-neutral-50/50"}`}
        >
          <span className="w-5 shrink-0 text-center text-xs font-semibold text-gray-400">{index + 1}</span>
          <div className="min-w-0 flex-1 space-y-0.5">
            <PlayerLine color="white" player={game.speler1} getScore={getScore} showRating={showRating} />
            {game.speler2 ? (
              <PlayerLine color="black" player={game.speler2} getScore={getScore} showRating={showRating} />
            ) : (
              <div className="flex items-center gap-1.5 text-sm leading-5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full border bg-gray-200 border-gray-300" aria-hidden />
                <span className="truncate italic text-gray-500">{byeLabel(game.result)}</span>
              </div>
            )}
          </div>
          {/* Vaste breedte, zodat namen en ratings niet verschuiven bij een langer label */}
          <div className="w-[4.75rem] shrink-0 flex justify-end">
            {renderResult ? (
              renderResult(game)
            ) : (
              <ResultBadge className={pairingResultBadgeClass(game.result, game.uitgestelde_datum)}>
                {pairingResultBadgeText(game.result, game.uitgestelde_datum, emptyLabel)}
              </ResultBadge>
            )}
          </div>
          {renderAction?.(game)}
        </li>
      ))}
    </ul>
  )
}

export function ResultBadge({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium text-center leading-tight ${className}`}>
      {children}
    </span>
  )
}

function PlayerLine({
  color,
  player,
  getScore,
  showRating,
}: {
  color: "white" | "black"
  player: PairingPlayer | null
  getScore: ((userId: number) => number) | null
  showRating: boolean
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm leading-5">
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full border ${
          color === "white" ? "bg-white border-neutral-400" : "bg-gray-800 border-gray-800"
        }`}
        aria-hidden
      />
      {player?.voornaam && player.achternaam ? (
        <Link href={profileHref(player)} className="truncate font-medium text-textColor hover:text-mainAccent">
          {player.voornaam} {player.achternaam}
        </Link>
      ) : (
        <span className="truncate italic text-gray-500">Speler niet gevonden</span>
      )}
      {getScore && player && (
        <span className="shrink-0 text-xs font-semibold text-mainAccent">({getScore(player.user_id)})</span>
      )}
      {showRating && player?.schaakrating_elo != null && (
        <span className="ml-auto shrink-0 pl-1 text-xs text-gray-400 tabular-nums">{player.schaakrating_elo}</span>
      )}
    </div>
  )
}

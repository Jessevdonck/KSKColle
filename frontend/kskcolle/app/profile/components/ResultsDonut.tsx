"use client"

import { useMemo, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { PieChart as PieIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { GameWithRoundAndTournament } from "@/data/types"
import { normalizedResultForDisplay } from "@/lib/gameResultDisplay"
import { countsAsSpeeldagPartij, isDrawResult, normalizeResultFlat } from "@/lib/countsAsSpeeldagPartij"
import { GameCard } from "./GameCard"
import { ListPager, usePaged } from "./ListPager"

type Outcome = "win" | "loss" | "draw"
type SetKey = "elio" | "blitz"

const OUTCOMES: Array<{ key: Outcome; label: string; color: string }> = [
  { key: "win", label: "Winst", color: "#22c55e" },
  { key: "loss", label: "Verlies", color: "#ef4444" },
  { key: "draw", label: "Remise", color: "#eab308" },
]

const SETS: Record<SetKey, { label: string; dot: string }> = {
  elio: { label: "ELIO", dot: "var(--main-accent)" },
  blitz: { label: "Blitz", dot: "#0ea5e9" },
}

const isBlitzGame = (g: GameWithRoundAndTournament) => {
  const n = (g.round?.tournament?.naam ?? "").toLowerCase()
  return n.includes("blitz") || n.includes("snelschaak")
}

function outcomeOf(game: GameWithRoundAndTournament, playerId: number): Outcome | null {
  const result = normalizedResultForDisplay(game.result ?? null, game.uitgestelde_datum)
  if (!countsAsSpeeldagPartij(result, game.speler2_id)) return null
  const flat = normalizeResultFlat(result)
  const isWhite = game.speler1_id === playerId
  if (isDrawResult(result)) return "draw"
  if (flat.startsWith("1-0")) return isWhite ? "win" : "loss"
  if (flat.startsWith("0-1")) return isWhite ? "loss" : "win"
  return null
}

/**
 * Resultaten als cirkel(s): ELIO (klassieke toernooien) en Blitz apart, elk aan/uit te zetten.
 * Een klik op een stuk van de cirkel toont de partijen die erin zitten.
 */
export default function ResultsDonut({ games, playerId }: { games: GameWithRoundAndTournament[]; playerId: number }) {
  const [visible, setVisible] = useState<Record<SetKey, boolean>>({ elio: true, blitz: true })
  const [selected, setSelected] = useState<{ set: SetKey; outcome: Outcome } | null>(null)

  const grouped = useMemo(() => {
    const out: Record<SetKey, Record<Outcome, GameWithRoundAndTournament[]>> = {
      elio: { win: [], loss: [], draw: [] },
      blitz: { win: [], loss: [], draw: [] },
    }
    for (const g of games) {
      const o = outcomeOf(g, playerId)
      if (!o) continue
      out[isBlitzGame(g) ? "blitz" : "elio"][o].push(g)
    }
    for (const set of Object.values(out))
      for (const list of Object.values(set))
        list.sort((a, b) => new Date(b.round?.ronde_datum ?? 0).getTime() - new Date(a.round?.ronde_datum ?? 0).getTime())
    return out
  }, [games, playerId])

  const total = (k: SetKey) => grouped[k].win.length + grouped[k].loss.length + grouped[k].draw.length
  const available = (["elio", "blitz"] as SetKey[]).filter((k) => total(k) > 0)
  const shown = available.filter((k) => visible[k])

  const toggle = (key: SetKey) =>
    setVisible((v) => (v[key] && shown.length === 1 ? v : { ...v, [key]: !v[key] }))

  if (available.length === 0) return null

  const selectedGames = selected ? grouped[selected.set][selected.outcome] : []

  return (
    <Card className="h-full border border-border/50">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 px-4 py-3">
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <PieIcon className="h-4 w-4 text-mainAccent" />
          Resultaten
        </CardTitle>
        {available.length > 1 && (
          <div className="flex items-center gap-1" role="group" aria-label="Zichtbare resultaten">
            {available.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                aria-pressed={visible[key]}
                className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${
                  visible[key]
                    ? "border-border bg-background text-foreground"
                    : "border-transparent bg-muted text-muted-foreground line-through"
                }`}
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: visible[key] ? SETS[key].dot : "currentColor" }} />
                {SETS[key].label}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        <div className={`grid gap-2 ${shown.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {shown.map((key) => {
            const data = OUTCOMES.map((o) => ({ ...o, value: grouped[key][o.key].length })).filter((d) => d.value > 0)
            return (
              <div key={key} className="relative h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={shown.length > 1 ? 36 : 44}
                      outerRadius={shown.length > 1 ? 58 : 68}
                      paddingAngle={2}
                      isAnimationActive={false}
                      onClick={(d: { key?: Outcome }) => d?.key && setSelected({ set: key, outcome: d.key })}
                      className="cursor-pointer"
                    >
                      {data.map((d) => (
                        <Cell key={d.key} fill={d.color} className="cursor-pointer outline-none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, n: string) => [`${v} partijen`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Midden: aantal partijen */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold tabular-nums text-textColor">{total(key)}</span>
                  <span className="text-[10px] uppercase text-muted-foreground">{SETS[key].label}</span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
          {OUTCOMES.map((o) => (
            <span key={o.key} className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: o.color }} />
              {o.label}
            </span>
          ))}
        </div>
        <p className="mt-1 text-center text-[11px] text-muted-foreground">Klik op de cirkel voor de partijen</p>
      </CardContent>

      <GamesDialog
        title={
          selected
            ? `${OUTCOMES.find((o) => o.key === selected.outcome)!.label} · ${SETS[selected.set].label} (${selectedGames.length})`
            : ""
        }
        games={selectedGames}
        playerId={playerId}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </Card>
  )
}

function GamesDialog({
  title,
  games,
  playerId,
  open,
  onClose,
}: {
  title: string
  games: GameWithRoundAndTournament[]
  playerId: number
  open: boolean
  onClose: () => void
}) {
  const { page, pageCount, setPage, visible } = usePaged(games, undefined, title)
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="grid-cols-[minmax(0,1fr)] w-[calc(100vw-1.5rem)] max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden gap-3 p-4 sm:p-5 rounded-lg">
        <DialogHeader className="text-left">
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle className="text-base">{title}</DialogTitle>
            <ListPager page={page} pageCount={pageCount} setPage={setPage} />
          </div>
        </DialogHeader>
        <div className="space-y-1">
          {visible.map((g) => (
            <GameCard key={g.game_id} game={g} playerId={playerId} compact />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

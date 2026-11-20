"use client"

import { useCallback, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { GameWithRoundAndTournament } from "@/data/types"
import EloHistoryChart from "./EloHistoryChart"
import PlayerHighlights from "./PlayerHighlights"
import { normalizedResultForDisplay } from "@/lib/gameResultDisplay"
import { countsAsSpeeldagPartij } from "@/lib/countsAsSpeeldagPartij"
import { Trophy, Target, TrendingUp, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  addMonths,
  isWithinInterval,
  parseISO,
} from "date-fns"
import { nl } from "date-fns/locale"

type RangePreset = "1m" | "6m" | "12m" | "all" | "custom"

/** Ver genoeg terug om als "sinds altijd" te gelden, ook voor de historische ELIO-data. */
const ALL_TIME_START = new Date(2000, 0, 1)

function getScore(game: GameWithRoundAndTournament, playerId: number): number {
  const result = (normalizedResultForDisplay(game.result ?? null, game.uitgestelde_datum) ?? "").trim()
  if (!result || result === "..." || result.toLowerCase() === "uitgesteld") return NaN
  const isWhite = game.speler1_id === playerId
  const isBlack = game.speler2_id === playerId
  if (["½-½", "1/2-1/2", "1/2-1/2R"].includes(result) || result.includes("½")) return 0.5
  if ((result.startsWith("1-0") && isWhite) || (result.startsWith("0-1") && isBlack)) return 1
  if ((result.startsWith("0-1") && isWhite) || (result.startsWith("1-0") && isBlack)) return 0
  return NaN
}

function getOutcome(game: GameWithRoundAndTournament, playerId: number): "win" | "loss" | "draw" | null {
  const s = getScore(game, playerId)
  if (Number.isNaN(s)) return null
  if (s === 1) return "win"
  if (s === 0) return "loss"
  return "draw"
}

function getRangeBounds(
  preset: RangePreset,
  customStart: string,
  customEnd: string
): { start: Date; end: Date } {
  const end = new Date()
  if (preset === "1m") return { start: subMonths(end, 1), end }
  if (preset === "6m") return { start: subMonths(end, 6), end }
  if (preset === "12m") return { start: subMonths(end, 12), end }
  if (preset === "all") return { start: ALL_TIME_START, end }
  const start = customStart ? parseISO(customStart) : subMonths(end, 12)
  const endDate = customEnd ? parseISO(customEnd) : end
  return { start: start > endDate ? endDate : start, end: endDate > start ? endDate : start }
}

function getMonthKeys(start: Date, end: Date): string[] {
  const keys: string[] = []
  let d = startOfMonth(start)
  const endMonth = endOfMonth(end)
  while (d <= endMonth) {
    keys.push(format(d, "yyyy-MM"))
    d = addMonths(d, 1)
  }
  return keys
}

interface EloHistoryPoint {
  period: string // "YYYY-MM"
  rating: number
}

interface ProfileStatsProps {
  games: GameWithRoundAndTournament[]
  playerId: number
  compact?: boolean
  eloHistory?: EloHistoryPoint[]
  /** Aparte blitzrating, getoond als tweede lijn in de ratinggrafiek */
  blitzHistory?: EloHistoryPoint[]
}

const COLORS = { win: "#22c55e", loss: "#ef4444", draw: "#eab308" }

export default function ProfileStats({ games, playerId, compact, eloHistory = [], blitzHistory = [] }: ProfileStatsProps) {
  const [rangePreset, setRangePreset] = useState<RangePreset>("all")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [chartIndex, setChartIndex] = useState(0)

  const { filteredGames, rangeLabel, bounds } = useMemo(() => {
    const b = getRangeBounds(rangePreset, customStart, customEnd)
    const label =
      rangePreset === "1m"
        ? "laatste maand"
        : rangePreset === "6m"
          ? "laatste 6 mnd"
          : rangePreset === "12m"
            ? "laatste 12 mnd"
            : rangePreset === "all"
              ? "sinds altijd"
              : customStart && customEnd
                ? `${format(parseISO(customStart), "d MMM yyyy", { locale: nl })} – ${format(parseISO(customEnd), "d MMM yyyy", { locale: nl })}`
                : "gekozen periode"
    const filtered = games.filter((g) => {
      const d = g.round?.ronde_datum
      if (!d) return false
      const date = new Date(d)
      return isWithinInterval(date, { start: b.start, end: b.end })
    })
    return { filteredGames: filtered, rangeLabel: label, bounds: b }
  }, [games, rangePreset, customStart, customEnd])

  /** Rating-historiek gefilterd op exact dezelfde (kalender-)periode als de partijen. */
  const inRange = useCallback(
    ({ period }: EloHistoryPoint) => {
      const [year, month] = period.split("-").map(Number)
      if (!year || !month) return false
      const date = new Date(year, month - 1, 1)
      return isWithinInterval(date, { start: bounds.start, end: bounds.end })
    },
    [bounds],
  )
  const filteredEloHistory = useMemo(() => eloHistory.filter(inRange), [eloHistory, inRange])
  const filteredBlitzHistory = useMemo(() => blitzHistory.filter(inRange), [blitzHistory, inRange])

  const stats = useMemo(() => {
    let wins = 0,
      losses = 0,
      draws = 0,
      totalScore = 0
    const byTournament: Record<string, { partijen: number; score: number }> = {}
    const monthKeys = getMonthKeys(bounds.start, bounds.end)
    const byMonth: Record<string, { partijen: number; score: number }> = {}
    monthKeys.forEach((k) => {
      byMonth[k] = { partijen: 0, score: 0 }
    })

    for (const g of filteredGames) {
      if (!countsAsSpeeldagPartij(g.result, g.speler2_id)) continue
      const outcome = getOutcome(g, playerId)
      if (outcome === null) continue
      if (outcome === "win") wins++
      else if (outcome === "loss") losses++
      else draws++
      const s = getScore(g, playerId)
      if (!Number.isNaN(s)) totalScore += s

      const tn = g.round?.tournament?.naam ?? "Onbekend"
      if (!byTournament[tn]) byTournament[tn] = { partijen: 0, score: 0 }
      byTournament[tn].partijen++
      byTournament[tn].score += Number.isNaN(s) ? 0 : s

      const rondeDatum = g.round?.ronde_datum
      if (rondeDatum) {
        const key = format(new Date(rondeDatum), "yyyy-MM")
        if (byMonth[key] !== undefined) {
          byMonth[key].partijen++
          byMonth[key].score += Number.isNaN(s) ? 0 : s
        }
      }
    }

    const total = wins + losses + draws
    return {
      wins,
      losses,
      draws,
      total,
      totalScore,
      winPct: total > 0 ? Math.round((wins / total) * 100) : 0,
      pieData: [
        { name: "Winst", value: wins, color: COLORS.win },
        { name: "Verlies", value: losses, color: COLORS.loss },
        { name: "Remise", value: draws, color: COLORS.draw },
      ].filter((d) => d.value > 0),
      tournamentData: Object.entries(byTournament)
        .map(([naam, v]) => ({ naam: naam.length > 18 ? naam.slice(0, 16) + "…" : naam, ...v }))
        .sort((a, b) => b.partijen - a.partijen)
        .slice(0, 10),
      monthData: Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([maand, v]) => ({
          maand: format(new Date(maand + "-01"), "MMM yy", { locale: nl }),
          partijen: v.partijen,
          score: v.score,
        })),
    }
  }, [filteredGames, playerId, bounds.start, bounds.end])

  if (games.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Statistieken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Geen gespeelde partijen — statistieken verschijnen zodra er resultaten zijn.
          </p>
        </CardContent>
      </Card>
    )
  }

  const chartKeys: ("pie" | "month" | "tournament")[] = []
  if (stats.total > 0 && stats.pieData.length > 0) chartKeys.push("pie")
  if (stats.total > 0 && stats.monthData.some((d) => d.partijen > 0)) chartKeys.push("month")
  if (stats.total > 0 && stats.tournamentData.length > 0) chartKeys.push("tournament")
  const currChart = chartKeys[chartIndex % Math.max(1, chartKeys.length)]

  return (
    <div className={compact ? "space-y-3" : "space-y-6"}>
      {/* Periode */}
      {compact ? (
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-xs text-muted-foreground shrink-0">Periode</Label>
          <Select value={rangePreset} onValueChange={(v) => setRangePreset(v as RangePreset)}>
            <SelectTrigger id="range-preset" className="h-8 w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 mnd</SelectItem>
              <SelectItem value="6m">6 mnd</SelectItem>
              <SelectItem value="12m">12 mnd</SelectItem>
              <SelectItem value="all">Sinds altijd</SelectItem>
              <SelectItem value="custom">Aangepast</SelectItem>
            </SelectContent>
          </Select>
          {rangePreset === "custom" && (
            <>
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-8 w-[120px] text-xs" />
              <span className="text-muted-foreground text-xs">–</span>
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-8 w-[120px] text-xs" />
            </>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Periode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="range-preset" className="text-sm text-muted-foreground shrink-0">Tijdsduur</Label>
                <Select value={rangePreset} onValueChange={(v) => setRangePreset(v as RangePreset)}>
                  <SelectTrigger id="range-preset" className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1 maand</SelectItem>
                    <SelectItem value="6m">6 maanden</SelectItem>
                    <SelectItem value="12m">12 maanden</SelectItem>
                    <SelectItem value="all">Sinds altijd</SelectItem>
                    <SelectItem value="custom">Aangepast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {rangePreset === "custom" && (
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="text-sm text-muted-foreground shrink-0">Van</Label>
                  <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-[140px]" />
                  <Label className="text-sm text-muted-foreground shrink-0">tot</Label>
                  <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-[140px]" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.total === 0 ? (
        <Card className={compact ? "border border-border/50" : undefined}>
          <CardContent className={compact ? "py-3 px-4" : "pt-6"}>
            <p className="text-muted-foreground text-sm">
              Geen gespeelde partijen in {rangeLabel}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI */}
          <div className={compact ? "grid grid-cols-4 gap-2" : "grid grid-cols-2 sm:grid-cols-4 gap-3"}>
            {compact ? (
              <>
                <div className="rounded border border-border/50 bg-muted/20 px-2 py-1.5 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase">Partijen</div>
                  <div className="text-lg font-bold text-textColor">{stats.total}</div>
                </div>
                <div className="rounded border border-border/50 bg-muted/20 px-2 py-1.5 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase">Winsten</div>
                  <div className="text-lg font-bold text-green-600">{stats.wins}</div>
                </div>
                <div className="rounded border border-border/50 bg-muted/20 px-2 py-1.5 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase">Verliezen</div>
                  <div className="text-lg font-bold text-red-600">{stats.losses}</div>
                </div>
                <div className="rounded border border-border/50 bg-muted/20 px-2 py-1.5 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase">Winst %</div>
                  <div className="text-lg font-bold text-mainAccent">{stats.winPct}%</div>
                </div>
              </>
            ) : (
              <>
                <Card><CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm"><Target className="h-4 w-4" /> Partijen</div>
                  <p className="text-2xl font-bold text-textColor mt-1">{stats.total}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm"><Trophy className="h-4 w-4 text-green-600" /> Winsten</div>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.wins}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">Verliezen</div>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.losses}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingUp className="h-4 w-4 text-yellow-500" /> Winst %</div>
                  <p className="text-2xl font-bold text-mainAccent mt-1">{stats.winPct}%</p>
                </CardContent></Card>
              </>
            )}
          </div>

          {/* Prestatierating, beste overwinning, reeks, wit/zwart (zelfde periode) */}
          <PlayerHighlights games={filteredGames} playerId={playerId} />

          {compact && chartKeys.length > 0 ? (
            <Card className="border border-border/50">
              <CardHeader className="py-2 px-4 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold">
                  {currChart === "pie" && "Resultaten"}
                  {currChart === "month" && "Partijen per maand"}
                  {currChart === "tournament" && "Partijen per toernooi"}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setChartIndex((i) => (i - 1 + chartKeys.length) % chartKeys.length)}
                    className="p-1 rounded hover:bg-muted"
                    aria-label="Vorige grafiek"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-muted-foreground w-7 text-center tabular-nums">
                    {chartKeys.indexOf(currChart) + 1}/{chartKeys.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setChartIndex((i) => (i + 1) % chartKeys.length)}
                    className="p-1 rounded hover:bg-muted"
                    aria-label="Volgende grafiek"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4">
                {currChart === "pie" && stats.pieData.length > 0 && (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                          {stats.pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => [v, ""]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {currChart === "month" && stats.monthData.some((d) => d.partijen > 0) && (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.monthData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="maand" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: number, n: string) => [v, n === "partijen" ? "Partijen" : "Punten"]} />
                        <Bar dataKey="partijen" fill="var(--main-accent)" name="partijen" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {currChart === "tournament" && stats.tournamentData.length > 0 && (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.tournamentData} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="naam" width={100} tick={{ fontSize: 9 }} />
                        <Tooltip formatter={(v: number, n: string) => [v, n === "partijen" ? "Partijen" : "Punten"]} />
                        <Bar dataKey="partijen" fill="var(--main-accent)" name="partijen" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="score" fill="#94a3b8" name="score" radius={[0, 4, 4, 0]} />
                        <Legend />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}


          {!compact && (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stats.pieData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resultaten</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {stats.pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [v, ""]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Partijen per maand */}
            {stats.monthData.some((d) => d.partijen > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Partijen per maand
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.monthData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="maand" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(value: number, name: string) => [value, name === "partijen" ? "Partijen" : "Punten"]}
                        />
                        <Bar dataKey="partijen" fill="var(--main-accent)" name="partijen" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Per toernooi */}
          {stats.tournamentData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Partijen & punten per toernooi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.tournamentData}
                      layout="vertical"
                      margin={{ top: 8, right: 30, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="naam" width={120} tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          value,
                          name === "partijen" ? "Partijen" : "Punten",
                        ]}
                      />
                      <Bar dataKey="partijen" fill="var(--main-accent)" name="partijen" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="score" fill="#94a3b8" name="score" radius={[0, 4, 4, 0]} />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          </>
          )}
        </>
      )}

      {filteredEloHistory.length > 0 || filteredBlitzHistory.length > 0 ? (
        <EloHistoryChart history={filteredEloHistory} blitzHistory={filteredBlitzHistory} compact={compact} />
      ) : eloHistory.length > 0 || blitzHistory.length > 0 ? (
        <Card className={compact ? "border border-border/50" : undefined}>
          <CardContent className={compact ? "py-3 px-4" : "pt-6"}>
            <p className="text-muted-foreground text-sm">
              Geen ratingdata in {rangeLabel}.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

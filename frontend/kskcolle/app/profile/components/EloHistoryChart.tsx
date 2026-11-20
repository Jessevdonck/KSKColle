"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { nl } from "date-fns/locale"

interface RatingPoint {
  period: string // "YYYY-MM"
  rating: number
}

interface EloHistoryChartProps {
  history: RatingPoint[]
  /** Aparte blitzrating (blitz-/snelschaakkampioenschap), los van de ELIO */
  blitzHistory?: RatingPoint[]
  compact?: boolean
}

type SeriesKey = "elio" | "blitz"

const SERIES: Record<SeriesKey, { label: string; color: string }> = {
  elio: { label: "ELIO", color: "var(--main-accent)" },
  blitz: { label: "Blitz", color: "#0ea5e9" },
}

/** "2015-07" -> "jul '15" */
function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number)
  if (!year || !month) return period
  return format(new Date(year, month - 1, 1), "MMM ''yy", { locale: nl })
}

export default function EloHistoryChart({ history, blitzHistory = [], compact }: EloHistoryChartProps) {
  const hasElio = history.length > 0
  const hasBlitz = blitzHistory.length > 0
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({ elio: true, blitz: true })

  // Beide reeksen op één tijdsas: per periode een rij met (optioneel) ELIO en/of blitz
  const data = useMemo(() => {
    const rows = new Map<string, { period: string; label: string; elio?: number; blitz?: number }>()
    const row = (period: string) => {
      let r = rows.get(period)
      if (!r) rows.set(period, (r = { period, label: formatPeriodLabel(period) }))
      return r
    }
    history.forEach((h) => (row(h.period).elio = h.rating))
    blitzHistory.forEach((h) => (row(h.period).blitz = h.rating))
    return [...rows.values()].sort((a, b) => a.period.localeCompare(b.period))
  }, [history, blitzHistory])

  if (!hasElio && !hasBlitz) return null

  const available: SeriesKey[] = [...(hasElio ? ["elio" as const] : []), ...(hasBlitz ? ["blitz" as const] : [])]
  const shown = available.filter((k) => visible[k])

  const toggle = (key: SeriesKey) =>
    setVisible((v) => {
      // minstens één lijn zichtbaar houden
      if (v[key] && shown.length === 1) return v
      return { ...v, [key]: !v[key] }
    })

  const height = compact ? 200 : 260

  return (
    <Card className={compact ? "border border-border/50" : undefined}>
      <CardHeader className={compact ? "py-2 px-4" : undefined}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className={compact ? "text-sm font-semibold flex items-center gap-2" : "text-base flex items-center gap-2"}>
            <TrendingUp className="h-4 w-4" />
            Rating Progressie
          </CardTitle>
          {available.length > 1 && (
            <div className="flex items-center gap-1" role="group" aria-label="Zichtbare ratings">
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
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: visible[key] ? SERIES[key].color : "currentColor" }}
                  />
                  {SERIES[key].label}
                </button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={compact ? "pt-0 px-4 pb-4" : undefined}>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: compact ? 9 : 10 }} />
              <YAxis tick={{ fontSize: compact ? 10 : 11 }} domain={["auto", "auto"]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const row = payload[0].payload as { label: string; elio?: number; blitz?: number }
                  return (
                    <div className="rounded border bg-background px-2 py-1.5 text-xs shadow">
                      <div className="font-medium">{row.label}</div>
                      {shown.map((key) =>
                        row[key] !== undefined ? (
                          <div key={key} className="flex items-center gap-1.5">
                            <span className="inline-block h-2 w-2 rounded-full" style={{ background: SERIES[key].color }} />
                            {SERIES[key].label}: {row[key]}
                          </div>
                        ) : null,
                      )}
                    </div>
                  )
                }}
              />
              {shown.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={SERIES[key].color}
                  strokeWidth={2}
                  dot={{ r: compact ? 2 : 3 }}
                  connectNulls
                  name={SERIES[key].label}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

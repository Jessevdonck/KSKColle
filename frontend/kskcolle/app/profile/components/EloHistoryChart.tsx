"use client"

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

interface EloHistoryPoint {
  period: string // "YYYY-MM"
  rating: number
}

interface EloHistoryChartProps {
  history: EloHistoryPoint[]
  compact?: boolean
}

/** "2015-07" -> "jul '15" */
function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number)
  if (!year || !month) return period
  return format(new Date(year, month - 1, 1), "MMM ''yy", { locale: nl })
}

export default function EloHistoryChart({ history, compact }: EloHistoryChartProps) {
  if (!history || history.length === 0) return null

  const data = history.map((h) => ({
    label: formatPeriodLabel(h.period),
    period: h.period,
    rating: h.rating,
  }))

  const height = compact ? 200 : 260

  return (
    <Card className={compact ? "border border-border/50" : undefined}>
      <CardHeader className={compact ? "py-2 px-4" : undefined}>
        <CardTitle className={compact ? "text-sm font-semibold flex items-center gap-2" : "text-base flex items-center gap-2"}>
          <TrendingUp className="h-4 w-4" />
          Rating Progressie
        </CardTitle>
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
                  const row = payload[0].payload as { label: string; rating: number }
                  return (
                    <div className="rounded border bg-background px-2 py-1.5 text-xs shadow">
                      <div className="font-medium">{row.label}</div>
                      <div>{row.rating}</div>
                    </div>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="var(--main-accent)"
                strokeWidth={2}
                dot={{ r: compact ? 2 : 3 }}
                name="ELIO"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

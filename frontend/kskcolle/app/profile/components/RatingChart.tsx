"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react"
import useSWR from "swr"
import { getById } from "../../api/index"
import type { User } from "../../../data/types"

interface RatingChartProps {
  player: User
}

interface RatingChartData {
  date: string
  rating: number
  rating_change: number
  reason: string
}

export default function RatingChart({ player }: RatingChartProps) {
  const {
    data: chartData = [],
    error,
    isLoading,
  } = useSWR<RatingChartData[]>(
    `rating-history/${player.user_id}/chart`,
    () => getById(`rating-history/${player.user_id}/chart`).then((res) => res.items),
    {
      fallbackData: [],
      revalidateOnFocus: false,
    },
  )

  // Transformeer data voor de chart
  const data = chartData.map((item) => ({
    date: new Date(item.date).toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    }),
    rating: item.rating,
    rating_change: item.rating_change,
    reason: item.reason,
    fullDate: new Date(item.date).toLocaleDateString("nl-NL"),
  }))

  // Bereken trend alleen als er data is
  const ratingChange = data.length > 1 ? data[data.length - 1].rating - data[0].rating : 0

  const getTrendIcon = () => {
    if (ratingChange > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (ratingChange < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getTrendColor = () => {
    if (ratingChange > 0) return "text-green-600"
    if (ratingChange < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "game_result":
        return "Partij resultaat"
      case "tournament_end":
        return "Toernooi einde"
      case "manual_adjustment":
        return "Handmatige aanpassing"
      case "initial_rating":
        return "Startrating"
      default:
        return reason
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-mainAccent" />
            Rating Verloop
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-mainAccent" />
            Rating Verloop
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 text-2xl mb-2">⚠️</div>
              <p className="text-gray-600 text-sm">Kon rating data niet laden</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Als er geen data is, toon een lege state
  if (data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-mainAccent" />
            Rating Verloop
          </CardTitle>
          <p className="text-sm text-gray-600">Historisch overzicht van rating veranderingen</p>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full flex items-center justify-center">
            <div className="text-center">
              <div className="bg-mainAccent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-8 w-8 text-mainAccent" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-2">Nog geen rating geschiedenis</h3>
              <p className="text-gray-600 text-sm">
                Rating veranderingen worden automatisch bijgehouden wanneer partijen worden gespeeld.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-mainAccent" />
            Rating Verloop
          </CardTitle>
          {data.length > 1 && (
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {ratingChange > 0 ? "+" : ""}
                {ratingChange} punten
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600">
          Historisch overzicht van alle rating veranderingen ({data.length} wijzigingen)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#6B7280" }}
                axisLine={{ stroke: "#6B7280" }}
              />
              <YAxis
                domain={["dataMin - 50", "dataMax + 50"]}
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#6B7280" }}
                axisLine={{ stroke: "#6B7280" }}
              />
              <Tooltip
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload
                  return item ? `Datum: ${item.fullDate}` : label
                }}
                formatter={(value: number, name: string, props) => {
                  const change = props.payload.rating_change
                  const reason = getReasonLabel(props.payload.reason)
                  return [`${value} punten`, `Rating (${change > 0 ? "+" : ""}${change} - ${reason})`]
                }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#B17457"
                strokeWidth={3}
                dot={{ fill: "#B17457", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#B17457", strokeWidth: 2, fill: "#B17457" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Rating statistieken - alleen tonen als er data is */}
        {data.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Laagste</p>
              <p className="text-sm font-semibold text-gray-700">{Math.min(...data.map((d) => d.rating))}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Gemiddelde</p>
              <p className="text-sm font-semibold text-gray-700">
                {Math.round(data.reduce((sum, d) => sum + d.rating, 0) / data.length)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Hoogste</p>
              <p className="text-sm font-semibold text-gray-700">{Math.max(...data.map((d) => d.rating))}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

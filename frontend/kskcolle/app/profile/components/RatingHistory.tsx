"use client"

import { useState } from "react"
import useSWR from "swr"
import { getById } from "../../api/index"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { History, TrendingUp, TrendingDown, Trophy, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import type { User } from "../../../data/types"

interface RatingHistoryProps {
  player: User
}

interface RatingHistoryItem {
  id: number
  rating: number
  rating_change: number
  date: string
  reason: string
  game?: {
    round: {
      tournament: {
        naam: string
      }
    }
  }
  tournament?: {
    naam: string
  }
}

export default function RatingHistory({ player }: RatingHistoryProps) {
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  const {
    data: historyData = [],
    error,
    isLoading,
  } = useSWR<RatingHistoryItem[]>(
    `rating-history/${player.user_id}?limit=50`,
    () => getById(`rating-history/${player.user_id}?limit=50`).then((res) => res.items),
    {
      fallbackData: [],
      revalidateOnFocus: false,
    },
  )

  const totalPages = Math.ceil(historyData.length / itemsPerPage)
  const paginatedData = historyData.slice((page - 1) * itemsPerPage, page * itemsPerPage)

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

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "game_result":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "tournament_end":
        return "bg-green-100 text-green-800 border-green-200"
      case "manual_adjustment":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "initial_rating":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRatingChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-500" />
    return null
  }

  const getRatingChangeColor = (change: number) => {
    if (change > 0) return "text-green-600"
    if (change < 0) return "text-red-600"
    return "text-gray-600"
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-mainAccent" />
            Rating Geschiedenis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
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
            <History className="h-5 w-5 text-mainAccent" />
            Rating Geschiedenis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 text-2xl mb-2">⚠️</div>
            <p className="text-gray-600 text-sm">Kon rating geschiedenis niet laden</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (historyData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-mainAccent" />
            Rating Geschiedenis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="bg-mainAccent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <History className="h-8 w-8 text-mainAccent" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-2">Nog geen rating geschiedenis</h3>
            <p className="text-gray-600 text-sm">
              Rating veranderingen worden automatisch bijgehouden wanneer partijen worden gespeeld.
            </p>
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
            <History className="h-5 w-5 text-mainAccent" />
            Rating Geschiedenis
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {historyData.length} veranderingen
          </Badge>
        </div>
        <p className="text-sm text-gray-600">Overzicht van alle rating veranderingen</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {paginatedData.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-mainAccent/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`text-xs border ${getReasonColor(item.reason)}`}>
                      {getReasonLabel(item.reason)}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(item.date), "dd MMM yyyy, HH:mm", { locale: nl })}
                    </div>
                  </div>

                  {/* Tournament/Game info */}
                  {(item.game?.round.tournament.naam || item.tournament?.naam) && (
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-3 w-3 text-mainAccent" />
                      <span className="text-sm text-gray-700">
                        {item.game?.round.tournament.naam || item.tournament?.naam}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    {getRatingChangeIcon(item.rating_change)}
                    <span className={`text-sm font-semibold ${getRatingChangeColor(item.rating_change)}`}>
                      {item.rating_change > 0 ? "+" : ""}
                      {item.rating_change}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-800">{item.rating}</div>
                  <div className="text-xs text-gray-500">nieuwe rating</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="bg-transparent"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Vorige
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Pagina {page} van {totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="bg-transparent"
            >
              Volgende
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

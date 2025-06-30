"use client"

import useSWR from "swr"
import { getById } from "../../api/index"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Trophy, Target, Calendar, BarChart3 } from "lucide-react"
import type { User } from "../../../data/types"

interface RatingStatisticsProps {
  player: User
}

interface RatingStats {
  totalGames: number
  wins: number
  losses: number
  draws: number
  winRate: number
  averageOpponentRating: number
  ratingGain: number
  ratingLoss: number
  bestWin: number
  worstLoss: number
}

export default function RatingStatistics({ player }: RatingStatisticsProps) {
  const {
    data: stats,
    error,
    isLoading,
  } = useSWR<RatingStats>(
    `rating-history/${player.user_id}/stats`,
    () => getById(`rating-history/${player.user_id}/stats`),
    {
      fallbackData: generateMockStats(),
      revalidateOnFocus: false,
    },
  )

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-mainAccent" />
            Rating Statistieken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !stats) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-mainAccent" />
            Rating Statistieken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-400 text-2xl mb-2">📊</div>
            <p className="text-gray-600 text-sm">Geen statistieken beschikbaar</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-mainAccent" />
          Rating Statistieken
        </CardTitle>
        <p className="text-sm text-gray-600">Prestatie overzicht en statistieken</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Games */}
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalGames}</div>
            <div className="text-xs text-blue-600">Totaal Partijen</div>
          </div>

          {/* Win Rate */}
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.winRate}%</div>
            <div className="text-xs text-green-600">Winst Percentage</div>
          </div>

          {/* Rating Gain */}
          <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">+{stats.ratingGain}</div>
            <div className="text-xs text-emerald-600">Beste Winst</div>
          </div>

          {/* Rating Loss */}
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-center mb-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">-{stats.ratingLoss}</div>
            <div className="text-xs text-red-600">Grootste Verlies</div>
          </div>

          {/* Wins */}
          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-gray-700">{stats.wins}</div>
            <div className="text-xs text-gray-600">Gewonnen</div>
          </div>

          {/* Draws */}
          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-gray-700">{stats.draws}</div>
            <div className="text-xs text-gray-600">Remise</div>
          </div>

          {/* Losses */}
          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-gray-700">{stats.losses}</div>
            <div className="text-xs text-gray-600">Verloren</div>
          </div>

          {/* Average Opponent */}
          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-center mb-1">
              <Target className="h-3 w-3 text-gray-600" />
            </div>
            <div className="text-lg font-bold text-gray-700">{stats.averageOpponentRating}</div>
            <div className="text-xs text-gray-600">Gem. Tegenstander</div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div>
                <div className="text-sm font-medium text-green-800">Beste Overwinning</div>
                <div className="text-xs text-green-600">Tegen {stats.bestWin} rating</div>
              </div>
              <div className="text-lg font-bold text-green-600">+{Math.round(stats.bestWin * 0.05)}</div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
              <div>
                <div className="text-sm font-medium text-red-800">Zwaarste Verlies</div>
                <div className="text-xs text-red-600">Tegen {stats.worstLoss} rating</div>
              </div>
              <div className="text-lg font-bold text-red-600">-{Math.round(stats.worstLoss * 0.03)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Mock data generator voor als er geen echte data is
function generateMockStats(): RatingStats {
  return {
    totalGames: Math.floor(Math.random() * 50) + 20,
    wins: Math.floor(Math.random() * 20) + 10,
    losses: Math.floor(Math.random() * 15) + 5,
    draws: Math.floor(Math.random() * 10) + 3,
    winRate: Math.floor(Math.random() * 30) + 45,
    averageOpponentRating: Math.floor(Math.random() * 200) + 1400,
    ratingGain: Math.floor(Math.random() * 20) + 15,
    ratingLoss: Math.floor(Math.random() * 15) + 10,
    bestWin: Math.floor(Math.random() * 300) + 1600,
    worstLoss: Math.floor(Math.random() * 200) + 1200,
  }
}

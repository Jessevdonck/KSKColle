"use client"

import { Trophy, Medal, Zap } from "lucide-react"
import useSWR from "swr"
import { getAllHonors } from "../api/index"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { nl } from "date-fns/locale"

interface HonorTournament {
  tournament_id: number
  naam: string
  class_name?: string | null
  is_youth: boolean
  jaar: number
  podium: Array<{
    position: number
    user: { user_id: number; voornaam: string; achternaam: string }
  }>
}

const positionEmoji = (position: number) => {
  switch (position) {
    case 1:
      return "🥇"
    case 2:
      return "🥈"
    case 3:
      return "🥉"
    default:
      return "🏅"
  }
}

const positionLabel = (position: number) => {
  switch (position) {
    case 1:
      return "1e plaats"
    case 2:
      return "2e plaats"
    case 3:
      return "3e plaats"
    default:
      return `${position}e plaats`
  }
}

const createUrlFriendlyName = (voornaam: string, achternaam: string): string => {
  return `${voornaam}_${achternaam}`.replace(/\s+/g, "_")
}

export default function ErelijstenPage() {
  const { data: honors = [], isLoading, error } = useSWR("honors", getAllHonors)

  const honorsPerYear = honors.reduce(
    (acc, honor) => {
      if (!acc[honor.jaar]) {
        acc[honor.jaar] = []
      }
      acc[honor.jaar].push(honor)
      return acc
    },
    {} as Record<number, HonorTournament[]>
  )

  const sortedYears = Object.keys(honorsPerYear)
    .map(Number)
    .sort((a, b) => b - a)

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h1 className="text-2xl font-bold mb-2">Erelijsten</h1>
          <p className="text-gray-600">Er kon geen data worden geladen.</p>
        </div>
      </main>
    )
  }

  if (isLoading || honors.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h1 className="text-2xl font-bold mb-2">Erelijsten</h1>
          <p className="text-gray-600">
            {isLoading ? "Laden..." : "Nog geen gesloten toernooien met podiumplaatsen."}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <Trophy className="text-yellow-500" size={32} />
            Erelijsten
          </h1>
          <p className="text-gray-600">Podiumplaatsen van gesloten toernooien</p>
        </div>
      </div>

      <div className="space-y-8">
        {sortedYears.map((jaar) => (
          <div key={jaar}>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{jaar}</h2>
            <div className="grid gap-4">
              {honorsPerYear[jaar].map((honor) => (
                <Card key={honor.tournament_id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-mainAccent/10 to-mainAccent/5 pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{honor.naam}</CardTitle>
                        {honor.class_name && (
                          <p className="text-sm text-gray-600 mt-1">{honor.class_name}</p>
                        )}
                      </div>
                      {honor.is_youth && <Badge variant="secondary">Jeugd</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {honor.podium.map((entry) => (
                        <div key={entry.position} className="flex items-center gap-3 py-2">
                          <span className="text-2xl w-8 text-center">{positionEmoji(entry.position)}</span>
                          <span className="text-sm font-medium text-gray-600 w-16">
                            {positionLabel(entry.position)}
                          </span>
                          <Link
                            href={`/profile/${createUrlFriendlyName(
                              entry.user.voornaam,
                              entry.user.achternaam
                            )}`}
                            className="text-gray-900 hover:text-mainAccent hover:underline flex-1"
                          >
                            {entry.user.voornaam} {entry.user.achternaam}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {honors.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p className="text-gray-600">Nog geen toernooien afgesloten met erelijsten.</p>
        </div>
      )}
    </main>
  )
}

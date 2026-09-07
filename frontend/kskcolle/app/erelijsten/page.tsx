"use client"

import { Trophy, Medal } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import useSWR from "swr"
import { getAllHonors } from "../api/index"
import {
  cleanPlayerName,
  fetchErelijstRows,
  processSimpleData,
  processKlasseData,
  processZomerData,
  processSnelschaakData,
  EXCEL_FILES,
  type Result,
  type KlasseResult,
} from "../../lib/erelijsten"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const createUrlFriendlyName = (voornaam: string, achternaam: string): string => {
  return `${voornaam}_${achternaam}`.replace(/\s+/g, "_")
}

const createClickableName = (name: string) => {
  const displayName = cleanPlayerName(name)
  if (!displayName || displayName === "-") {
    return <span className="text-gray-500">{displayName || "-"}</span>
  }

  const nameParts = displayName.split(" ")
  if (nameParts.length < 2) {
    return <span className="text-gray-700">{displayName}</span>
  }

  const voornaam = nameParts[0]
  const achternaam = nameParts.slice(1).join(" ")
  const profileUrl = `/profile/${createUrlFriendlyName(voornaam, achternaam)}`

  return (
    <Link
      href={profileUrl}
      className="text-gray-900 hover:text-mainAccent hover:underline transition-colors"
    >
      {displayName}
    </Link>
  )
}

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

const TournamentSection = ({
  title,
  data,
}: {
  title: string
  data: (Result | KlasseResult | HonorTournament)[]
}) => {
  if (data.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{title}</h2>
      <div className="space-y-3">
        {data.map((item, idx) => {
          // Database honors (HonorTournament)
          if ("podium" in item) {
            const honor = item as HonorTournament
            return (
              <Card key={`honor-${honor.tournament_id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{honor.naam}</CardTitle>
                      {honor.class_name && (
                        <p className="text-xs text-gray-600 mt-1">{honor.class_name}</p>
                      )}
                    </div>
                    {honor.is_youth && <Badge variant="secondary">Jeugd</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-1">
                    {honor.podium.map((entry) => (
                      <div key={entry.position} className="flex items-center gap-2 text-sm">
                        <span className="w-6">{positionEmoji(entry.position)}</span>
                        <span className="text-gray-600 w-14">Plaats {entry.position}</span>
                        <div className="flex-1">
                          {createClickableName(`${entry.user.voornaam} ${entry.user.achternaam}`)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          }

          // Excel data - KlasseResult
          if ("klasses" in item) {
            const result = item as KlasseResult
            return (
              <div key={`klasse-${idx}`} className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="font-semibold text-sm text-gray-800 mb-2">
                  {result.jaar}
                </p>
                <div className="space-y-1 text-sm">
                  {result.klasses.map((k, ki) => (
                    <div key={ki} className="flex gap-2">
                      <span className="font-medium text-gray-700 w-32">{k.klasse}</span>
                      <span className="flex-1">
                        {k.eerste && (
                          <span>
                            🥇 {createClickableName(k.eerste)}
                            {k.tweede && ` • 🥈 ${createClickableName(k.tweede)}`}
                            {k.derde && ` • 🥉 ${createClickableName(k.derde)}`}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }

          // Excel data - Result (simple)
          const result = item as Result
          return (
            <div key={`simple-${idx}`} className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="font-semibold text-sm text-gray-800 mb-2">
                {result.jaar}
              </p>
              <div className="text-sm space-y-0.5">
                {result.eerste && (
                  <p>
                    🥇 {createClickableName(result.eerste)}
                  </p>
                )}
                {result.tweede && (
                  <p>
                    🥈 {createClickableName(result.tweede)}
                  </p>
                )}
                {result.derde && (
                  <p>
                    🥉 {createClickableName(result.derde)}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ErelijstenPage() {
  const { data: honors = [] } = useSWR("honors", getAllHonors)
  const [data, setData] = useState<{
    simpel: Result[]
    klasses: KlasseResult[]
    zomer: Result[]
    snelschaak: KlasseResult[]
  } | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const results = {
        simpel: [] as Result[],
        klasses: [] as KlasseResult[],
        zomer: [] as Result[],
        snelschaak: [] as KlasseResult[],
      }

      for (const file of EXCEL_FILES) {
        try {
          const rows = await fetchErelijstRows(file.file)

          if (file.name === "Herfstcompetitie") {
            results.klasses = processKlasseData(rows)
          } else if (file.name === "Lentecompetitie") {
            results.simpel = processSimpleData(rows)
          } else if (file.name === "Zomertoernooi") {
            results.zomer = processZomerData(rows)
          } else if (file.name === "Snelschaak") {
            results.snelschaak = processSnelschaakData(rows)
          }
        } catch (error) {
          console.warn(`Failed to load ${file.name}:`, error)
        }
      }

      setData(results)
    }
    loadData()
  }, [])

  if (!data) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h1 className="text-2xl font-bold mb-2">Erelijsten</h1>
          <p className="text-gray-600">Laden...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <Trophy className="text-yellow-500" size={32} />
            Erelijsten
          </h1>
          <p className="text-gray-600">Alle podiumplaatsen van onze toernooien</p>
        </div>
      </div>

      <div className="space-y-12">
        <TournamentSection
          title="Herfstcompetitie"
          data={data.klasses.filter((r) => r.jaar >= 2010).sort((a, b) => b.jaar - a.jaar)}
        />

        <TournamentSection
          title="Lentecompetitie"
          data={data.simpel.filter((r) => r.jaar >= 2010).sort((a, b) => b.jaar - a.jaar)}
        />

        <TournamentSection
          title="Zomertoernooi"
          data={data.zomer.filter((r) => r.jaar >= 2010).sort((a, b) => b.jaar - a.jaar)}
        />

        <TournamentSection
          title="Snelschaak"
          data={data.snelschaak.filter((r) => r.jaar >= 2010).sort((a, b) => b.jaar - a.jaar)}
        />

        {/* Database honors (recent tournaments) */}
        {honors.length > 0 && (
          <TournamentSection
            title="Recente Toernooien"
            data={honors.sort((a, b) => b.jaar - a.jaar)}
          />
        )}
      </div>
    </main>
  )
}

"use client"

import useSWR from "swr"
import { Trophy } from "lucide-react"
import { getUserHonors } from "../../api/index"
import { getHistorischPalmares } from "../../../lib/erelijsten"

interface Honor {
  honor_id: number
  position: number
  jaar: number
  tournament: {
    tournament_id: number
    naam: string
    class_name?: string | null
    is_youth: boolean
  }
}

interface PalmaresItem {
  key: string
  jaar: number
  titel: string
  /** 1, 2, 3 of 4 (= ratingprijs) */
  positie: number
}

const positionDisplay = (positie: number) => {
  switch (positie) {
    case 1:
      return { icon: "🥇", label: "Winnaar" }
    case 2:
      return { icon: "🥈", label: "Tweede plaats" }
    case 3:
      return { icon: "🥉", label: "Derde plaats" }
    case 4:
      return { icon: "🏅", label: "Ratingprijs" }
    default:
      return { icon: "🏅", label: `${positie}e plaats` }
  }
}

/** Zelfde competitie-bucket als de erelijsten, voor dedupe DB vs Excel. */
const competitieBucket = (naam: string): string => {
  const n = naam.toLowerCase()
  if (n.includes("herfst")) return "herfst"
  if (n.includes("lente")) return "lente"
  if (n.includes("zomer")) return "zomer"
  if (n.includes("snelschaak") || n.includes("blitz") || n.includes("snel")) return "snelschaak"
  if (n.includes("konijn")) return "konijn"
  if (n.includes("megalijst") || n.includes("mega")) return "megalijst"
  return n
}

export default function Palmares({
  playerId,
  voornaam,
  achternaam,
}: {
  playerId: number
  voornaam: string
  achternaam: string
}) {
  // Automatisch vastgelegde podia (afgesloten toernooien)
  const { data: honors = [] } = useSWR<Honor[]>(
    ["palmares", playerId],
    () => getUserHonors(playerId),
    { revalidateOnFocus: false },
  )

  // Historische erelijsten uit de Excel-bestanden
  const { data: historisch = [] } = useSWR(
    ["palmares-historiek", voornaam, achternaam],
    () => getHistorischPalmares(voornaam, achternaam),
    { revalidateOnFocus: false },
  )

  // Samenvoegen; bij overlap (zelfde competitie, jaar en plaats) wint de database-entry
  const seen = new Set<string>()
  const items: PalmaresItem[] = []

  for (const honor of honors) {
    const key = `${competitieBucket(honor.tournament.naam)}|${honor.jaar}|${honor.position}`
    seen.add(key)
    items.push({
      key: `db-${honor.honor_id}`,
      jaar: honor.jaar,
      titel: honor.tournament.class_name
        ? `${honor.tournament.naam} – ${honor.tournament.class_name}`
        : honor.tournament.naam,
      positie: honor.position,
    })
  }

  for (const entry of historisch) {
    const key = `${entry.bucket}|${entry.jaar}|${entry.positie}`
    if (seen.has(key)) continue
    seen.add(key)
    items.push({
      key: `xls-${key}-${entry.competitie}`,
      jaar: entry.jaar,
      titel: entry.competitie,
      positie: entry.positie,
    })
  }

  items.sort((a, b) => b.jaar - a.jaar || a.positie - b.positie)

  // Geen palmares: sectie niet tonen
  if (items.length === 0) {
    return null
  }

  const telling = {
    goud: items.filter((i) => i.positie === 1).length,
    zilver: items.filter((i) => i.positie === 2).length,
    brons: items.filter((i) => i.positie === 3).length,
    rating: items.filter((i) => i.positie === 4).length,
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Palmares
        </h2>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
          {telling.goud > 0 && <span>🥇 {telling.goud}</span>}
          {telling.zilver > 0 && <span>🥈 {telling.zilver}</span>}
          {telling.brons > 0 && <span>🥉 {telling.brons}</span>}
          {telling.rating > 0 && <span>🏅 {telling.rating}</span>}
        </div>
      </div>
      <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
        {items.map((item) => {
          const { icon, label } = positionDisplay(item.positie)
          return (
            <li key={item.key} className="px-4 py-2 flex items-center gap-3">
              <span className="text-lg" aria-hidden>{icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {item.titel}
                </div>
                <div className="text-xs text-gray-500">
                  {label} · {item.jaar}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

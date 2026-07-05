"use client"

import useSWR from "swr"
import { Trophy } from "lucide-react"
import { getUserHonors } from "../../api/index"

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

const positionDisplay = (position: number) => {
  switch (position) {
    case 1:
      return { icon: "🥇", label: "Winnaar" }
    case 2:
      return { icon: "🥈", label: "Tweede plaats" }
    case 3:
      return { icon: "🥉", label: "Derde plaats" }
    default:
      return { icon: "🏅", label: `${position}e plaats` }
  }
}

export default function Palmares({ playerId }: { playerId: number }) {
  const { data: honors = [] } = useSWR<Honor[]>(
    ["palmares", playerId],
    () => getUserHonors(playerId),
    { revalidateOnFocus: false },
  )

  // Geen palmares: sectie niet tonen
  if (honors.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Palmares
        </h2>
      </div>
      <ul className="divide-y divide-gray-100">
        {honors.map((honor) => {
          const { icon, label } = positionDisplay(honor.position)
          return (
            <li key={honor.honor_id} className="px-4 py-2 flex items-center gap-3">
              <span className="text-lg" aria-hidden>{icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {honor.tournament.naam}
                  {honor.tournament.class_name ? ` – ${honor.tournament.class_name}` : ""}
                </div>
                <div className="text-xs text-gray-500">
                  {label} · {honor.jaar}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

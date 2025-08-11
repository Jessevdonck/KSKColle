"use client"

import useSWR from "swr"
import type { CalendarEvent } from "../../../data/types"
import { getAll } from "@/app/api"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Calendar, Clock, Info } from "lucide-react"

const PlannedActivities = () => {
  const { data: events, error } = useSWR<CalendarEvent[]>("calendar", getAll)

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Fout bij laden van activiteiten</h2>
          <p className="text-gray-600 text-sm">Er is een probleem opgetreden bij het ophalen van de activiteiten.</p>
        </div>
      </div>
    )
  }

  if (!events) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent mx-auto mb-3"></div>
          <p className="text-gray-600 text-base">Activiteiten worden geladen...</p>
        </div>
      </div>
    )
  }

  const getEventTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "interclub":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "toernooi":
        return "bg-green-100 text-green-800 border-green-200"
      case "ronde":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "inhaaldag":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "oost-vlaamse interclub":
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case "vergadering":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  /* const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "interclub":
      case "oost-vlaamse interclub":
        return "🏆"
      case "toernooi":
        return "♟️"
      case "ronde":
        return "🎯"
      case "inhaaldag":
        return "📅"
      case "vergadering":
        return "👥"
      default:
        return "📋"
    }
  } */

  // Sorteer events op datum (meest recente eerst)
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-mainAccent/10 p-2 rounded-lg">
              <Calendar className="h-6 w-6 text-mainAccent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-textColor">Geplande Activiteiten</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{events.length} geplande activiteiten</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {events.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Geen Activiteiten
              </h2>
            </div>
            <div className="p-8 text-center">
              <div className="bg-mainAccent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-8 w-8 text-mainAccent" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">Geen activiteiten gepland</h3>
              <p className="text-gray-600 text-sm">Er zijn momenteel geen activiteiten ingepland.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Komende Activiteiten
              </h2>
              <p className="text-white/80 mt-1 text-sm">{events.length} activiteiten gepland</p>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-mainAccent/10 to-mainAccentDark/10 border-b border-neutral-200">
                    <th className="p-3 text-left font-semibold text-textColor text-sm">
                      <div className="flex items-center gap-2">
                        <Info className="h-3 w-3" />
                        Activiteit
                      </div>
                    </th>
                    <th className="p-3 text-left font-semibold text-textColor text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Datum
                      </div>
                    </th>
                    <th className="p-3 text-left font-semibold text-textColor text-sm">Type</th>
                    <th className="p-3 text-left font-semibold text-textColor text-sm">Beschrijving</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEvents.map((event, index) => (
                    <tr
                      key={event.event_id}
                      className={`border-b border-neutral-100 transition-all hover:bg-mainAccent/5 ${
                        index % 2 === 0 ? "bg-white" : "bg-neutral-50/50"
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-textColor text-sm">{event.title}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-mainAccent" />
                          <span className="text-gray-700 text-sm">
                            {format(new Date(event.date), "dd MMM yyyy", { locale: nl })}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(
                            event.type,
                          )}`}
                        >
                          {event.type}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-gray-600 text-sm">
                          {event.description || "Geen beschrijving beschikbaar"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-3 space-y-3">
              {sortedEvents.map((event) => (
                <div
                  key={event.event_id}
                  className="border border-neutral-200 rounded-lg p-3 hover:border-mainAccent/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <h3 className="font-semibold text-textColor text-sm">{event.title}</h3>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}
                    >
                      {event.type}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(event.date), "dd MMM yyyy", { locale: nl })}</span>
                    </div>
                    {event.description && (
                      <div className="flex items-start gap-2 text-gray-600">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{event.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlannedActivities

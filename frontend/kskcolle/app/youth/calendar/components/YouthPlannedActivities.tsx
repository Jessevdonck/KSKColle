"use client"

import useSWR from "swr"
import type { CalendarEvent } from "../../../../data/types"
import { getAll } from "@/app/api"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Calendar, Clock, Info, Users, Tag } from "lucide-react"

const YouthPlannedActivities = () => {
  const { data: events, error } = useSWR<CalendarEvent[]>("calendar?is_youth=true", getAll)

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Fout bij laden van jeugd activiteiten</h2>
          <p className="text-gray-600 text-sm">Er is een probleem opgetreden bij het ophalen van de jeugd activiteiten.</p>
        </div>
      </div>
    )
  }

  if (!events) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent mx-auto mb-3"></div>
          <p className="text-gray-600 text-base">Jeugd activiteiten worden geladen...</p>
        </div>
      </div>
    )
  }

  const getEventTypeColor = (type: string) => {
    const colors = {
      "Interclub": "bg-blue-100 text-blue-800 border-blue-200",
      "Toernooi": "bg-green-100 text-green-800 border-green-200",
      "Oost-Vlaamse Interclub": "bg-purple-100 text-purple-800 border-purple-200",
      "Vergadering": "bg-orange-100 text-orange-800 border-orange-200",
      "Activiteit": "bg-gray-100 text-gray-800 border-gray-200",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      "Stap 1": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Stap 2": "bg-orange-100 text-orange-800 border-orange-200",
      "Stap 3+4": "bg-red-100 text-red-800 border-red-200",
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const sortedEvents = events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="bg-mainAccent/10 p-4 rounded-xl inline-flex mb-4">
              <Users className="h-12 w-12 text-mainAccent" />
            </div>
            <h1 className="text-4xl font-bold text-textColor mb-2">Jeugd Kalender</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Overzicht van alle geplande jeugd activiteiten en evenementen
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Stats */}
          <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  Jeugd Activiteiten
                </h2>

              </div>

            </div>
          </div>

          {/* Events List */}
          {sortedEvents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Geen jeugd activiteiten</h3>
              <p className="text-gray-500">Er zijn momenteel geen jeugd activiteiten gepland.</p>
            </div>
          ) : (
            <div>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Titel</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Datum & Tijd</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Categorie</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Beschrijving</th>
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
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-textColor text-sm">{event.title}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-mainAccent" />
                            <span className="text-gray-700 text-sm">
                              {format(new Date(event.date), "dd MMM yyyy", { locale: nl })}
                            </span>
                            {event.startuur && (
                              <span className="text-mainAccent font-medium text-sm">
                                • {event.startuur}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(
                              event.type,
                            )}`}
                          >
                            {event.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {event.category && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                                event.category,
                              )}`}
                            >
                              {event.category}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
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
                      <div className="flex flex-col gap-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}
                        >
                          {event.type}
                        </span>
                        {event.category && (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(event.category)}`}
                          >
                            {event.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(event.date), "dd MMM yyyy", { locale: nl })}</span>
                        {event.startuur && (
                          <span className="text-mainAccent font-medium">
                            • {event.startuur}
                          </span>
                        )}
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
    </div>
  )
}

export default YouthPlannedActivities

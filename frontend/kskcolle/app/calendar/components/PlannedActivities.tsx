"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import type { CalendarEvent } from "../../../data/types"
import { getAll } from "@/app/api"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Calendar, Clock, Info } from "lucide-react"
import CalendarFilters from "../../components/CalendarFilters"

const PlannedActivities = () => {
  const { data: events, error } = useSWR<CalendarEvent[]>("calendar?is_youth=false", getAll)
  
  // Filter states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Available filter options
  const eventTypes = [
    { value: "Interclub", label: "Interclub", color: "bg-blue-100 text-blue-800 border-blue-200" },
    { value: "Oost-Vlaamse Interclub", label: "Oost-Vlaamse Interclub", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    { value: "Toernooi", label: "Toernooi", color: "bg-green-100 text-green-800 border-green-200" },
    { value: "Ronde", label: "Ronde", color: "bg-purple-100 text-purple-800 border-purple-200" },
    { value: "Inhaaldag", label: "Inhaaldag", color: "bg-amber-100 text-amber-800 border-amber-200" },
    { value: "Vergadering", label: "Vergadering", color: "bg-orange-100 text-orange-800 border-orange-200" },
    { value: "Activiteit", label: "Activiteit", color: "bg-gray-100 text-gray-800 border-gray-200" }
  ]

  const categories = [
    { value: "IC", label: "IC", color: "bg-blue-100 text-blue-800 border-blue-200" },
    { value: "OVIC", label: "OVIC", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    { value: "Toernooi", label: "Toernooi", color: "bg-green-100 text-green-800 border-green-200" },
    { value: "Training", label: "Training", color: "bg-purple-100 text-purple-800 border-purple-200" },
    { value: "Vergadering", label: "Vergadering", color: "bg-orange-100 text-orange-800 border-orange-200" }
  ]

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    if (!events) return []
    
    return events.filter(event => {
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(event.type)
      const categoryMatch = selectedCategories.length === 0 || 
        (event.category && selectedCategories.some(cat => 
          event.category?.toString().toLowerCase().includes(cat.toLowerCase())
        ))
      
      return typeMatch && categoryMatch
    })
  }, [events, selectedTypes, selectedCategories])

  const handleClearAll = () => {
    setSelectedTypes([])
    setSelectedCategories([])
  }

  const hasActiveFilters = selectedTypes.length > 0 || selectedCategories.length > 0

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

  // Sorteer events op datum (dichtstbijzijnde eerst)
  const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group events by month for month view
  const eventsByMonth = sortedEvents.reduce((acc, event) => {
    const eventDate = new Date(event.date)
    const monthKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`
    const monthName = format(eventDate, "MMMM yyyy", { locale: nl })
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        monthName,
        events: []
      }
    }
    acc[monthKey].events.push(event)
    return acc
  }, {} as Record<string, { monthName: string; events: CalendarEvent[] }>)

  // Sort months chronologically (earliest first)
  const monthEntries = Object.entries(eventsByMonth).sort(([a], [b]) => {
    const [yearA, monthA] = a.split('-').map(Number)
    const [yearB, monthB] = b.split('-').map(Number)
    
    if (yearA !== yearB) {
      return yearA - yearB
    }
    return monthA - monthB
  })


  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="bg-mainAccent/10 p-1.5 rounded-lg">
              <Calendar className="h-5 w-5 text-mainAccent" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-textColor">Geplande Activiteiten</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        {/* Filters */}
        <div className="mb-4">
          <CalendarFilters
            eventTypes={eventTypes}
            categories={categories}
            selectedTypes={selectedTypes}
            selectedCategories={selectedCategories}
            onTypesChange={setSelectedTypes}
            onCategoriesChange={setSelectedCategories}
            onClearAll={handleClearAll}
            isYouth={false}
          />
          {/* Results count */}
          {hasActiveFilters && (
            <div className="mt-3 text-sm text-gray-600">
              {filteredEvents.length} van {events?.length || 0} activiteiten getoond
            </div>
          )}
        </div>

        {filteredEvents.length === 0 ? (
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
              <h3 className="text-lg font-bold text-gray-700 mb-2">
                {events?.length === 0 ? "Geen activiteiten gepland" : "Geen resultaten gevonden"}
              </h3>
              <p className="text-gray-600 text-sm">
                {events?.length === 0 
                  ? "Er zijn momenteel geen activiteiten ingepland." 
                  : "Probeer andere filters om meer resultaten te zien."
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {monthEntries.map(([monthKey, { monthName, events: monthEvents }]) => (
              <div key={monthKey} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Month Header */}
                <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-3 py-2">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {monthName}
                  </h2>
                  <p className="text-white/80 mt-0.5 text-xs">{monthEvents.length} activiteit{monthEvents.length !== 1 ? 'en' : ''}</p>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-mainAccent/10 to-mainAccentDark/10 border-b-2 border-mainAccent/20">
                        <th className="p-3 text-left font-semibold text-textColor text-xs w-1/4 border-r border-mainAccent/10">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Datum & Tijd
                          </div>
                        </th>
                        <th className="p-3 text-left font-semibold text-textColor text-xs w-1/4 border-r border-mainAccent/10">
                          <div className="flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            Activiteit
                          </div>
                        </th>
                        <th className="p-3 text-left font-semibold text-textColor text-xs w-1/3 border-r border-mainAccent/10">Beschrijving</th>
                        <th className="p-3 text-left font-semibold text-textColor text-xs w-1/6">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthEvents.map((event, index) => (
                        <tr
                          key={event.event_id}
                          className={`border-b border-neutral-200 transition-all hover:bg-mainAccent/5 ${
                            index % 2 === 0 ? "bg-white" : "bg-neutral-50/30"
                          }`}
                        >
                          {/* Datum & Tijd */}
                          <td className="p-3 border-r border-neutral-200">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-mainAccent" />
                              <span className="text-gray-700 text-xs">
                                {format(new Date(event.date), "EEEE dd MMM yyyy", { locale: nl })}
                              </span>
                              {event.startuur && (
                                <span className="text-mainAccent font-medium text-xs">
                                  • {event.startuur}
                                </span>
                              )}
                            </div>
                          </td>
                          
                          {/* Activiteit */}
                          <td className="p-3 border-r border-neutral-200">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-textColor text-xs">{event.title}</span>
                            </div>
                          </td>
                          
                          {/* Beschrijving */}
                          <td className="p-3 border-r border-neutral-200">
                            {event.description ? (
                              <span className="text-gray-600 text-xs">
                                {event.description}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs italic">Geen beschrijving</span>
                            )}
                          </td>
                          
                          {/* Type */}
                          <td className="p-3">
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getEventTypeColor(
                                event.type,
                              )}`}
                            >
                              {event.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden p-2 space-y-2">
                  {monthEvents.map((event) => (
                    <div
                      key={event.event_id}
                      className="border border-neutral-200 rounded-lg p-2 hover:border-mainAccent/30 transition-all"
                    >
                      {/* Datum & Tijd */}
                      <div className="flex items-center gap-1 text-gray-600 mb-2">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs font-medium">
                          {format(new Date(event.date), "EEEE dd MMM yyyy", { locale: nl })}
                        </span>
                        {event.startuur && (
                          <span className="text-mainAccent font-medium text-xs">
                            • {event.startuur}
                          </span>
                        )}
                      </div>

                      {/* Activiteit */}
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-textColor text-xs flex-1">{event.title}</h3>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}
                        >
                          {event.type}
                        </span>
                      </div>

                      {/* Beschrijving */}
                      {event.description && (
                        <div className="flex items-start gap-1 text-gray-600">
                          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="text-xs">{event.description}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PlannedActivities

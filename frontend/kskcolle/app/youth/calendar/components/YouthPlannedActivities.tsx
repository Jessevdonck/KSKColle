"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import type { CalendarEvent } from "../../../../data/types"
import { getAll } from "@/app/api"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { CalendarIcon, Clock, Info, Users, Tag } from "lucide-react"
import Link from "next/link"
import CalendarFilters from "../../../components/CalendarFilters"

const YouthPlannedActivities = () => {
  const { data: events, error } = useSWR<CalendarEvent[]>("calendar?is_youth=true", getAll)
  
  // Filter states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedSteps, setSelectedSteps] = useState<string[]>([])

  // Available filter options for youth
  const eventTypes = [
    { value: "Les", label: "Les", color: "bg-blue-100 text-blue-800 border-blue-200" },
    { value: "Toernooi", label: "Toernooi", color: "bg-green-100 text-green-800 border-green-200" },
    { value: "Geen Les", label: "Geen Les", color: "bg-red-100 text-red-800 border-red-200" }
  ]

  // Available steps for youth
  const stepsCategories = [
    { value: "Stap 1", label: "Stap 1", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    { value: "Stap 2", label: "Stap 2", color: "bg-orange-100 text-orange-800 border-orange-200" },
    { value: "Stap 3+4", label: "Stap 3+4", color: "bg-red-100 text-red-800 border-red-200" }
  ]

  // Helper function to parse categories
  const parseCategories = (categoryJson: string | string[] | undefined): string[] => {
    if (!categoryJson) return []
    if (Array.isArray(categoryJson)) return categoryJson
    try {
      return JSON.parse(categoryJson)
    } catch {
      return [categoryJson]
    }
  }

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    if (!events) return []
    
    return events.filter(event => {
      // Check type filter
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(event.type)
      
      // Check steps filter
      const eventSteps = parseCategories(event.category)
      const stepsMatch = selectedSteps.length === 0 || 
        selectedSteps.some(step => eventSteps.includes(step))
      
      return typeMatch && stepsMatch
    })
  }, [events, selectedTypes, selectedSteps])

  const handleClearAll = () => {
    setSelectedTypes([])
    setSelectedSteps([])
  }

  const hasActiveFilters = selectedTypes.length > 0 || selectedSteps.length > 0

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
      "Les": "bg-blue-100 text-blue-800 border-blue-200",
      "Toernooi": "bg-green-100 text-green-800 border-green-200",
      "Geen Les": "bg-red-100 text-red-800 border-red-200",
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

  const createUrlFriendlyName = (voornaam: string, achternaam: string) => {
    return `${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, "_")
  }

  const parseInstructors = (instructorsJson: string | undefined): string[] => {
    if (!instructorsJson) return []
    try {
      return JSON.parse(instructorsJson)
    } catch {
      return []
    }
  }

  // Sorteer events op datum (dichtstbijzijnde eerst)
  const sortedEvents = filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Group events by month for list view
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
          <div className="text-center">
            <div className="bg-mainAccent/10 p-3 rounded-xl inline-flex mb-3">
              <Users className="h-8 w-8 text-mainAccent" />
            </div>
            <h1 className="text-2xl font-bold text-textColor mb-1">Jeugd Kalender</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Overzicht van alle geplande jeugd activiteiten en evenementen
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        {/* Filters */}
        <div className="mb-4">
          <CalendarFilters
            eventTypes={eventTypes}
            categories={stepsCategories}
            selectedTypes={selectedTypes}
            selectedCategories={selectedSteps}
            onTypesChange={setSelectedTypes}
            onCategoriesChange={setSelectedSteps}
            onClearAll={handleClearAll}
            isYouth={true}
          />
          {/* Results count */}
          {hasActiveFilters && (
            <div className="mt-3 text-sm text-gray-600">
              {filteredEvents.length} van {events?.length || 0} activiteiten getoond
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Stats */}
          <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Jeugd Activiteiten
                </h2>
              </div>
            </div>
          </div>

          {/* Events List */}
          {sortedEvents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-mainAccent/10 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <CalendarIcon className="h-12 w-12 text-mainAccent" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {events?.length === 0 ? "Geen jeugd activiteiten" : "Geen resultaten gevonden"}
              </h3>
              <p className="text-gray-500">
                {events?.length === 0 
                  ? "Er zijn momenteel geen jeugd activiteiten gepland." 
                  : "Probeer andere filters om meer resultaten te zien."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {monthEntries.map(([monthKey, { monthName, events: monthEvents }], index) => (
                <div key={monthKey} className={`bg-white shadow-md overflow-hidden ${index === 0 ? 'rounded-t-lg' : ''} ${index === monthEntries.length - 1 ? 'rounded-b-lg' : ''}`}>
                  {/* Month Header */}
                  <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-3 py-2">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {monthName}
                    </h2>
                    <p className="text-white/80 mt-0.5 text-xs">{monthEvents.length} activiteit{monthEvents.length !== 1 ? 'en' : ''}</p>
                  </div>

                  {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gradient-to-r from-mainAccent/10 to-mainAccentDark/10 border-b-2 border-mainAccent/20">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-textColor" style={{width: '20%'}}>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Datum & Tijd
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-textColor border-r border-mainAccent/10" style={{width: '20%'}}>
                          <div className="flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            Activiteit
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-textColor border-r border-mainAccent/10" style={{width: '16.66%'}}>Categorie</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-textColor border-r border-mainAccent/10" style={{width: '16.67%'}}>Lesgevers</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-textColor border-r border-mainAccent/10" style={{width: '21.67%'}}>Beschrijving</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-textColor" style={{width: '25%'}}>Type</th>
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
                          <td className="px-3 py-3 border-r border-neutral-200">
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
                          <td className="px-3 py-3 border-r border-neutral-200">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-textColor text-xs">{event.title}</span>
                            </div>
                          </td>
                          
                          {/* Categorie */}
                          <td className="px-3 py-3 border-r border-neutral-200">
                            <div className="flex flex-wrap gap-1">
                              {parseCategories(event.category).map((category, idx) => (
                                <span
                                  key={idx}
                                  className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(
                                    category,
                                  )}`}
                                >
                                  {category}
                                </span>
                              ))}
                            </div>
                          </td>
                          
                          {/* Lesgevers */}
                          <td className="px-3 py-3 border-r border-neutral-200">
                            <div className="flex flex-wrap gap-1">
                              {parseInstructors(event.instructors).map((instructor, idx) => {
                                const [voornaam, achternaam] = instructor.split(' ')
                                return (
                                  <Link
                                    key={idx}
                                    href={`/profile/${createUrlFriendlyName(voornaam || '', achternaam || '')}`}
                                    className="px-1.5 py-0.5 bg-mainAccent/10 text-gray-800 rounded-full text-xs font-medium hover:bg-mainAccent/20 hover:text-gray-900 transition-colors"
                                  >
                                    {instructor}
                                  </Link>
                                )
                              })}
                            </div>
                          </td>
                          
                          {/* Beschrijving */}
                          <td className="px-3 py-3 border-r border-neutral-200">
                            {event.description && (
                              <span className="text-gray-600 text-xs">
                                {event.description}
                              </span>
                            )}
                          </td>
                          
                          {/* Type */}
                          <td className="px-3 py-3">
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

                        {/* Categorie en Lesgevers */}
                        <div className="flex flex-col gap-2 mb-2">
                          {/* Categorie */}
                          {parseCategories(event.category).length > 0 && (
                            <div className="flex items-start gap-1 text-gray-600">
                              <span className="text-xs text-gray-500 mt-0.5 flex-shrink-0">Stap:</span>
                              <div className="flex flex-wrap gap-1">
                                {parseCategories(event.category).map((category, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(category)}`}
                                  >
                                    {category}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Lesgevers */}
                          {parseInstructors(event.instructors).length > 0 && (
                            <div className="flex items-start gap-1 text-gray-600">
                              <span className="text-xs text-gray-500 mt-0.5 flex-shrink-0">Lesgevers:</span>
                              <div className="flex flex-wrap gap-1">
                                {parseInstructors(event.instructors).map((instructor, idx) => {
                                  const [voornaam, achternaam] = instructor.split(' ')
                                  return (
                                    <Link
                                      key={idx}
                                      href={`/profile/${createUrlFriendlyName(voornaam || '', achternaam || '')}`}
                                      className="text-gray-700 hover:text-gray-900 transition-colors font-medium"
                                    >
                                      {instructor}
                                    </Link>
                                  )
                                })}
                              </div>
                            </div>
                          )}
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
    </div>
  )
}

export default YouthPlannedActivities

"use client"
import useSWR from "swr"
import { useState, useMemo } from "react"
import type { CalendarEvent } from "../../../data/types"
import { getAll } from "@/app/api"
import CalendarEventForm from "./CalenderEventForm"
import CalendarEventList from "./CalenderEventList"
import { Calendar, Settings, Users, User } from "lucide-react"

const CalendarManagement = () => {
  const [showYouth, setShowYouth] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [showPastEvents, setShowPastEvents] = useState(false)
  const [monthFilter, setMonthFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const apiUrl = showYouth ? "calendar?is_youth=true" : "calendar?is_youth=false"
  const { data: events, error, mutate } = useSWR<CalendarEvent[]>(apiUrl, getAll)

  // Get unique types, months, and years for filter dropdowns
  const uniqueTypes = Array.from(new Set(events?.map(event => event.type) || []))
  
  const uniqueMonths = useMemo(() => {
    // Return all 12 months
    const monthNames = [
      { value: "1", label: "Januari" },
      { value: "2", label: "Februari" },
      { value: "3", label: "Maart" },
      { value: "4", label: "April" },
      { value: "5", label: "Mei" },
      { value: "6", label: "Juni" },
      { value: "7", label: "Juli" },
      { value: "8", label: "Augustus" },
      { value: "9", label: "September" },
      { value: "10", label: "Oktober" },
      { value: "11", label: "November" },
      { value: "12", label: "December" }
    ]
    return monthNames
  }, [])

  const uniqueYears = useMemo(() => {
    if (!events) return []
    const years = new Set<string>()
    events.forEach(event => {
      const date = new Date(event.date)
      years.add(String(date.getFullYear()))
    })
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)) // Most recent first
  }, [events])

  // Auto-enable showPastEvents if a past year is selected
  const currentYear = new Date().getFullYear()
  const shouldShowPastEvents = useMemo(() => {
    if (yearFilter !== "all") {
      const selectedYear = parseInt(yearFilter)
      return selectedYear < currentYear
    }
    return showPastEvents
  }, [yearFilter, showPastEvents, currentYear])

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    if (!events) return []
    
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Reset time to start of day for comparison

    let filtered = events.filter(event => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)
      
      // Filter by past/future - use shouldShowPastEvents instead of showPastEvents
      if (!shouldShowPastEvents && eventDate < now) {
        return false
      }
      
      // Filter by type
      if (typeFilter !== "all" && !event.type.toLowerCase().includes(typeFilter.toLowerCase())) {
        return false
      }
      
      // Filter by month (just the month number, 1-12)
      if (monthFilter !== "all") {
        const eventMonth = eventDate.getMonth() + 1 // getMonth() returns 0-11
        if (String(eventMonth) !== monthFilter) {
          return false
        }
      }
      
      // Filter by year
      if (yearFilter !== "all") {
        if (String(eventDate.getFullYear()) !== yearFilter) {
          return false
        }
      }
      
      return true
    })

    // Sort chronologically: future events first (ascending), then past events (descending)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      
      const aIsFuture = dateA >= now
      const bIsFuture = dateB >= now
      
      if (aIsFuture && bIsFuture) {
        // Both future: ascending order
        return dateA.getTime() - dateB.getTime()
      } else if (!aIsFuture && !bIsFuture) {
        // Both past: descending order
        return dateB.getTime() - dateA.getTime()
      } else {
        // Future before past
        return aIsFuture ? -1 : 1
      }
    })

    return filtered
  }, [events, shouldShowPastEvents, typeFilter, monthFilter, yearFilter])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Fout bij laden van evenementen</h2>
          <p className="text-gray-600">Er is een probleem opgetreden bij het ophalen van de kalendergegevens.</p>
        </div>
      </div>
    )
  }

  if (!events) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mainAccent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Evenementen worden geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-mainAccent/10 p-3 rounded-xl">
              <Settings className="h-8 w-8 text-mainAccent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-textColor">Kalender Beheren</h1>
              <p className="text-gray-600 mt-1">
                {showYouth ? "Jeugd activiteiten" : "Normale activiteiten"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <CalendarEventList 
            events={filteredEvents} 
            mutate={mutate} 
            showYouth={showYouth}
            setShowYouth={setShowYouth}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            uniqueTypes={uniqueTypes}
            showPastEvents={shouldShowPastEvents}
            setShowPastEvents={setShowPastEvents}
            isAutoPastEvents={yearFilter !== "all" && parseInt(yearFilter) < currentYear}
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            yearFilter={yearFilter}
            setYearFilter={setYearFilter}
            uniqueMonths={uniqueMonths}
            uniqueYears={uniqueYears}
            onEditEvent={(event) => {
              setEditingEvent(event)
              setShowForm(true)
            }}
            onAddEvent={() => {
              setEditingEvent(null)
              setShowForm(true)
            }}
          />
        </div>
      </div>

      {/* Modal Forms */}
      {showForm && (
        <CalendarEventForm 
          event={editingEvent}
          mutate={async () => { 
            await mutate()
            setShowForm(false)
            setEditingEvent(null)
          }} 
          onCancel={() => {
            setShowForm(false)
            setEditingEvent(null)
          }} 
        />
      )}
    </div>
  )
}

export default CalendarManagement

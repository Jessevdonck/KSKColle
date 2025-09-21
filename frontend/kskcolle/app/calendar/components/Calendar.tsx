"use client"

import { useState } from "react"
import useSWR from "swr"
import { getAll } from "../../api"
import MonthView from "./MonthView"
import EventDetails from "./EventDetails"
import MonthNavigation from "./MonthNavigation"
import EventCarousel from "./EventCarousel"
import { addMonths, isSameDay } from "date-fns"
import { CalendarIcon, Clock, Archive, Calendar } from "lucide-react"

interface CalendarEvent {
  id: string
  title: string
  description: string
  date: string
  type: string
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showArchive, setShowArchive] = useState(false)

  const { data: events, error, isLoading } = useSWR<CalendarEvent[]>(
    `calendar?show_archive=${showArchive}`, 
    getAll
  )

  const handlePrevMonth = () => setCurrentDate((prevDate) => addMonths(prevDate, -1))
  const handleNextMonth = () => setCurrentDate((prevDate) => addMonths(prevDate, 1))

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mainAccent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Kalender wordt geladen...</p>
        </div>
      </div>
    )
  }

  const filteredEvents =
    events?.filter(
      (event) =>
        new Date(event.date).getMonth() === currentDate.getMonth() &&
        new Date(event.date).getFullYear() === currentDate.getFullYear(),
    ) || []

  const selectedEvents = selectedDate ? events?.filter((event) => isSameDay(new Date(event.date), selectedDate)) : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-mainAccent/10 p-3 rounded-xl">
                <CalendarIcon className="h-8 w-8 text-mainAccent" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-textColor">Kalender 2024 - 2025</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{events?.length || 0} {showArchive ? 'gearchiveerde' : 'geplande'} evenementen</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Archive Toggle */}
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${!showArchive ? 'text-gray-900' : 'text-gray-500'}`}>
                <Calendar className="h-4 w-4 inline mr-1" />
                Huidig
              </span>
              <button
                onClick={() => setShowArchive(!showArchive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mainAccent focus:ring-offset-2 ${
                  showArchive ? 'bg-mainAccent' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full transition-transform bg-white ${
                    showArchive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${showArchive ? 'text-gray-900' : 'text-gray-500'}`}>
                <Archive className="h-4 w-4 inline mr-1" />
                Archief
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <EventCarousel events={events || []} />
          <MonthNavigation currentDate={currentDate} onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth} />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2">
              <MonthView
                year={currentDate.getFullYear()}
                month={currentDate.getMonth()}
                events={filteredEvents}
                onSelectDate={setSelectedDate}
                selectedDate={selectedDate}
              />
            </div>
            <div className="xl:col-span-1">
              <EventDetails date={selectedDate} events={selectedEvents || []} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

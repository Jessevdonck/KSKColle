"use client"
import useSWR from "swr"
import type { CalendarEvent } from "../../../data/types"
import { getAll } from "@/app/api"
import CalendarEventForm from "./CalenderEventForm"
import CalendarEventList from "./CalenderEventList"
import { Calendar, Settings } from "lucide-react"

const CalendarManagement = () => {
  const { data: events, error, mutate } = useSWR<CalendarEvent[]>("calendar", getAll)

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
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{events.length} geplande evenementen</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <CalendarEventForm mutate={mutate} onCancel={() => {}} />
          <CalendarEventList events={events} mutate={mutate} />
        </div>
      </div>
    </div>
  )
}

export default CalendarManagement

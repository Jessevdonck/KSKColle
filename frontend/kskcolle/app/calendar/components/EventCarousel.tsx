"use client"

import { useState, useEffect } from "react"
import { format, isFuture } from "date-fns"
import { nl } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar, Clock, Pen } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CalendarEvent {
  id: string
  title: string
  description: string
  date: string
  type: string
}

interface CarouselProps {
  events: CalendarEvent[]
}

export default function EventCarousel({ events }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visibleEvents, setVisibleEvents] = useState<CalendarEvent[]>([])

  const eventsPerPage = 3

  useEffect(() => {
    const futureEvents = events
      .filter((event) => isFuture(new Date(event.date)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    setVisibleEvents(futureEvents)
  }, [events])

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0))
  }

  const handleNext = () => {
    setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, Math.max(visibleEvents.length - eventsPerPage, 0)))
  }

  const getEventTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "interclub":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "toernooi":
        return "bg-green-100 text-green-800 border-green-200"
      case "oost-vlaamse interclub":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "vergadering":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeDisplayLabel = (type: string) => {
    const normalizedType = type.toLowerCase().trim()
    if (normalizedType === "oost-vlaamse interclub" || normalizedType.includes("oost-vlaamse interclub")) {
      return "OVIC"
    }
    return type
  }

  if (visibleEvents.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Aankomende Evenementen
          </h2>
        </div>
        <div className="p-12 text-center">
          <div className="bg-mainAccent/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-10 w-10 text-mainAccent" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Geen aankomende evenementen</h3>
          <p className="text-gray-600">Er zijn momenteel geen geplande evenementen.</p>
        </div>
      </div>
    )
  }

  const displayedEvents = visibleEvents.slice(currentIndex, currentIndex + eventsPerPage)

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Aankomende Evenementen
          </h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="text-white hover:bg-white/20"
              aria-label="Vorige evenementen"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex >= visibleEvents.length - eventsPerPage}
              className="text-white hover:bg-white/20"
              aria-label="Volgende evenementen"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-white/80 mt-1">{visibleEvents.length} geplande evenementen</p>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Datum</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Activiteit</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Beschrijving</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Type</th>
              </tr>
            </thead>
            <tbody>
              {displayedEvents.map((event, index) => (
                <tr
                  key={`${event.id}-${index}`}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-25"
                  }`}
                >
                  {/* Datum */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-mainAccent" />
                      <span className="text-sm font-medium text-gray-700">
                        {format(new Date(event.date), "d MMMM yyyy", { locale: nl })}
                      </span>
                    </div>
                  </td>

                  {/* Activiteit */}
                  <td className="py-3 px-4">
                    <span className="font-semibold text-textColor">{event.title}</span>
                  </td>

                  {/* Beschrijving */}
                  <td className="py-3 px-4">
                    {event.description ? (
                      <div className="flex items-start gap-2">
                        <Pen className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Geen beschrijving</span>
                    )}
                  </td>

                  {/* Type */}
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(
                        event.type,
                      )}`}
                    >
                      {getTypeDisplayLabel(event.type)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination indicators */}
        {visibleEvents.length > eventsPerPage && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: Math.ceil(visibleEvents.length / eventsPerPage) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * eventsPerPage)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  Math.floor(currentIndex / eventsPerPage) === index ? "bg-mainAccent" : "bg-gray-300"
                }`}
                aria-label={`Ga naar pagina ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

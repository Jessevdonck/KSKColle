"use client"

import { useState, useEffect } from "react"
import { format, isFuture } from "date-fns"
import { nl } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedEvents.map((event, index) => (
            <div
              key={`${event.id}-${index}`}
              className="border border-neutral-200 rounded-lg p-4 hover:border-mainAccent/30 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-textColor line-clamp-2">{event.title}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ml-2 ${getEventTypeColor(
                    event.type,
                  )}`}
                >
                  {event.type}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-mainAccent" />
                  <span>{format(new Date(event.date), "d MMMM yyyy", { locale: nl })}</span>
                </div>

                {event.description && <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>}
              </div>
            </div>
          ))}
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

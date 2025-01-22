"use client"

import React, { useState, useEffect } from "react"
import { format, isFuture } from "date-fns"
import { nl } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
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

  const eventsPerPage = 5

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

  if (visibleEvents.length === 0) {
    return <div className="text-center p-4">Geen aankomende evenementen</div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          aria-label="Vorige evenementen"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-grow overflow-hidden">
        <div className="flex flex-wrap">
      {visibleEvents.map((event, index) => (
        <div key={`${event.id}-${index}`} className="flex-shrink-0 w-1/5 px-2">
          <div className="text-center p-2 bg-gray-50 rounded-lg h-full flex flex-col justify-between">
            <h3 className="text-lg font-semibold text-[#4A4947] truncate mb-2">{event.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{format(new Date(event.date), "d MMMM yyyy", { locale: nl })}</p>
            <p className="text-xs text-gray-500 truncate">{event.description}</p>
          </div>
        </div>
      ))}
    </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentIndex >= visibleEvents.length - eventsPerPage}
          aria-label="Volgende evenementen"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}


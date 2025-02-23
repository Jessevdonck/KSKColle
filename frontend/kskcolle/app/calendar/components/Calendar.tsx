"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { getAll } from "../../api"
import MonthView from "./MonthView"
import EventDetails from "./EventDetails"
import MonthNavigation from "./MonthNavigation"
import EventCarousel from "./EventCarousel"
import { addMonths, isSameDay } from "date-fns"

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

  const { data: events, error, isLoading } = useSWR<CalendarEvent[]>("calendar", getAll)

  const handlePrevMonth = () => setCurrentDate((prevDate) => addMonths(prevDate, -1))
  const handleNextMonth = () => setCurrentDate((prevDate) => addMonths(prevDate, 1))

  if (error) return <div>Failed to load events</div>
  if (isLoading) return <div>Loading...</div>

  const filteredEvents =
    events?.filter(
      (event) =>
        new Date(event.date).getMonth() === currentDate.getMonth() &&
        new Date(event.date).getFullYear() === currentDate.getFullYear(),
    ) || []

  const selectedEvents = selectedDate ? events?.filter((event) => isSameDay(new Date(event.date), selectedDate)) : []

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#4A4947] mb-6">Kalender 2024 - 2025</h1>
      <EventCarousel events={events || []} />
      <MonthNavigation currentDate={currentDate} onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth} />
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-grow">
          <MonthView
            year={currentDate.getFullYear()}
            month={currentDate.getMonth()}
            events={filteredEvents}
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
          />
        </div>
        <div className="md:w-1/3">
          <EventDetails date={selectedDate} events={selectedEvents || []} />
        </div>
      </div>
    </div>
  )
}


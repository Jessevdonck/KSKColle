'use client'

import React, { useState } from 'react'
import { CalendarEvent } from '../../../data/mock_data'
import MonthView from './MonthView'
import EventDetails from './EventDetails'
import MonthNavigation from './MonthNavigation'
import EventCarousel from './EventCarousel'
import { addMonths, isSameDay } from 'date-fns'

interface CalendarProps {
  events: CalendarEvent[]
}

export default function Calendar({ events }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(new Date().getFullYear(), 8, 1)) 
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const handlePrevMonth = () => setCurrentDate(prevDate => addMonths(prevDate, -1))
  const handleNextMonth = () => setCurrentDate(prevDate => addMonths(prevDate, 1))

  const filteredEvents = events.filter(event => 
    event.date.getMonth() === currentDate.getMonth() &&
    event.date.getFullYear() === currentDate.getFullYear()
  )

  const selectedEvents = selectedDate
    ? events.filter(event => isSameDay(event.date, selectedDate))
    : []

  console.log('Total events:', events.length)
  console.log('First event:', events[0])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#4A4947] mb-6">Kalender 2024 - 2025</h1>
      <EventCarousel events={events} />
      <MonthNavigation 
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />
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
          <EventDetails 
            date={selectedDate}
            events={selectedEvents}
          />
        </div>
      </div>
    </div>
  )
}
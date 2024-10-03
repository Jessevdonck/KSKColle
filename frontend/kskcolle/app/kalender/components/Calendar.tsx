'use client'

import React, { useState } from 'react'
import { CalendarEvent } from '../../../data/mock_data'
import MonthView from './MonthView'
import EventList from './EventList'
import YearNavigation from './YearNavigation'

interface CalendarProps {
  events: CalendarEvent[]
}

export default function Calendar({ events }: CalendarProps) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  const filteredEvents = events.filter(event => event.date.getFullYear() === currentYear)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#4A4947] mb-6">KSK Colle Jaarkalender</h1>
      <YearNavigation currentYear={currentYear} onYearChange={setCurrentYear} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 12 }, (_, i) => (
              <MonthView
                key={i}
                year={currentYear}
                month={i}
                events={filteredEvents.filter(event => event.date.getMonth() === i)}
              />
            ))}
          </div>
        </div>
        <div>
          <EventList events={filteredEvents} />
        </div>
      </div>
    </div>
  )
}
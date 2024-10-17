import React from 'react'
import { CalendarEvent } from '../../../data/mock_data'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns'
import { nl } from 'date-fns/locale'

interface MonthViewProps {
  year: number
  month: number
  events: CalendarEvent[]
  onSelectDate: (date: Date) => void
  selectedDate: Date | null
}

export default function MonthView({ year, month, events, onSelectDate, selectedDate }: MonthViewProps) {

  const monthStart = startOfMonth(new Date(year, month))
  const monthEnd = endOfMonth(monthStart)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-2xl font-semibold mb-4 text-[#4A4947]">{format(monthStart, 'MMMM yyyy', { locale: nl })}</h2>
      <div className="grid grid-cols-7 gap-2">
        {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-[#4A4947]">
            {day}
          </div>
        ))}
        {days.map(day => {
          const dayEvents = events.filter(event => isSameDay(event.date, day))
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          return (
            <button
              key={day.toString()}
              onClick={() => onSelectDate(day)}
              className={`
                text-center p-2 rounded-full transition-colors relative
                ${!isSameMonth(day, monthStart) ? 'text-gray-300' : 'text-[#4A4947]'}
                ${isSelected ? 'ring-2 ring-emerald-800' : ''}
                hover:bg-gray-100
              `}
            >
              <span className="inline-block mb-3">{format(day, 'd')}</span>
              {dayEvents.length > 0 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-emerald-800 rounded-full"></div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
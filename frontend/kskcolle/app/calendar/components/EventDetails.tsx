import React from 'react'
import { CalendarEvent } from '../../../data/mock_data'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

interface EventDetailsProps {
  date: Date | null
  events: CalendarEvent[]
}

export default function EventDetails({ date, events }: EventDetailsProps) {
  if (!date) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4 text-[#4A4947]">Evenementen</h2>
        <p className="text-gray-500">Selecteer een datum om evenementen te zien.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4 text-[#4A4947]">
        Evenementen op {format(date, 'd MMMM yyyy', { locale: nl })}
      </h2>
      {events.length === 0 ? (
        <p className="text-gray-500">Geen evenementen op deze datum.</p>
      ) : (
        <ul className="space-y-4">
          {events.map(event => (
            <li key={event.id} className="border-b pb-2">
              <h3 className="font-medium text-[#4A4947]">{event.title}</h3>
              <p className="text-sm text-gray-600">{event.description}</p>
              <span className={`text-xs font-semibold ${getEventTypeColor(event.type)}`}>
                {event.type}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function getEventTypeColor(type: CalendarEvent['type']) {
  switch (type) {
    case 'tournament':
      return 'text-mainAccent'
    case 'training':
      return 'text-green-600'
    case 'meeting':
      return 'text-yellow-600'
    default:
      return 'text-blue-600'
  }
}
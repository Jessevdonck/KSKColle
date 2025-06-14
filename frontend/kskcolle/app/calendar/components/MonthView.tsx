"use client"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import { nl } from "date-fns/locale"
import { Calendar } from "lucide-react"

interface CalendarEvent {
  id: string
  title: string
  description: string
  date: string
  type: string
}

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
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "interclub":
        return "bg-blue-500"
      case "toernooi":
        return "bg-green-500"
      case "oost-vlaamse interclub":
        return "bg-purple-500"
      case "vergadering":
        return "bg-orange-500"
      default:
        return "bg-mainAccent"
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          {format(monthStart, "MMMM yyyy", { locale: nl })}
        </h2>
        <p className="text-white/80 mt-1">{events.length} evenementen deze maand</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayEvents = events.filter((event) => isSameDay(new Date(event.date), day))
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isCurrentMonth = isSameMonth(day, monthStart)
            const isToday = isSameDay(day, new Date())

            return (
              <button
                key={day.toString()}
                onClick={() => onSelectDate(day)}
                className={`
                  relative p-2 rounded-lg transition-all duration-200 min-h-[100px] flex flex-col items-start
                  ${!isCurrentMonth ? "text-gray-300 bg-gray-50" : "text-textColor hover:bg-mainAccent/5"}
                  ${isSelected ? "ring-2 ring-mainAccent bg-mainAccent/10" : ""}
                  ${isToday && !isSelected ? "bg-blue-50 ring-1 ring-blue-200" : ""}
                  ${dayEvents.length > 0 ? "hover:shadow-md" : ""}
                `}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-sm font-medium ${isToday ? "text-blue-600 font-bold" : ""}`}>
                    {format(day, "d")}
                  </span>
                  {dayEvents.length > 0 && <div className="w-2 h-2 bg-mainAccent rounded-full"></div>}
                </div>

                {dayEvents.length > 0 && (
                  <div className="w-full space-y-1">
                    {dayEvents.slice(0, 2).map((event, index) => (
                      <div
                        key={index}
                        className={`text-xs px-2 py-1 rounded text-white truncate ${getEventTypeColor(event.type)}`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 px-2">+{dayEvents.length - 2} meer</div>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

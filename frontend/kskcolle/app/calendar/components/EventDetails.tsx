import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Calendar, FileText, Clock, Pen } from "lucide-react"

interface CalendarEvent {
  id: string
  title: string
  description: string
  date: string
  type: string
}

interface EventDetailsProps {
  date: Date | null
  events: CalendarEvent[]
}

export default function EventDetails({ date, events }: EventDetailsProps) {
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

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-8">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Evenement Details
        </h2>
      </div>

      <div className="p-6">
        {!date ? (
          <div className="text-center py-12">
            <div className="bg-mainAccent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-mainAccent" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Selecteer een datum</h3>
            <p className="text-gray-500">Klik op een datum in de kalender om evenementen te bekijken.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-mainAccent" />
                <h3 className="text-lg font-semibold text-textColor">{format(date, "d MMMM yyyy", { locale: nl })}</h3>
              </div>
              <p className="text-sm text-gray-600">
                {events.length === 0
                  ? "Geen evenementen"
                  : events.length === 1
                    ? "1 evenement"
                    : `${events.length} evenementen`}
              </p>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-700 mb-2">Geen evenementen</h4>
                <p className="text-gray-500">Er zijn geen evenementen gepland op deze datum.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="border border-neutral-200 rounded-lg p-4 hover:border-mainAccent/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-textColor flex-1">{event.title}</h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ml-2 ${getEventTypeColor(
                          event.type,
                        )}`}
                      >
                        {event.type}
                      </span>
                    </div>

                    {event.description && (
                      <div className="flex items-start gap-2 mb-3">
                        <Pen className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{event.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

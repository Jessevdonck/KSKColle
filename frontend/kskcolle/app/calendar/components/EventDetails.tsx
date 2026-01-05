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

  const getTypeDisplayLabel = (type: string) => {
    const normalizedType = type.toLowerCase().trim()
    if (normalizedType === "oost-vlaamse interclub" || normalizedType.includes("oost-vlaamse interclub")) {
      return "OVIC"
    }
    return type
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
                    {events.map((event, index) => (
                      <tr
                        key={event.id}
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
                              <p className="text-sm text-gray-600">{event.description}</p>
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
            )}
          </>
        )}
      </div>
    </div>
  )
}

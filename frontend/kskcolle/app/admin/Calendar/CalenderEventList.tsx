"use client"

import type React from "react"
import { useState } from "react"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Pencil, Trash2, Calendar, FileText, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CalendarEvent } from "../../../data/types"
import { deleteById } from "@/app/api"
import CalendarEventForm from "./CalenderEventForm"

interface CalendarEventListProps {
  events: CalendarEvent[]
  mutate: (data?: CalendarEvent[] | Promise<CalendarEvent[]> | undefined, shouldRevalidate?: boolean) => Promise<CalendarEvent[] | undefined>
}

const CalendarEventList: React.FC<CalendarEventListProps> = ({ events, mutate }) => {
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("Weet je zeker dat je dit evenement wilt verwijderen?")) {
      // Optimistische update: direct uit lijst
      const previous = events
      const updated = events.filter((e) => e.event_id !== id)
      await mutate(updated, false)

      try {
        await deleteById("calendar", { arg: id.toString() })
        // geen extra mutate(), blijft verwijderd
      } catch (error) {
        console.error("Error deleting event:", error)
        // rollback
        await mutate(previous, false)
      }
    }
  }

  const handleCancel = () => {
    setEditingEvent(null)
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

  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Evenementen Overzicht
          </h2>
        </div>
        <div className="p-12 text-center">
          <div className="bg-mainAccent/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-10 w-10 text-mainAccent" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Geen evenementen gevonden</h3>
          <p className="text-gray-600">Voeg een nieuw evenement toe om te beginnen.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {editingEvent && (
        <CalendarEventForm
          event={editingEvent}
          mutate={async () => { await mutate(); setEditingEvent(null) }}
          onCancel={handleCancel}
        />
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Evenementen Overzicht
          </h2>
          <p className="text-white/80 mt-1">{events.length} evenementen gepland</p>
        </div>

        <div className="p-6">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-mainAccent/10 to-mainAccentDark/10 border-b border-neutral-200">
                  <th className="p-4 text-left font-semibold text-textColor">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Titel
                    </div>
                  </th>
                  <th className="p-4 text-left font-semibold text-textColor">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Datum
                    </div>
                  </th>
                  <th className="p-4 text-left font-semibold text-textColor">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Type
                    </div>
                  </th>
                  <th className="p-4 text-center font-semibold text-textColor">Acties</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr
                    key={event.event_id}
                    className={`border-b border-neutral-100 transition-all hover:bg-mainAccent/5 ${
                      index % 2 === 0 ? "bg-white" : "bg-neutral-50/50"
                    }`}
                  >
                    <td className="p-4">
                      <div className="font-medium text-textColor">{event.title}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-mainAccent" />
                        <span className="text-gray-700">
                          {format(new Date(event.date), "dd-MM-yyyy", { locale: nl })}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getEventTypeColor(
                          event.type
                        )}`}>
                        {event.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(event)}
                          className="hover:bg-mainAccent/10 hover:text-mainAccent"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(event.event_id)}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {events.map((event) => (
              <div
                key={event.event_id}
                className="border border-neutral-200 rounded-lg p-4 hover:border-mainAccent/30 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-textColor mb-1">{event.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{event.description || "Geen beschrijving"}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(event.date), "dd-MM-yyyy", { locale: nl })}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(
                      event.type
                    )}`}
                  >
                    {event.type}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(event)}
                    className="flex-1 bg-mainAccent hover:bg-mainAccentDark"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Bewerken
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(event.event_id)}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarEventList

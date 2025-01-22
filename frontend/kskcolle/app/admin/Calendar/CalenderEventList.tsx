"use client"

import type React from "react"
import { useState } from "react"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CalendarEvent } from "../../../data/types"
import { deleteById } from "@/app/api"
import CalendarEventForm from "./CalenderEventForm"

interface CalendarEventListProps {
  events: CalendarEvent[]
  mutate: () => void
}

const CalendarEventList: React.FC<CalendarEventListProps> = ({ events, mutate }) => {
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("Weet je zeker dat je dit evenement wilt verwijderen?")) {
      try {
        await deleteById("calendar", { arg: id.toString() })
        mutate()
      } catch (error) {
        console.error("Error deleting event:", error)
      }
    }
  }

  const handleCancel = () => {
    setEditingEvent(null)
  }

  return (
    <div>
      {editingEvent && (
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Evenement bewerken</h3>
          <CalendarEventForm
            event={editingEvent}
            mutate={() => {
              mutate()
              setEditingEvent(null)
            }}
            onCancel={handleCancel}
          />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titel</TableHead>
            <TableHead>Beschrijving</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.event_id}>
              <TableCell>{event.title}</TableCell>
              <TableCell>{event.description}</TableCell>
              <TableCell>{format(new Date(event.date), "dd-MM-yyyy", { locale: nl })}</TableCell>
              <TableCell>{event.type}</TableCell>
              <TableCell>
                <Button variant="ghost" onClick={() => handleEdit(event)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => handleDelete(event.event_id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default CalendarEventList


"use client"

import React from "react"
import useSWR from "swr"
import type { CalendarEvent } from "../../../data/types"
import { getAll } from "@/app/api"
import CalendarEventForm from "./CalenderEventForm"
import CalendarEventList from "./CalenderEventList"

const CalendarManagement = () => {
  const { data: events, error, mutate } = useSWR<CalendarEvent[]>("calendar", getAll)

  if (error) return <div>Er is een fout opgetreden bij het laden van de evenementen.</div>
  if (!events) return <div>Evenementen laden...</div>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Kalender Beheer</h2>
      <CalendarEventForm mutate={mutate} onCancel={() => {}} />
      <CalendarEventList events={events} mutate={mutate} />
    </div>
  )
}

export default CalendarManagement


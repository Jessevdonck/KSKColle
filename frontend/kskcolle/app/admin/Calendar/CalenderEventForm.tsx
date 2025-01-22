"use client"

import type React from "react"
import { useForm, Controller } from "react-hook-form"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { CalendarEvent } from "../../../data/types"
import { save } from "@/app/api"

interface CalendarEventFormProps {
  event?: CalendarEvent
  mutate: () => void
  onCancel: () => void
}

const CalendarEventForm: React.FC<CalendarEventFormProps> = ({ event, mutate, onCancel }) => {
  const form = useForm<CalendarEvent>({
    defaultValues: event
      ? { ...event, date: new Date(event.date).toISOString() }
      : {
          title: "",
          description: "",
          date: new Date().toISOString(),
          type: "Activiteit",
        },
  })

  const onSubmit = async (data: CalendarEvent) => {
    try {
      const payload = {
        id: event ? event.event_id : undefined,
        title: data.title,
        description: data.description,
        date: data.date,
        type: data.type,
      }
      console.log(payload)
      await save("calendar", { arg: payload })
      mutate()
      form.reset()
      onCancel()
    } catch (error) {
      console.error("Error saving event:", error)
    }
  }

  const handleCancel = () => {
    form.reset()
    onCancel()
  }

  const commonEventTypes = ["Interclub", "Toernooi", "Oost-Vlaamse Interclub", "Vergadering"]

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-8">
      <div>
        <Label htmlFor="title">Titel</Label>
        <Input id="title" {...form.register("title", { required: "Titel is vereist." })} />
        
      </div>
      <div>
        <Label htmlFor="description">Beschrijving</Label>
        <Input id="description" {...form.register("description")} />
      </div>
      <div>
        <Label htmlFor="date">Datum</Label>
        <Controller
          name="date"
          control={form.control}
          rules={{ required: true }}
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(new Date(field.value), "PPP", { locale: nl }) : <span>Kies een datum</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => field.onChange(date?.toISOString())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        />
      </div>
      <div>
        <Label htmlFor="type">Type</Label>
        <Input id="type" {...form.register("type", { required: true })} />
        <div className="flex flex-wrap gap-2 mt-2">
          {commonEventTypes.map((type) => (
            <Button key={type} type="button" variant="outline" size="sm" onClick={() => form.setValue("type", type)}>
              {type}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex justify-between">
        <Button type="submit" className="bg-mainAccent text-white">
          {event ? "Bijwerken" : "Toevoegen"}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          Annuleren
        </Button>
      </div>
    </form>
  )
}

export default CalendarEventForm


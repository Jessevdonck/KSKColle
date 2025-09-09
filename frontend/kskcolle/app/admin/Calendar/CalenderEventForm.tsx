"use client"

import type React from "react"
import { useForm, Controller } from "react-hook-form"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { CalendarIcon, X, Plus, CalendarIcon as CalendarIconLucide, Type, FileText, Clock, Users, Tag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { CalendarEvent } from "../../../data/types"
import { save } from "@/app/api"
import InstructorAutocomplete from "./InstructorAutocomplete"
import StepMultiSelect from "./StepMultiSelect"

interface CalendarEventFormProps {
  event?: CalendarEvent
  mutate: () => void
  onCancel: () => void
}

const CalendarEventForm: React.FC<CalendarEventFormProps> = ({ event, mutate, onCancel }) => {
  const form = useForm<CalendarEvent>({
    defaultValues: event
      ? { 
          ...event, 
          date: new Date(event.date).toISOString(),
          category: event.category 
            ? (typeof event.category === 'string' 
                ? JSON.parse(event.category || "[]") 
                : event.category)
            : []
        }
      : {
          title: "",
          description: "",
          date: new Date().toISOString(),
          startuur: "20:00",
          type: "Activiteit",
          is_youth: false,
          category: [],
          instructors: "",
        },
  })

  const onSubmit = async (data: CalendarEvent) => {
    try {
      const payload = {
        id: event ? event.event_id : undefined,
        title: data.title,
        description: data.description,
        date: data.date,
        startuur: data.startuur,
        type: data.type,
        is_youth: data.is_youth || false,
        category: Array.isArray(data.category) ? JSON.stringify(data.category) : (data.category || ""),
        instructors: data.instructors || "",
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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Plus className="h-6 w-6" />
          {event ? "Evenement Bewerken" : "Nieuw Evenement Toevoegen"}
        </h2>
      </div>

      <div className="p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Event Details */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Evenement Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Titel
                </Label>
                <Input
                  id="title"
                  {...form.register("title", { required: "Titel is vereist." })}
                  className="mt-1"
                  placeholder="Voer evenement titel in..."
                />
                {form.formState.errors.title && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Beschrijving
                </Label>
                <Input
                  id="description"
                  {...form.register("description")}
                  className="mt-1"
                  placeholder="Voer beschrijving in..."
                />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
              <CalendarIconLucide className="h-5 w-5" />
              Datum & Tijd
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Datum
                </Label>
                <Controller
                  name="date"
                  control={form.control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={`w-full justify-start text-left font-normal mt-1 ${
                            !field.value && "text-muted-foreground"
                          }`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(new Date(field.value), "PPP", { locale: nl })
                          ) : (
                            <span>Kies een datum</span>
                          )}
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
                <Label htmlFor="startuur" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Startuur
                </Label>
                <Input
                  id="startuur"
                  type="time"
                  {...form.register("startuur", { 
                    required: "Startuur is vereist.",
                    pattern: {
                      value: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                      message: "Voer een geldig tijdstip in (HH:MM)"
                    }
                  })}
                  className="mt-1"
                  defaultValue="20:00"
                />
                {form.formState.errors.startuur && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.startuur.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Event Type */}
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-6 border border-amber-200">
            <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
              <Type className="h-5 w-5" />
              Evenement Type
            </h3>
            <div>
              <Label htmlFor="type" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Type className="h-4 w-4" />
                Type
              </Label>
              <Input
                id="type"
                {...form.register("type", { required: true })}
                className="mt-1"
                placeholder="Voer evenement type in..."
              />
              <div className="flex flex-wrap gap-2 mt-3">
                <p className="text-sm text-amber-700 w-full mb-2">Veelgebruikte types:</p>
                {commonEventTypes.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue("type", type)}
                    className="border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Jeugd & Categorieën */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Jeugd & Categorieën
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_youth"
                  {...form.register("is_youth")}
                  className="h-4 w-4 text-mainAccent focus:ring-mainAccent border-gray-300 rounded"
                />
                <Label htmlFor="is_youth" className="text-sm font-medium text-gray-700">
                  Dit is een jeugd activiteit
                </Label>
              </div>
              
              {form.watch("is_youth") && (
                <>
                  <div>
                    <StepMultiSelect
                      value={Array.isArray(form.watch("category")) ? form.watch("category") as string[] : []}
                      onChange={(categories) => form.setValue("category", categories)}
                      label="Jeugd Stappen"
                    />
                  </div>
                  
                  <div>
                    <InstructorAutocomplete
                      value={form.watch("instructors") ? JSON.parse(form.watch("instructors") || "[]") : []}
                      onChange={(instructors) => form.setValue("instructors", JSON.stringify(instructors))}
                      label="Lesgevers"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button type="submit" className="bg-mainAccent hover:bg-mainAccentDark text-white px-6">
              <div className="flex items-center gap-2">
                {event ? <FileText className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {event ? "Bijwerken" : "Toevoegen"}
              </div>
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} className="px-6">
              <X className="mr-2 h-4 w-4" />
              Annuleren
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CalendarEventForm

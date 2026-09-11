"use client"

import type React from "react"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Pencil, Trash2, Calendar, FileText, Tag, User, Users, Clock, Info, BookOpen, Plus, Filter, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CalendarEvent } from "../../../data/types"
import { deleteById } from "@/app/api"
import { KeyedMutator } from "swr"

interface CalendarEventListProps {
  events: CalendarEvent[]
  mutate: KeyedMutator<CalendarEvent[]>;
  showYouth: boolean;
  setShowYouth: (showYouth: boolean) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  uniqueTypes: string[];
  showPastEvents: boolean;
  setShowPastEvents: (show: boolean) => void;
  monthFilter: string;
  setMonthFilter: (month: string) => void;
  yearFilter: string;
  setYearFilter: (year: string) => void;
  uniqueMonths: { value: string; label: string }[];
  uniqueYears: string[];
  isAutoPastEvents: boolean;
  onEditEvent: (event: CalendarEvent) => void;
  onAddEvent: () => void;
}

const CalendarEventList: React.FC<CalendarEventListProps> = ({ 
  events, 
  mutate, 
  showYouth, 
  setShowYouth, 
  typeFilter, 
  setTypeFilter, 
  uniqueTypes,
  showPastEvents,
  setShowPastEvents,
  monthFilter,
  setMonthFilter,
  yearFilter,
  setYearFilter,
  uniqueMonths,
  uniqueYears,
  isAutoPastEvents,
  onEditEvent, 
  onAddEvent 
}) => {

  const handleEdit = (event: CalendarEvent) => {
    onEditEvent(event)
  }

 const handleDelete = async (id: number) => {
  if (!window.confirm("Weet je zeker dat je dit evenement wilt verwijderen?")) return;

  await mutate(async (current) => {
    const previous = current ?? [];
    const optimistic = previous.filter(e => e.event_id !== id);

    try {
      // Zorg dat je hier een number doorgeeft, geen string
      await deleteById("calendar", { arg: id }); 
      return optimistic;         // blijvend verwijderen in cache
    } catch (e) {
      console.error("Error deleting event:", e);
      return previous;           // rollback
    }
  }, false); // geen extra revalidate
};



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

  // Gedeelde header (kleurenbalk + neutrale toolbar) voor zowel de lege als gevulde lijst,
  // zodat beide varianten niet los van elkaar konden verwateren.
  const header = (subtitle: string) => (
    <>
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            Evenementen Overzicht
          </h2>
          <p className="text-white/80 text-xs mt-0.5">{subtitle}</p>
        </div>
        <Button
          onClick={onAddEvent}
          size="sm"
          className="bg-white text-mainAccent hover:bg-white/90 transition-colors flex-shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nieuw Evenement
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-neutral-50 border-b border-neutral-200">
        {/* Toon afgelopen toggle */}
        <button
          type="button"
          onClick={() => !isAutoPastEvents && setShowPastEvents(!showPastEvents)}
          disabled={isAutoPastEvents}
          title={isAutoPastEvents ? 'Automatisch ingeschakeld omdat een verleden jaar is geselecteerd' : ''}
          className={`flex items-center gap-2 text-sm text-gray-700 ${isAutoPastEvents ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <span className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${showPastEvents ? 'bg-mainAccent' : 'bg-gray-300'}`}>
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${showPastEvents ? 'translate-x-5' : 'translate-x-1'}`} />
          </span>
          <History className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
          Toon afgelopen
          {isAutoPastEvents && <span className="text-xs text-gray-400 italic">(auto)</span>}
        </button>

        <div className="h-5 w-px bg-neutral-300" />

        {/* Normaal/Jeugd segmented toggle */}
        <div className="inline-flex items-center rounded-full bg-neutral-200 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setShowYouth(false)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors ${!showYouth ? 'bg-white text-mainAccent shadow-sm' : 'text-gray-500'}`}
          >
            <User className="h-3.5 w-3.5" />
            Normaal
          </button>
          <button
            type="button"
            onClick={() => setShowYouth(true)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors ${showYouth ? 'bg-white text-mainAccent shadow-sm' : 'text-gray-500'}`}
          >
            <Users className="h-3.5 w-3.5" />
            Jeugd
          </button>
        </div>

        <div className="flex-1 min-w-0" />

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-36 text-xs bg-white">
              <SelectValue placeholder="Filter op type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle types</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {getTypeDisplayLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="h-8 w-36 text-xs bg-white">
              <SelectValue placeholder="Filter op maand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle maanden</SelectItem>
              {uniqueMonths.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="h-8 w-28 text-xs bg-white">
              <SelectValue placeholder="Filter op jaar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle jaren</SelectItem>
              {uniqueYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  )

  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {header("Geen evenementen gevonden")}
        <div className="p-4 text-center">
          <div className="bg-mainAccent/10 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
            <Calendar className="h-5 w-5 text-mainAccent" />
          </div>
          <h3 className="text-base font-bold text-gray-700 mb-1">Geen evenementen gevonden</h3>
          <p className="text-gray-600 text-sm">Voeg een nieuw evenement toe om te beginnen.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {header(
          `${events.length} ${events.length === 1 ? 'evenement' : 'evenementen'} ${showPastEvents ? '(inclusief afgelopen)' : '(toekomstig)'}`
        )}

        <div className="p-2.5">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-mainAccent/10 to-mainAccentDark/10 border-b border-neutral-200">
                  <th className="p-2 text-left text-sm font-semibold text-textColor">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Titel
                    </div>
                  </th>
                  <th className="p-2 text-left text-sm font-semibold text-textColor">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Datum & Tijd
                    </div>
                  </th>
                  <th className="p-2 text-left text-sm font-semibold text-textColor">
                    <div className="flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" />
                      Beschrijving
                    </div>
                  </th>
                  {showYouth ? (
                    <>
                      <th className="p-2 text-left text-sm font-semibold text-textColor">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5" />
                          Categorie
                        </div>
                      </th>
                      <th className="p-2 text-left text-sm font-semibold text-textColor">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          Lesgevers
                        </div>
                      </th>
                    </>
                  ) : (
                    <th className="p-2 text-left text-sm font-semibold text-textColor">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        Begeleider
                      </div>
                    </th>
                  )}
                  <th className="p-2 text-left text-sm font-semibold text-textColor">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      Type
                    </div>
                  </th>
                  <th className="p-2 text-center text-sm font-semibold text-textColor">Acties</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => {
                  const eventDate = new Date(event.date)
                  const now = new Date()
                  now.setHours(0, 0, 0, 0)
                  eventDate.setHours(0, 0, 0, 0)
                  const isPast = eventDate < now
                  
                  return (
                  <tr
                    key={event.event_id}
                    className={`border-b border-neutral-100 transition-all hover:bg-mainAccent/5 ${
                      index % 2 === 0 ? "bg-white" : "bg-neutral-50/50"
                    } ${isPast ? "opacity-60" : ""}`}
                  >
                    <td className="p-2">
                      <div className="text-sm font-medium text-textColor flex items-center gap-1.5">
                        {event.title}
                        {isPast && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                            Afgelopen
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-mainAccent" />
                        <div>
                          <div className="text-sm text-gray-700">
                            {format(new Date(event.date), "dd-MM-yyyy", { locale: nl })}
                          </div>
                          {event.startuur && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {event.startuur}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-gray-600 text-xs max-w-xs">
                        {event.description}
                      </div>
                    </td>
                    {showYouth ? (
                      <>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              try {
                                const categories = event.category
                                  ? (typeof event.category === 'string' ? JSON.parse(event.category) : event.category)
                                  : [];
                                return categories.map((cat: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full"
                                  >
                                    {cat}
                                  </span>
                                ));
                              } catch (error) {
                                return null;
                              }
                            })()}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              try {
                                const instructors = event.instructors ? JSON.parse(event.instructors) : [];
                                return instructors.map((instructor: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                                  >
                                    {instructor}
                                  </span>
                                ));
                              } catch (error) {
                                return null;
                              }
                            })()}
                          </div>
                        </td>
                      </>
                    ) : (
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            try {
                              const begeleiders = event.begeleider ? JSON.parse(event.begeleider) : [];
                              return begeleiders.map((begeleider: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full"
                                >
                                  {begeleider}
                                </span>
                              ));
                            } catch (error) {
                              return null;
                            }
                          })()}
                        </div>
                      </td>
                    )}
                    <td className="p-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getEventTypeColor(
                          event.type
                        )}`}>
                        {getTypeDisplayLabel(event.type)}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(event)}
                          className="h-7 w-7 p-0 hover:bg-mainAccent/10 hover:text-mainAccent"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(event.event_id)}
                          className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-2.5">
            {events.map((event) => {
              const eventDate = new Date(event.date)
              const now = new Date()
              now.setHours(0, 0, 0, 0)
              eventDate.setHours(0, 0, 0, 0)
              const isPast = eventDate < now

              return (
              <div
                key={event.event_id}
                className={`border border-neutral-200 rounded-lg p-3 hover:border-mainAccent/30 hover:shadow-md transition-all duration-200 ${isPast ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <h3 className="text-sm font-semibold text-textColor">{event.title}</h3>
                      {isPast && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                          Afgelopen
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-gray-600 mb-1.5">{event.description}</p>
                    )}

                    {/* Date & Time */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(event.date), "dd-MM-yyyy", { locale: nl })}</span>
                      {event.startuur && (
                        <>
                          <Clock className="h-3 w-3 ml-1.5" />
                          <span>{event.startuur}</span>
                        </>
                      )}
                    </div>

                    {/* Youth specific fields */}
                    {showYouth ? (
                      <>
                        {/* Categories */}
                        <div className="mb-2">
                          <div className="text-xs text-gray-500 mb-1">Categorieën:</div>
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              try {
                                const categories = event.category 
                                  ? (typeof event.category === 'string' ? JSON.parse(event.category) : event.category)
                                  : [];
                                return categories.map((cat: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full"
                                  >
                                    {cat}
                                  </span>
                                ));
                              } catch (error) {
                                return null;
                              }
                            })()}
                          </div>
                        </div>

                        {/* Instructors */}
                        <div className="mb-2">
                          <div className="text-xs text-gray-500 mb-1">Lesgevers:</div>
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              try {
                                const instructors = event.instructors ? JSON.parse(event.instructors) : [];
                                return instructors.map((instructor: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                                  >
                                    {instructor}
                                  </span>
                                ));
                              } catch (error) {
                                return null;
                              }
                            })()}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Begeleider for non-youth */
                      <div className="mb-2">
                        <div className="text-xs text-gray-500 mb-1">Begeleider:</div>
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            try {
                              const begeleiders = event.begeleider ? JSON.parse(event.begeleider) : [];
                              return begeleiders.map((begeleider: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full"
                                >
                                  {begeleider}
                                </span>
                              ));
                            } catch (error) {
                              return null;
                            }
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getEventTypeColor(
                      event.type
                    )}`}
                  >
                    {getTypeDisplayLabel(event.type)}
                  </span>
                </div>

                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(event)}
                    className="flex-1 bg-mainAccent hover:bg-mainAccentDark"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Bewerken
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(event.event_id)}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarEventList

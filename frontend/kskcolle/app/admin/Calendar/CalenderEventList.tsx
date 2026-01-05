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

  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4 min-h-[200px]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  Evenementen Overzicht
                </h2>
                <p className="text-white/80 mt-1">Geen evenementen gevonden</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Button
                  onClick={onAddEvent}
                  className="bg-white text-mainAccent hover:bg-white/90 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuw Evenement
                </Button>
                
                {/* Toggle Past Events */}
                <div className={`flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg ${isAutoPastEvents ? 'opacity-60' : ''}`}>
                  <History className="h-4 w-4 text-white" />
                  <span className="text-sm font-medium text-white">Toon afgelopen events</span>
                  <button
                    onClick={() => !isAutoPastEvents && setShowPastEvents(!showPastEvents)}
                    disabled={isAutoPastEvents}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-mainAccent ${
                      showPastEvents ? 'bg-white' : 'bg-white/30'
                    } ${isAutoPastEvents ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    title={isAutoPastEvents ? 'Automatisch ingeschakeld omdat een verleden jaar is geselecteerd' : ''}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full transition-transform ${
                        showPastEvents ? 'translate-x-5 bg-mainAccent' : 'translate-x-1 bg-white'
                      }`}
                    />
                  </button>
                  {isAutoPastEvents && (
                    <span className="text-xs text-white/80 italic">(automatisch)</span>
                  )}
                </div>
                
                {/* Toggle Switch Youth/Normal */}
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${!showYouth ? 'text-white' : 'text-white/60'}`}>
                    <User className="h-4 w-4 inline mr-1" />
                    Normaal
                  </span>
                  <button
                    onClick={() => setShowYouth(!showYouth)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-mainAccent ${
                      showYouth ? 'bg-white' : 'bg-white/30'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                        showYouth ? 'translate-x-6 bg-mainAccent' : 'translate-x-1 bg-white'
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${showYouth ? 'text-white' : 'text-white/60'}`}>
                    <Users className="h-4 w-4 inline mr-1" />
                    Jeugd
                  </span>
                </div>
              </div>
              
              {/* Filter Options */}
              <div className="flex items-center gap-3 flex-wrap">
                <Filter className="h-4 w-4 text-white" />
                
                {/* Type Filter */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
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
                
                {/* Month Filter */}
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
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
                
                {/* Year Filter */}
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-32 bg-white/20 border-white/30 text-white">
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
          </div>
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
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4 min-h-[200px]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Calendar className="h-6 w-6" />
                    Evenementen Overzicht
                  </h2>
                  <p className="text-white/80 mt-1">
                    {events.length} {events.length === 1 ? 'evenement' : 'evenementen'} 
                    {showPastEvents ? ' (inclusief afgelopen)' : ' (toekomstig)'}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <Button
                    onClick={onAddEvent}
                    className="bg-white text-mainAccent hover:bg-white/90 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nieuw Evenement
                  </Button>
                  
                  {/* Toggle Past Events */}
                  <div className={`flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg ${isAutoPastEvents ? 'opacity-60' : ''}`}>
                    <History className="h-4 w-4 text-white" />
                    <span className="text-sm font-medium text-white">Toon afgelopen events</span>
                    <button
                      onClick={() => !isAutoPastEvents && setShowPastEvents(!showPastEvents)}
                      disabled={isAutoPastEvents}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-mainAccent ${
                        showPastEvents ? 'bg-white' : 'bg-white/30'
                      } ${isAutoPastEvents ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      title={isAutoPastEvents ? 'Automatisch ingeschakeld omdat een verleden jaar is geselecteerd' : ''}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full transition-transform ${
                          showPastEvents ? 'translate-x-5 bg-mainAccent' : 'translate-x-1 bg-white'
                        }`}
                      />
                    </button>
                    {isAutoPastEvents && (
                      <span className="text-xs text-white/80 italic">(automatisch)</span>
                    )}
                  </div>
                  
                  {/* Toggle Switch Youth/Normal */}
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${!showYouth ? 'text-white' : 'text-white/60'}`}>
                      <User className="h-4 w-4 inline mr-1" />
                      Normaal
                    </span>
                    <button
                      onClick={() => setShowYouth(!showYouth)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-mainAccent ${
                        showYouth ? 'bg-white' : 'bg-white/30'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                          showYouth ? 'translate-x-6 bg-mainAccent' : 'translate-x-1 bg-white'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium ${showYouth ? 'text-white' : 'text-white/60'}`}>
                      <Users className="h-4 w-4 inline mr-1" />
                      Jeugd
                    </span>
                  </div>
                </div>
                
                {/* Filter Options */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Filter className="h-4 w-4 text-white" />
                  
                  {/* Type Filter */}
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
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
                  
                  {/* Month Filter */}
                  <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
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
                  
                  {/* Year Filter */}
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-32 bg-white/20 border-white/30 text-white">
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
          </div>
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
                      Datum & Tijd
                    </div>
                  </th>
                  <th className="p-4 text-left font-semibold text-textColor">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Beschrijving
                    </div>
                  </th>
                  {showYouth ? (
                    <>
                      <th className="p-4 text-left font-semibold text-textColor">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Categorie
                        </div>
                      </th>
                      <th className="p-4 text-left font-semibold text-textColor">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Lesgevers
                        </div>
                      </th>
                    </>
                  ) : (
                    <th className="p-4 text-left font-semibold text-textColor">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Begeleider
                      </div>
                    </th>
                  )}
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
                    <td className="p-4">
                      <div className="font-medium text-textColor flex items-center gap-2">
                        {event.title}
                        {isPast && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            Afgelopen
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-mainAccent" />
                        <div>
                          <div className="text-gray-700">
                            {format(new Date(event.date), "dd-MM-yyyy", { locale: nl })}
                          </div>
                          {event.startuur && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="h-3 w-3" />
                              {event.startuur}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-600 text-sm max-w-xs">
                        {event.description}
                      </div>
                    </td>
                    {showYouth ? (
                      <>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              try {
                                const categories = event.category 
                                  ? (typeof event.category === 'string' ? JSON.parse(event.category) : event.category)
                                  : [];
                                return categories.map((cat: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
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
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              try {
                                const instructors = event.instructors ? JSON.parse(event.instructors) : [];
                                return instructors.map((instructor: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
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
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            try {
                              const begeleiders = event.begeleider ? JSON.parse(event.begeleider) : [];
                              return begeleiders.map((begeleider: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
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
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getEventTypeColor(
                          event.type
                        )}`}>
                        {getTypeDisplayLabel(event.type)}
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
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {events.map((event) => {
              const eventDate = new Date(event.date)
              const now = new Date()
              now.setHours(0, 0, 0, 0)
              eventDate.setHours(0, 0, 0, 0)
              const isPast = eventDate < now
              
              return (
              <div
                key={event.event_id}
                className={`border border-neutral-200 rounded-lg p-4 hover:border-mainAccent/30 hover:shadow-md transition-all duration-200 ${isPast ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-textColor">{event.title}</h3>
                      {isPast && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                          Afgelopen
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    )}
                    
                    {/* Date & Time */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(event.date), "dd-MM-yyyy", { locale: nl })}</span>
                      {event.startuur && (
                        <>
                          <Clock className="h-3 w-3 ml-2" />
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
                                    className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
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
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
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
                                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
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
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(
                      event.type
                    )}`}
                  >
                    {getTypeDisplayLabel(event.type)}
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
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarEventList

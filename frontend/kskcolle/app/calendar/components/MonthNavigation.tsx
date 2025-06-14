"use client"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { nl } from "date-fns/locale"

interface MonthNavigationProps {
  currentDate: Date
  onPrevMonth: () => void
  onNextMonth: () => void
}

export default function MonthNavigation({ currentDate, onPrevMonth, onNextMonth }: MonthNavigationProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Maand Navigatie
          </h2>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevMonth}
              className="text-white hover:bg-white/20"
              aria-label="Vorige maand"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xl font-bold text-white min-w-[200px] text-center">
              {format(currentDate, "MMMM yyyy", { locale: nl })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNextMonth}
              className="text-white hover:bg-white/20"
              aria-label="Volgende maand"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

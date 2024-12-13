import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

interface MonthNavigationProps {
  currentDate: Date
  onPrevMonth: () => void
  onNextMonth: () => void
}

export default function MonthNavigation({ currentDate, onPrevMonth, onNextMonth }: MonthNavigationProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <Button
        variant="outline"
        size="icon"
        onClick={onPrevMonth}
        aria-label="Vorige maand"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-xl font-bold text-[#4A4947]">
        {format(currentDate, 'MMMM yyyy', { locale: nl })}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={onNextMonth}
        aria-label="Volgende maand"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
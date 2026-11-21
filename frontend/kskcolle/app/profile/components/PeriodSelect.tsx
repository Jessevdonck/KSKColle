"use client"

import { CalendarRange } from "lucide-react"
import { parseISO, subMonths } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export type RangePreset = "1m" | "6m" | "12m" | "all" | "custom"

export interface Period {
  preset: RangePreset
  customStart: string
  customEnd: string
}

/** Ver genoeg terug om als "sinds altijd" te gelden, ook voor de historische ELIO-data. */
const ALL_TIME_START = new Date(1970, 0, 1)

export function periodBounds({ preset, customStart, customEnd }: Period): { start: Date; end: Date } {
  const end = new Date()
  if (preset === "1m") return { start: subMonths(end, 1), end }
  if (preset === "6m") return { start: subMonths(end, 6), end }
  if (preset === "12m") return { start: subMonths(end, 12), end }
  if (preset === "all") return { start: ALL_TIME_START, end }
  const start = customStart ? parseISO(customStart) : subMonths(end, 12)
  const endDate = customEnd ? parseISO(customEnd) : end
  return { start: start > endDate ? endDate : start, end: endDate > start ? endDate : start }
}

/** Keuze van de periode voor de statistieken op het profiel. */
export default function PeriodSelect({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <CalendarRange className="h-3.5 w-3.5" />
        Periode
      </span>
      <Select value={value.preset} onValueChange={(v) => onChange({ ...value, preset: v as RangePreset })}>
        <SelectTrigger className="h-8 w-[140px] bg-white text-sm" aria-label="Periode">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1m">Laatste maand</SelectItem>
          <SelectItem value="6m">Laatste 6 mnd</SelectItem>
          <SelectItem value="12m">Laatste 12 mnd</SelectItem>
          <SelectItem value="all">Sinds altijd</SelectItem>
          <SelectItem value="custom">Aangepast</SelectItem>
        </SelectContent>
      </Select>
      {value.preset === "custom" && (
        <>
          <Input
            type="date"
            value={value.customStart}
            onChange={(e) => onChange({ ...value, customStart: e.target.value })}
            className="h-8 w-[135px] bg-white text-xs"
            aria-label="Van"
          />
          <span className="text-xs text-muted-foreground">–</span>
          <Input
            type="date"
            value={value.customEnd}
            onChange={(e) => onChange({ ...value, customEnd: e.target.value })}
            className="h-8 w-[135px] bg-white text-xs"
            aria-label="Tot"
          />
        </>
      )}
    </div>
  )
}

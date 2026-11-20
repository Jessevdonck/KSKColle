"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

/** Aantal partijen per pagina in de lijsten op het profiel */
export const PROFILE_PAGE_SIZE = 5

/**
 * Pagineert een lijst. `resetKey` zet de pagina terug op 1 (bv. bij een andere
 * tegenstander); minder items springt automatisch naar een bestaande pagina.
 */
export function usePaged<T>(items: T[], pageSize = PROFILE_PAGE_SIZE, resetKey?: unknown) {
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))

  useEffect(() => {
    setPage(0)
  }, [resetKey])

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1))
  }, [pageCount])

  const current = Math.min(page, pageCount - 1)
  return {
    page: current,
    pageCount,
    setPage,
    visible: items.slice(current * pageSize, (current + 1) * pageSize),
  }
}

/** Pijltjes met "1/4"-teller; verborgen als alles op één pagina past. */
export function ListPager({
  page,
  pageCount,
  setPage,
}: {
  page: number
  pageCount: number
  setPage: (page: number) => void
}) {
  if (pageCount <= 1) return null
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={() => setPage(Math.max(0, page - 1))}
        disabled={page === 0}
        className="p-1 rounded hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Vorige pagina"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-xs text-muted-foreground min-w-7 text-center tabular-nums">
        {page + 1}/{pageCount}
      </span>
      <button
        type="button"
        onClick={() => setPage(Math.min(pageCount - 1, page + 1))}
        disabled={page >= pageCount - 1}
        className="p-1 rounded hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Volgende pagina"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

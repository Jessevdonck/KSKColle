"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { getAll } from "../../../api/index"
import { Archive, ChevronRight, Search, Trophy, Users, X } from "lucide-react"

const CLASS_ORDER = [
  "Eerste Klasse",
  "Tweede Klasse",
  "Tweede en Derde Klasse",
  "Derde Klasse",
  "Vierde Klasse",
  "Vierde en Vijfde Klasse",
  "Vijfde Klasse",
  "Zesde Klasse",
  "Zevende Klasse",
]

type ArchiveTournament = {
  tournament_id: number
  naam: string
  class_name?: string | null
  is_youth?: boolean
  rondes: number
  participations: Array<{
    user_id: number
    score?: number | null
    user?: { user_id: number; voornaam: string; achternaam: string }
  }>
  rounds?: Array<{ ronde_datum?: string | null }>
}

type Category = "herfst" | "lente" | "zomer" | "blitz" | "jeugd" | "overige"

const CATEGORIES: Array<{ key: Category | "alle"; label: string }> = [
  { key: "alle", label: "Alle" },
  { key: "herfst", label: "Herfst" },
  { key: "lente", label: "Lente" },
  { key: "zomer", label: "Zomer" },
  { key: "blitz", label: "Blitz" },
  { key: "jeugd", label: "Jeugd" },
  { key: "overige", label: "Overige" },
]

function categoryOf(t: { naam: string; is_youth?: boolean }): Category {
  const n = t.naam.toLowerCase()
  if (t.is_youth || n.includes("jeugd")) return "jeugd"
  if (n.includes("herfst")) return "herfst"
  if (n.includes("lente")) return "lente"
  if (n.includes("zomer")) return "zomer"
  if (n.includes("blitz") || n.includes("snelschaak")) return "blitz"
  return "overige"
}

const classRank = (c?: string | null) => {
  if (!c) return -1
  const i = CLASS_ORDER.indexOf(c)
  return i === -1 ? CLASS_ORDER.length : i
}

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

type Group = {
  key: string
  name: string
  category: Category
  /** Toernooi waarnaar gelinkt wordt (eerste klasse); de detailpagina toont de andere klassen als tabs */
  linkId: number
  classes: string[]
  players: number
  start: Date | null
  end: Date | null
  year: number | null
  winner: string | null
  /** Tekst om in te zoeken: naam, klassen, jaar en alle spelers */
  haystack: string
}

/** Winnaar enkel als die eenduidig is (hoogste score zonder gelijkstand). */
function winnerOf(t: ArchiveTournament): string | null {
  const scored = t.participations.filter((p) => p.user && typeof p.score === "number")
  if (scored.length === 0) return null
  const sorted = [...scored].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  if (sorted.length > 1 && sorted[0].score === sorted[1].score) return null
  if (!sorted[0].score) return null
  const u = sorted[0].user!
  return `${u.voornaam} ${u.achternaam}`.trim()
}

function buildGroups(tournaments: ArchiveTournament[]): Group[] {
  const byName = new Map<string, ArchiveTournament[]>()
  for (const t of tournaments) {
    const list = byName.get(t.naam) ?? []
    list.push(t)
    byName.set(t.naam, list)
  }

  return [...byName.entries()].map(([name, list]) => {
    const sorted = [...list].sort((a, b) => classRank(a.class_name) - classRank(b.class_name))
    const dates = list
      .flatMap((t) => t.rounds ?? [])
      .map((r) => (r.ronde_datum ? new Date(r.ronde_datum) : null))
      .filter((d): d is Date => d !== null && !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())
    const start = dates[0] ?? null
    const end = dates[dates.length - 1] ?? null
    const yearFromName = name.match(/(19|20)\d{2}/)?.[0]
    const year = end ? end.getFullYear() : yearFromName ? Number(yearFromName) : null
    const players = new Set(list.flatMap((t) => t.participations.map((p) => p.user_id))).size
    const classes = sorted.map((t) => t.class_name).filter((c): c is string => !!c)
    const playerNames = list
      .flatMap((t) => t.participations.map((p) => (p.user ? `${p.user.voornaam} ${p.user.achternaam}` : "")))
      .join(" ")

    return {
      key: name,
      name,
      category: categoryOf(sorted[0]),
      linkId: sorted[0].tournament_id,
      classes,
      players,
      start,
      end,
      year,
      winner: winnerOf(sorted[0]),
      haystack: normalize(`${name} ${classes.join(" ")} ${year ?? ""} ${playerNames}`),
    }
  })
}

/** Sorteersleutel: laatste speeldatum, anders (enkel eindstand bewaard) midden van het jaar uit de naam */
const sortTime = (g: Group) => g.end?.getTime() ?? (g.year ? new Date(g.year, 5, 1).getTime() : 0)

const monthYear = (d: Date) => d.toLocaleDateString("nl-BE", { month: "short", year: "numeric" })

function periodLabel(start: Date | null, end: Date | null) {
  if (!start || !end) return null
  const sameDay = start.toDateString() === end.toDateString()
  if (sameDay) return start.toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric" })
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  if (sameMonth) return monthYear(end)
  const sameYear = start.getFullYear() === end.getFullYear()
  return sameYear
    ? `${start.toLocaleDateString("nl-BE", { month: "short" })} – ${monthYear(end)}`
    : `${monthYear(start)} – ${monthYear(end)}`
}

export default function TournamentArchive() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<Category | "alle">("alle")
  const { data, error, isLoading } = useSWR<ArchiveTournament[]>("tournament?active=false", getAll)

  const groups = useMemo(() => buildGroups(data ?? []), [data])

  const counts = useMemo(() => {
    const c: Record<string, number> = { alle: groups.length }
    for (const g of groups) c[g.category] = (c[g.category] ?? 0) + 1
    return c
  }, [groups])

  // Meest recente eerst (laatste speeldatum), dan op naam
  const filtered = useMemo(() => {
    const terms = normalize(search).split(/\s+/).filter(Boolean)
    return groups
      .filter((g) => category === "alle" || g.category === category)
      .filter((g) => terms.every((t) => g.haystack.includes(t)))
      .sort((a, b) => sortTime(b) - sortTime(a) || a.name.localeCompare(b.name, "nl"))
  }, [groups, category, search])

  const byYear = useMemo(() => {
    const years = new Map<string, Group[]>()
    for (const g of filtered) {
      const key = g.year ? String(g.year) : "Onbekend"
      const list = years.get(key) ?? []
      list.push(g)
      years.set(key, list)
    }
    return [...years.entries()]
  }, [filtered])

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-4xl px-3 py-5 sm:py-6">
        {/* Kop */}
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-textColor">
              <Archive className="h-6 w-6 text-mainAccent" />
              Toernooiarchief
            </h1>
            <p className="text-sm text-gray-500">Alle afgelopen toernooien van KSK Colle, meest recente eerst</p>
          </div>
          {data && <span className="shrink-0 text-xs text-gray-500 tabular-nums">{groups.length} toernooien</span>}
        </div>

        {/* Zoeken + filters */}
        <div className="sticky top-14 z-10 -mx-3 mb-3 space-y-2 bg-neutral-50/95 px-3 py-2 backdrop-blur">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              inputMode="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek op toernooi, jaar, klasse of speler…"
              className="w-full rounded-lg border border-neutral-200 bg-white py-1.5 pl-8 pr-8 text-sm outline-none focus:border-mainAccent focus:ring-1 focus:ring-mainAccent"
              aria-label="Zoek in het archief"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
                aria-label="Zoekterm wissen"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-1 overflow-x-auto pb-0.5" role="tablist" aria-label="Soort toernooi">
            {CATEGORIES.filter((c) => c.key === "alle" || counts[c.key]).map((c) => {
              const active = category === c.key
              return (
                <button
                  key={c.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(c.key)}
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "border-mainAccent bg-mainAccent text-white"
                      : "border-neutral-200 bg-white text-gray-600 hover:border-mainAccent/40"
                  }`}
                >
                  {c.label}
                  <span className={`ml-1 tabular-nums ${active ? "text-white/80" : "text-gray-400"}`}>{counts[c.key] ?? 0}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Lijst */}
        {isLoading ? (
          <div className="space-y-1.5" data-cy="is_loading">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-white" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600" data-cy="axios_error_message">
            Er is een fout opgetreden bij het laden van het archief.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg bg-white p-6 text-center text-sm text-gray-500" data-cy="no_tournaments_message">
            {search || category !== "alle" ? (
              <>
                Geen toernooien gevonden.{" "}
                <button
                  type="button"
                  className="font-medium text-mainAccent hover:underline"
                  onClick={() => {
                    setSearch("")
                    setCategory("alle")
                  }}
                >
                  Filters wissen
                </button>
              </>
            ) : (
              "Er zijn nog geen afgelopen toernooien."
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {(search || category !== "alle") && (
              <p className="text-xs text-gray-500">
                {filtered.length} van {groups.length} toernooien
              </p>
            )}
            {byYear.map(([year, list]) => (
              <section key={year} aria-labelledby={`jaar-${year}`}>
                <h2 id={`jaar-${year}`} className="mb-1 flex items-center gap-2 text-sm font-bold text-textColor">
                  {year}
                  <span className="h-px flex-1 bg-neutral-200" />
                  <span className="text-xs font-normal text-gray-400 tabular-nums">{list.length}</span>
                </h2>
                <ul className="divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200 bg-white">
                  {list.map((g) => (
                    <li key={g.key}>
                      <Link
                        href={`/toernooien/${g.linkId}`}
                        className="group flex items-center gap-2 px-2.5 py-2 hover:bg-mainAccent/5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-textColor group-hover:text-mainAccent">
                              {g.name}
                            </span>
                            {g.category === "jeugd" && (
                              <span className="shrink-0 rounded bg-blue-50 px-1 py-px text-[10px] font-medium text-blue-600">Jeugd</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                            {periodLabel(g.start, g.end) && <span>{periodLabel(g.start, g.end)}</span>}
                            {g.classes.length > 1 && <span>{g.classes.length} klassen</span>}
                            {g.classes.length === 1 && <span>{g.classes[0]}</span>}
                            <span className="inline-flex items-center gap-0.5">
                              <Users className="h-3 w-3" />
                              {g.players}
                            </span>
                            {g.winner && (
                              <span className="inline-flex min-w-0 items-center gap-0.5 text-gray-600">
                                <Trophy className="h-3 w-3 shrink-0 text-yellow-500" />
                                <span
                                  className="truncate"
                                  title={g.classes.length > 1 && g.classes[0] ? `Winnaar ${g.classes[0]}` : "Winnaar"}
                                >
                                  {g.winner}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-mainAccent" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

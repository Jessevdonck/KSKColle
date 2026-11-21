"use client"

import useSWR from "swr"
import Link from "next/link"
import { Trophy, Medal, Award } from "lucide-react"
import { getUserPlacements } from "../../api/index"
import { getHistorischPalmares } from "../../../lib/erelijsten"

type Category = "herfst" | "lente" | "zomer" | "blitz" | "jeugd" | "overige"

interface Placement {
  tournament_id: number
  naam: string
  class_name: string | null
  jaar: number | null
  category: Category
  rank: number
  shared: boolean
  players: number
}

/** Eén vakje in de tabel */
interface Cell {
  rank: number
  /** Ratingprijs uit de historische erelijst */
  ratingPrize?: boolean
  shared?: boolean
  players?: number
  title: string
  classTag?: string
  href?: string
}

const ORDINALS: Array<[RegExp, number]> = [
  [/\b(eerste|1ste|1e)\b/i, 1],
  [/\b(tweede|2de|2e)\b/i, 2],
  [/\b(derde|3de|3e)\b/i, 3],
  [/\b(vierde|4de|4e)\b/i, 4],
  [/\b(vijfde|5de|5e)\b/i, 5],
]
const classNumber = (c?: string | null): number | null => {
  if (!c) return null
  for (const [re, n] of ORDINALS) if (re.test(c)) return n
  return null
}
const CLASS_LABEL = ["", "Eerste", "Tweede", "Derde", "Vierde", "Vijfde"]

/** Kolom voor een plaats: lente per klasse, de rest per soort toernooi */
const columnOf = (category: Category, className?: string | null): string => {
  if (category === "lente") {
    const n = classNumber(className)
    return n ? `lente-${n}` : "lente-x"
  }
  return category
}

const bucketToCategory = (bucket: string): Category =>
  bucket === "snelschaak" ? "blitz" : (["herfst", "lente", "zomer"].includes(bucket) ? bucket : "overige") as Category

const MEDAL: Record<number, string> = { 1: "bg-yellow-400 text-yellow-950", 2: "bg-gray-300 text-gray-800", 3: "bg-amber-700 text-white" }

/**
 * Palmares als tabel: per jaar een rij, per competitie een kolom (Clubkampioenschap per klasse),
 * met de eindrang (medaille voor de top 3). Combineert de eindrang uit de database met de
 * historische erelijsten voor jaren die (nog) niet in de database zitten.
 */
export default function Palmares({
  playerId,
  voornaam,
  achternaam,
}: {
  playerId: number
  voornaam: string
  achternaam: string
}) {
  const { data: placements = [] } = useSWR<Placement[]>(["placements", playerId], () => getUserPlacements(playerId), {
    revalidateOnFocus: false,
  })
  const { data: historisch = [] } = useSWR(
    ["palmares-historiek", voornaam, achternaam],
    () => getHistorischPalmares(voornaam, achternaam),
    { revalidateOnFocus: false },
  )

  // jaar -> kolom -> vakje
  const table = new Map<number, Map<string, Cell>>()
  const put = (jaar: number, col: string, cell: Cell, override: boolean) => {
    const row = table.get(jaar) ?? new Map<string, Cell>()
    if (override || !row.has(col)) row.set(col, cell)
    table.set(jaar, row)
  }

  for (const p of placements) {
    if (!p.jaar) continue
    const col = columnOf(p.category, p.class_name)
    const n = classNumber(p.class_name)
    put(
      p.jaar,
      col,
      {
        rank: p.rank,
        shared: p.shared,
        players: p.players,
        title: `${p.naam}${p.class_name ? ` – ${p.class_name}` : ""}: ${p.rank}e${p.shared ? " (gedeeld)" : ""} van ${p.players}`,
        classTag: p.category === "blitz" && n ? `K${n}` : undefined,
        href: `/toernooien/${p.tournament_id}`,
      },
      true,
    )
  }
  // Historische erelijst enkel waar de database niets heeft
  for (const e of historisch) {
    const category = bucketToCategory(e.bucket)
    const klasse = e.competitie.split("–")[1]?.trim()
    const col = columnOf(category, klasse)
    const n = classNumber(klasse)
    put(
      e.jaar,
      col,
      {
        rank: e.positie === 4 ? 4 : e.positie,
        ratingPrize: e.positie === 4,
        title: `${e.competitie} ${e.jaar}: ${e.positie === 4 ? "ratingprijs" : `${e.positie}e plaats`}`,
        classTag: category === "blitz" && n ? `K${n}` : undefined,
      },
      false,
    )
  }

  if (table.size === 0) return null

  // Kolommen die effectief iets bevatten
  const used = new Set([...table.values()].flatMap((row) => [...row.keys()]))
  const lenteCols = [1, 2, 3, 4, 5].map((n) => `lente-${n}`).concat("lente-x").filter((c) => used.has(c))
  const other: Array<{ key: string; label: string }> = [
    { key: "blitz", label: "Blitz" },
    { key: "zomer", label: "Zomer" },
    { key: "jeugd", label: "Jeugd" },
    { key: "overige", label: "Overige" },
  ].filter((c) => used.has(c.key))
  const showHerfst = used.has("herfst")
  const years = [...table.keys()].sort((a, b) => b - a)

  const cells = [...table.values()].flatMap((row) => [...row.values()])
  const telling = {
    goud: cells.filter((c) => !c.ratingPrize && c.rank === 1).length,
    zilver: cells.filter((c) => !c.ratingPrize && c.rank === 2).length,
    brons: cells.filter((c) => !c.ratingPrize && c.rank === 3).length,
  }

  const th = "border-b border-l border-gray-200 px-1.5 py-1 text-center text-[11px] font-semibold text-gray-700"

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <Trophy className="h-4 w-4 text-mainAccent" />
          Palmares
        </h2>
        <div className="flex items-center gap-2.5 text-xs font-medium text-gray-700">
          <span className="flex items-center gap-1"><Medal className="h-3.5 w-3.5 text-yellow-500" /> {telling.goud}</span>
          <span className="flex items-center gap-1"><Medal className="h-3.5 w-3.5 text-gray-400" /> {telling.zilver}</span>
          <span className="flex items-center gap-1"><Medal className="h-3.5 w-3.5 text-amber-700" /> {telling.brons}</span>
        </div>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th rowSpan={lenteCols.length ? 2 : 1} className={`${th} border-l-0 text-left`}>Jaar</th>
              {showHerfst && <th rowSpan={lenteCols.length ? 2 : 1} className={th}>Herfst</th>}
              {lenteCols.length > 0 && (
                <th colSpan={lenteCols.length} className={th}>Clubkampioenschap</th>
              )}
              {other.map((c) => (
                <th key={c.key} rowSpan={lenteCols.length ? 2 : 1} className={th}>{c.label}</th>
              ))}
            </tr>
            {lenteCols.length > 0 && (
              <tr>
                {lenteCols.map((c) => (
                  <th key={c} className={`${th} font-medium text-gray-500`}>
                    {c === "lente-x" ? "Andere" : CLASS_LABEL[Number(c.split("-")[1])]}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {years.map((jaar, i) => {
              const row = table.get(jaar)!
              const cols = [...(showHerfst ? ["herfst"] : []), ...lenteCols, ...other.map((c) => c.key)]
              return (
                <tr key={jaar} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                  <td className="border-b border-gray-100 px-2 py-1 font-semibold tabular-nums text-gray-700">{jaar}</td>
                  {cols.map((col) => (
                    <td key={col} className="border-b border-l border-gray-100 px-1 py-1 text-center">
                      <PlacementCell cell={row.get(col)} />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PlacementCell({ cell }: { cell?: Cell }) {
  if (!cell) return null
  let inner
  if (cell.ratingPrize) {
    inner = <Award className="mx-auto h-4 w-4 text-mainAccent" aria-label="Ratingprijs" />
  } else if (cell.rank <= 3) {
    inner = (
      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${MEDAL[cell.rank]}`}>
        {cell.rank}
      </span>
    )
  } else {
    inner = (
      <span className="tabular-nums text-gray-700">
        {cell.rank}e{cell.shared ? "=" : ""}
      </span>
    )
  }
  const content = (
    <span className="inline-flex items-center gap-0.5" title={cell.title}>
      {inner}
      {cell.classTag && <span className="text-[9px] text-gray-400">{cell.classTag}</span>}
    </span>
  )
  return cell.href ? (
    <Link href={cell.href} className="inline-block rounded px-0.5 hover:bg-mainAccent/10">
      {content}
    </Link>
  ) : (
    content
  )
}

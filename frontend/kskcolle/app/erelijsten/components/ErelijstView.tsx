"use client"

import { ArrowLeft, Crown, Medal, Trophy } from "lucide-react"
import { Fragment, useEffect, useState, type ReactNode } from "react"
import Link from 'next/link'
import useSWR from "swr"
import { getAllHonors } from "../../api/index"

import {
  cleanPlayerName,
  fetchErelijstRows,
  processSimpleData,
  processKlasseData,
  processZomerData,
  processSnelschaakData,
  processQuizData,
  processKonijnData,
  processMegalijstData,
  processRankingData,
  processRecordsData,
  EXCEL_FILES,
  splitWinners,
  type ErelijstFormat,
  type Result,
  type KlasseResult,
  type QuizResult,
  type KonijnResult,
  type RankingResult,
  type RecordResult,
} from "../../../lib/erelijsten"

// Helper function to create URL-friendly names
const createUrlFriendlyName = (voornaam: string, achternaam: string): string => {
  return `${voornaam}_${achternaam}`.replace(/\s+/g, '_')
}

const createClickableName = (name: string): ReactNode => {
  const displayName = cleanPlayerName(name)
  if (!displayName || displayName === '-') {
    return <span className="text-gray-500">{displayName || '-'}</span>
  }

  // Gedeelde titel ("Naam A & Naam B"): elke speler apart aanklikbaar.
  // Cellen als "Geen Winnaar" zijn geen speler en krijgen dus geen profiellink.
  const spelers = splitWinners(displayName)
  if (spelers.length === 0) {
    return <span className="text-gray-500">{displayName}</span>
  }
  if (spelers.length > 1) {
    return (
      <>
        {spelers.map((speler, i) => (
          <Fragment key={speler}>
            {i > 0 && <span className="text-gray-400"> &amp; </span>}
            {createClickableName(speler)}
          </Fragment>
        ))}
      </>
    )
  }

  const nameParts = displayName.split(' ')
  if (nameParts.length < 2) {
    return <span className="text-gray-700">{displayName}</span>
  }

  const voornaam = nameParts[0]
  const achternaam = nameParts.slice(1).join(' ')
  const profileUrl = `/profile/${createUrlFriendlyName(voornaam, achternaam)}`

  return (
    <Link
      href={profileUrl}
      className="text-gray-900 hover:text-mainAccent hover:underline transition-colors cursor-pointer"
    >
      {displayName}
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Gedeelde UI-template: één consistente, compacte tabelstijl voor elke erelijst.
// ---------------------------------------------------------------------------

interface ErelijstColumn<T> {
  header: ReactNode
  align?: 'left' | 'center'
  render: (row: T) => ReactNode
  emphasize?: boolean
  /** Vaste kolombreedte (bv. "70px" of "30%"). Zorgt dat kolommen over alle secties
   *  van hetzelfde formaat verticaal gelijk uitlijnen, ipv per tabel auto-sized. */
  width?: string
}

/**
 * Eén compacte tabel in de huisstijl. Wordt door alle toernooiformaten gebruikt.
 * `table-fixed` + een `<colgroup>` zorgt dat identieke kolomdefinities altijd dezelfde
 * breedte krijgen, ook wanneer dezelfde tabel meerdere keren na elkaar voorkomt
 * (bv. één per jaar) — zo blijft alles mooi onder elkaar uitgelijnd.
 */
function ErelijstTable<T>({
  columns,
  rows,
  keyFn,
  emptyLabel = "Geen data gevonden",
}: {
  columns: ErelijstColumn<T>[]
  rows: T[]
  keyFn: (row: T, index: number) => string | number
  emptyLabel?: string
}) {
  if (rows.length === 0) {
    return <div className="px-2 py-3 text-xs text-gray-500 text-center">{emptyLabel}</div>
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-xs table-fixed">
        <colgroup>
          {columns.map((col, i) => (
            <col key={i} style={col.width ? { width: col.width } : undefined} />
          ))}
        </colgroup>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-2 py-1.5 font-semibold text-gray-600 border-b border-gray-200 truncate ${col.align === 'center' ? 'text-center' : 'text-left'}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, index) => (
            <tr key={keyFn(row, index)} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/70"}>
              {columns.map((col, i) => (
                <td
                  key={i}
                  className={`px-2 py-1.5 truncate text-gray-700 ${col.align === 'center' ? 'text-center' : ''} ${col.emphasize ? 'font-medium text-gray-900' : ''}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Gegroepeerde sectie (bv. per jaar, per klasse, per record) rond een ErelijstTable. */
function ErelijstSection({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200">
        <h3 className="text-xs font-bold text-gray-700">{title}</h3>
      </div>
      {children}
    </div>
  )
}

/** Lijst van gegroepeerde secties, met consistente verticale spacing. */
function ErelijstSectionList({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>
}

const colYear: ErelijstColumn<{ jaar: number }> = {
  header: "Jaar",
  emphasize: true,
  width: "64px",
  render: (r) => r.jaar,
}
const colGoud = <T,>(get: (r: T) => string | undefined): ErelijstColumn<T> => ({
  header: "🥇",
  render: (r) => createClickableName(get(r) || "-"),
})
const colZilver = <T,>(get: (r: T) => string | undefined): ErelijstColumn<T> => ({
  header: "🥈",
  render: (r) => createClickableName(get(r) || "-"),
})
const colBrons = <T,>(get: (r: T) => string | undefined): ErelijstColumn<T> => ({
  header: "🥉",
  render: (r) => createClickableName(get(r) || "-"),
})

interface PrijzenTelling {
  goud: number
  zilver: number
  brons: number
  ratingprijs: number
}

/** Automatisch vastgelegde podia van afgesloten toernooien (uit de database). */
interface HonorTournament {
  tournament_id: number
  naam: string
  class_name?: string | null
  is_youth: boolean
  jaar: number
  podium: Array<{
    position: number
    user: { user_id: number; voornaam: string; achternaam: string }
  }>
}

const honorName = (honor: HonorTournament, position: number): string => {
  const entry = honor.podium.find((p) => p.position === position)
  return entry ? `${entry.user.voornaam} ${entry.user.achternaam}` : ''
}

const honorsForCompetition = (honors: HonorTournament[], keywords: string[]): HonorTournament[] =>
  honors.filter(
    (h) => !h.is_youth && keywords.some((k) => h.naam.toLowerCase().includes(k)),
  )

const KLASSE_ORDER = [
  'Eerste Klasse', 'Tweede Klasse', 'Derde Klasse', 'Vierde Klasse', 'Vijfde Klasse',
  'Vierde en Vijfde Klasse', 'Zesde Klasse', 'Zevende Klasse', 'Achtste Klasse',
]

const EMPTY_HONORS: HonorTournament[] = []

const SNELSCHAAK_KLASSEN = ['1ste Klasse', '2de Klasse', '3de Klasse', '4de Klasse', '5de Klasse']

/** Klassenaam uit de database ("Eerste Klasse") naar de kolomnaam van de snelschaak-erelijst. */
const toSnelschaakKlasse = (klasse: string): string => {
  const index = KLASSE_ORDER.indexOf(klasse)
  if (index >= 0 && index < SNELSCHAAK_KLASSEN.length) return SNELSCHAAK_KLASSEN[index]
  return klasse === 'Hoofdtoernooi' ? SNELSCHAAK_KLASSEN[0] : klasse
}

type TitelRij = [speler: string, aantal: number]

/** Tel titels per individuele speler (gedeelde titels tellen voor elke speler) en hou wie er 2+ heeft. */
const meervoudigeWinnaars = (winnaars: Array<string | undefined>): TitelRij[] => {
  const telling: Record<string, number> = {}
  for (const cel of winnaars) {
    for (const speler of splitWinners(cel)) telling[speler] = (telling[speler] || 0) + 1
  }
  return Object.entries(telling)
    .filter(([, aantal]) => aantal >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

/** Voeg automatische podia toe aan een simple/zomer-tabel (jaren die nog niet in de Excel staan). */
const mergeSimpleHonors = (excelResults: Result[], honors: HonorTournament[], keywords: string[]): Result[] => {
  const existingYears = new Set(excelResults.map((r) => r.jaar))
  const byYear = new Map<number, HonorTournament>()
  for (const h of honorsForCompetition(honors, keywords)) {
    if (existingYears.has(h.jaar)) continue
    // Meerdere klasses in hetzelfde jaar: toon de hoogste klasse in de simple tabel
    const current = byYear.get(h.jaar)
    if (!current) {
      byYear.set(h.jaar, h)
    } else {
      const rank = (t: HonorTournament) =>
        t.class_name ? KLASSE_ORDER.indexOf(t.class_name) : -1
      if (rank(h) < rank(current)) byYear.set(h.jaar, h)
    }
  }
  const extra: Result[] = [...byYear.values()]
    .sort((a, b) => a.jaar - b.jaar)
    .map((h) => ({
      jaar: h.jaar,
      eerste: honorName(h, 1),
      tweede: honorName(h, 2),
      derde: honorName(h, 3),
      ratingprijs: '',
    }))
  return [...excelResults, ...extra]
}

/** Voeg automatische podia toe aan een klasses-tabel (jaren die nog niet in de Excel staan). */
const mergeKlasseHonors = (excelResults: KlasseResult[], honors: HonorTournament[], keywords: string[]): KlasseResult[] => {
  const existingYears = new Set(excelResults.map((r) => r.jaar))
  const byYear = new Map<number, KlasseResult>()
  for (const h of honorsForCompetition(honors, keywords)) {
    if (existingYears.has(h.jaar)) continue
    const year = byYear.get(h.jaar) ?? { jaar: h.jaar, klasses: [] }
    year.klasses.push({
      klasse: h.class_name || 'Hoofdtoernooi',
      eerste: honorName(h, 1),
      tweede: honorName(h, 2),
      derde: honorName(h, 3),
    })
    byYear.set(h.jaar, year)
  }
  const extra = [...byYear.values()]
    .map((y) => ({
      ...y,
      klasses: y.klasses.sort(
        (a, b) => KLASSE_ORDER.indexOf(a.klasse) - KLASSE_ORDER.indexOf(b.klasse),
      ),
    }))
    .sort((a, b) => a.jaar - b.jaar)
  return [...excelResults, ...extra]
}

export default function ErelijstView({ slug }: { slug: string }) {
  const tournament = EXCEL_FILES.find((t) => t.slug === slug)
  const selectedTournament = tournament?.name ?? ""
  const [results, setResults] = useState<Result[]>([])
  const [klasseResults, setKlasseResults] = useState<KlasseResult[]>([])
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [konijnResults, setKonijnResults] = useState<KonijnResult[]>([])
  const [megalijstResults, setMegalijstResults] = useState<Result[]>([])
  const [rankingResults, setRankingResults] = useState<RankingResult[]>([])
  const [recordResults, setRecordResults] = useState<RecordResult[]>([])
  const [rawData, setRawData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentFormat, setCurrentFormat] = useState<ErelijstFormat>(tournament?.format ?? 'simple')

  // Automatisch vastgelegde podia van afgesloten toernooien
  // (geen `= []` default: een nieuwe array per render zou de effect-dependency
  // hieronder blijven triggeren)
  const { data: honorsData } = useSWR<HonorTournament[]>("honors", getAllHonors, {
    revalidateOnFocus: false,
  })
  const honors = honorsData ?? EMPTY_HONORS

  useEffect(() => {
    if (tournament) {
      loadExcelData()
    }
    // Herlaad wanneer de automatische podia binnenkomen zodat ze meegenomen worden
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, honorsData])

  const loadExcelData = async () => {
    if (!tournament) return
    setLoading(true)
    try {
      const jsonData = await fetchErelijstRows(tournament.file)

      setCurrentFormat(tournament.format)

      if (tournament.format === 'quiz') {
        // Process quiz format
        const processedQuizResults = processQuizData(jsonData)
        setQuizResults(processedQuizResults)
        setResults([]) // Clear simple results
        setKlasseResults([]) // Clear klasse results
        setKonijnResults([]) // Clear konijn results
        setMegalijstResults([]) // Clear megalijst results
        setRankingResults([]) // Clear ranking results
        setRecordResults([]) // Clear record results
        setRawData([]) // Clear raw data
      } else if (tournament.format === 'konijn') {
        // Process konijn format
        const processedKonijnResults = processKonijnData(jsonData)
        setKonijnResults(processedKonijnResults)
        setResults([]) // Clear simple results
        setKlasseResults([]) // Clear klasse results
        setQuizResults([]) // Clear quiz results
        setMegalijstResults([]) // Clear megalijst results
        setRankingResults([]) // Clear ranking results
        setRecordResults([]) // Clear record results
        setRawData([]) // Clear raw data
      } else if (tournament.format === 'megalijst') {
        // Process megalijst format
        const processedMegalijstResults = processMegalijstData(jsonData)
        setMegalijstResults(processedMegalijstResults)
        setResults([]) // Clear simple results
        setKlasseResults([]) // Clear klasse results
        setQuizResults([]) // Clear quiz results
        setKonijnResults([]) // Clear konijn results
        setRankingResults([]) // Clear ranking results
        setRecordResults([]) // Clear record results
        setRawData([]) // Clear raw data
      } else if (tournament.format === 'ranking') {
        // Process ranking format
        const processedRankingResults = processRankingData(jsonData)
        setRankingResults(processedRankingResults)
        setResults([]) // Clear simple results
        setKlasseResults([]) // Clear klasse results
        setQuizResults([]) // Clear quiz results
        setKonijnResults([]) // Clear konijn results
        setMegalijstResults([]) // Clear megalijst results
        setRecordResults([]) // Clear record results
        setRawData([]) // Clear raw data
      } else if (tournament.format === 'records') {
        // Process records format
        const processedRecordResults = processRecordsData(jsonData)
        setRecordResults(processedRecordResults)
        setResults([]) // Clear simple results
        setKlasseResults([]) // Clear klasse results
        setQuizResults([]) // Clear quiz results
        setKonijnResults([]) // Clear konijn results
        setMegalijstResults([]) // Clear megalijst results
        setRankingResults([]) // Clear ranking results
        setRawData([]) // Clear raw data
      } else if (tournament.format === 'snelschaak') {
        // Eén winnaar per klasse per jaar; automatische podia krijgen dezelfde klassenamen
        const processedSnelschaak = mergeKlasseHonors(processSnelschaakData(jsonData), honors, ['snelschaak', 'blitz'])
          .map((year) => ({
            ...year,
            klasses: year.klasses.map((k) => ({ ...k, klasse: toSnelschaakKlasse(k.klasse) })),
          }))
        setKlasseResults(processedSnelschaak)
        setRawData([]) // Clear raw data
        setResults([]) // Clear simple results
      } else if (tournament.format === 'klasses') {
        const processedKlasseResults = mergeKlasseHonors(processKlasseData(jsonData), honors, ['lente'])
        setKlasseResults(processedKlasseResults)
        setRawData([]) // Clear raw data
        setResults([]) // Clear simple results
      } else if (tournament.format === 'zomer') {
        // Process zomer format
        const processedZomerResults = processZomerData(jsonData)
        setResults(mergeSimpleHonors(processedZomerResults, honors, ['zomer']))
        setKlasseResults([]) // Clear klasse results
        setRawData([]) // Clear raw data
      } else {
        // Process simple format
        const processedResults = processSimpleData(jsonData)
        setResults(mergeSimpleHonors(processedResults, honors, ['herfst']))
        setKlasseResults([]) // Clear klasse results
      }
    } catch (error) {
      console.error('Error loading Excel data:', error)
      setResults([]) // Set empty results on error
      setKlasseResults([])
    } finally {
      setLoading(false)
    }
  }

  const prijzenPerSpeler: Record<string, PrijzenTelling> = {}

  const telPrijs = (cel: string | undefined, prijs: keyof PrijzenTelling) => {
    for (const speler of splitWinners(cel)) {
      prijzenPerSpeler[speler] = prijzenPerSpeler[speler] || { goud: 0, zilver: 0, brons: 0, ratingprijs: 0 }
      prijzenPerSpeler[speler][prijs]++
    }
  }
  results.forEach(({ eerste, tweede, derde, ratingprijs }) => {
    telPrijs(eerste, 'goud')
    telPrijs(tweede, 'zilver')
    telPrijs(derde, 'brons')
    telPrijs(ratingprijs, 'ratingprijs')
  })

  const spelersGesorteerd = Object.entries(prijzenPerSpeler)
    .filter(([, telling]) => (telling.goud + telling.zilver + telling.brons) >= 2)
    .sort((a, b) => {
      const totalA = a[1].goud + a[1].zilver + a[1].brons + a[1].ratingprijs
      const totalB = b[1].goud + b[1].zilver + b[1].brons + b[1].ratingprijs
      return totalB - totalA
    })

  // Meervoudige winnaars (alleen titels/1ste plaatsen), geteld per individuele speler
  const meervoudigeTitels: TitelRij[] =
    currentFormat === 'zomer' ? meervoudigeWinnaars(results.map((r) => r.eerste)) : []

  // Snelschaak: meervoudige winnaars per klasse
  const snelschaakWinnaar = (year: KlasseResult, klasse: string) =>
    year.klasses.find((k) => k.klasse === klasse)?.eerste
  const snelschaakKlassen =
    currentFormat === 'snelschaak'
      ? SNELSCHAAK_KLASSEN.filter((klasse) => klasseResults.some((y) => snelschaakWinnaar(y, klasse)))
      : []
  const meervoudigePerKlasse = snelschaakKlassen
    .map((klasse) => ({
      klasse,
      rijen: meervoudigeWinnaars(klasseResults.map((y) => snelschaakWinnaar(y, klasse))),
    }))
    .filter(({ rijen }) => rijen.length > 0)

  // Meervoudige winnaars: gedeelde sectie-look, twee mogelijke kolomsets
  const meervoudigeWinnaarsHeading = (
    <h2 className="text-sm font-bold mb-1.5 flex items-center space-x-2 text-gray-800">
      <Medal size={16} className="text-mainAccent" /> <span>Meervoudige Winnaars</span>
    </h2>
  )

  const meervoudigeTitelsSection = meervoudigeTitels.length > 0 ? (
    <div className="mt-3">
      {meervoudigeWinnaarsHeading}
      <ErelijstTable
        columns={[
          { header: "Speler", emphasize: true, width: "70%", render: ([speler]: TitelRij) => createClickableName(speler) },
          { header: "🥇 Titels", align: 'center', render: ([, aantal]: TitelRij) => <span className="font-bold">{aantal}</span> },
        ]}
        rows={meervoudigeTitels}
        keyFn={([speler]) => speler}
      />
    </div>
  ) : null

  const meervoudigePerKlasseSection = meervoudigePerKlasse.length > 0 ? (
    <div className="mt-3">
      <h2 className="text-sm font-bold mb-1.5 flex items-center space-x-2 text-gray-800">
        <Medal size={16} className="text-mainAccent" /> <span>Meervoudige Winnaars per klasse</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 items-start">
        {meervoudigePerKlasse.map(({ klasse, rijen }) => (
          <ErelijstSection key={klasse} title={klasse}>
            <ErelijstTable
              columns={[
                { header: "Speler", emphasize: true, width: "70%", render: ([speler]: TitelRij) => createClickableName(speler) },
                { header: "🥇 Titels", align: 'center', render: ([, aantal]: TitelRij) => <span className="font-bold">{aantal}</span> },
              ]}
              rows={rijen}
              keyFn={([speler]) => speler}
            />
          </ErelijstSection>
        ))}
      </div>
    </div>
  ) : null

  const meervoudigeGoudZilverBronsSection = spelersGesorteerd.length > 0 ? (
    <div className="mt-3">
      {meervoudigeWinnaarsHeading}
      <ErelijstTable
        columns={[
          { header: "Speler", emphasize: true, width: "35%", render: ([speler]: [string, PrijzenTelling]) => createClickableName(speler) },
          { header: "🥇", align: 'center', render: ([, t]: [string, PrijzenTelling]) => t.goud },
          { header: "🥈", align: 'center', render: ([, t]: [string, PrijzenTelling]) => t.zilver },
          { header: "🥉", align: 'center', render: ([, t]: [string, PrijzenTelling]) => t.brons },
          { header: "🏅", align: 'center', render: ([, t]: [string, PrijzenTelling]) => t.ratingprijs },
          { header: "Totaal", align: 'center', render: ([, t]: [string, PrijzenTelling]) => <span className="font-bold">{t.goud + t.zilver + t.brons + t.ratingprijs}</span> },
        ]}
        rows={spelersGesorteerd}
        keyFn={([speler]) => speler}
      />
    </div>
  ) : null

  const isEmpty =
    currentFormat === 'simple' || currentFormat === 'zomer' ? results.length === 0
      : currentFormat === 'quiz' ? quizResults.length === 0
      : currentFormat === 'konijn' ? konijnResults.length === 0
      : currentFormat === 'megalijst' ? megalijstResults.length === 0
      : currentFormat === 'ranking' ? rankingResults.length === 0
      : currentFormat === 'records' ? recordResults.length === 0
      : klasseResults.length === 0

  if (!tournament) {
    return (
      <main className="container mx-auto px-3 py-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <Trophy className="mx-auto text-gray-400 mb-2" size={28} />
          <p className="text-sm text-gray-600 mb-3">Deze erelijst bestaat niet.</p>
          <Link href="/erelijsten" className="text-sm font-medium text-mainAccent hover:underline">
            Terug naar alle erelijsten
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-3 py-4">
      <Link
        href="/erelijsten"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-mainAccent transition-colors mb-2"
      >
        <ArrowLeft size={14} />
        Alle erelijsten
      </Link>

      {selectedTournament && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-3 py-2">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Crown className="text-yellow-300" size={18} />
              <span>{selectedTournament}</span>
            </h2>
          </div>

          <div className="p-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-mainAccent"></div>
                  <div className="text-xs text-gray-600">Laden...</div>
                </div>
              </div>
            ) : isEmpty ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Trophy className="mx-auto text-gray-400 mb-2" size={28} />
                  <div className="text-xs text-gray-500">Geen data gevonden voor dit toernooi</div>
                </div>
              </div>
            ) : currentFormat === 'quiz' ? (
              <ErelijstTable
                columns={[
                  colYear,
                  { header: "🏆 Ploeg", render: (r: QuizResult) => r.ploeg || "-" },
                  { header: "👥 Leden", render: (r: QuizResult) => r.leden || "-" },
                ]}
                rows={quizResults}
                keyFn={(r) => r.jaar}
              />
            ) : currentFormat === 'konijn' ? (
              <ErelijstTable
                columns={[
                  colYear,
                  { header: "🏆 Winnaar", render: (r: KonijnResult) => createClickableName(r.winnaar || "-") },
                ]}
                rows={konijnResults}
                keyFn={(r) => r.jaar}
              />
            ) : currentFormat === 'megalijst' ? (
              <ErelijstTable
                columns={[
                  colYear,
                  colGoud<Result>((r) => r.eerste),
                  colZilver<Result>((r) => r.tweede),
                  colBrons<Result>((r) => r.derde),
                ]}
                rows={megalijstResults}
                keyFn={(r) => r.jaar}
              />
            ) : currentFormat === 'ranking' ? (
              <ErelijstSectionList>
                {['Eerste Klasse', 'Tweede Klasse', 'Derde Klasse', 'Vierde Klasse', 'Vijfde Klasse'].map((klasseNaam, klasseIndex) => {
                  const klasseRows = rankingResults
                    .filter(r => r.klasses[klasseIndex].eerste > 0)
                    .sort((a, b) => {
                      const aData = a.klasses[klasseIndex]
                      const bData = b.klasses[klasseIndex]
                      if (bData.eerste !== aData.eerste) return bData.eerste - aData.eerste
                      if (bData.tweede !== aData.tweede) return bData.tweede - aData.tweede
                      return bData.derde - aData.derde
                    })
                  return (
                    <ErelijstSection key={klasseNaam} title={klasseNaam}>
                      <ErelijstTable
                        columns={[
                          { header: "Speler", emphasize: true, width: "40%", render: (r: RankingResult) => createClickableName(r.speler) },
                          { header: "🥇", align: 'center', render: (r: RankingResult) => <span className="text-green-600 font-semibold">{r.klasses[klasseIndex].eerste}</span> },
                          { header: "🥈", align: 'center', render: (r: RankingResult) => <span className="text-gray-600 font-semibold">{r.klasses[klasseIndex].tweede}</span> },
                          { header: "🥉", align: 'center', render: (r: RankingResult) => <span className="text-yellow-600 font-semibold">{r.klasses[klasseIndex].derde}</span> },
                        ]}
                        rows={klasseRows}
                        keyFn={(r) => r.speler}
                      />
                    </ErelijstSection>
                  )
                })}
              </ErelijstSectionList>
            ) : currentFormat === 'records' ? (
              <ErelijstSectionList>
                {recordResults.map((record, index) => (
                  <ErelijstSection key={index} title={record.titel}>
                    <ErelijstTable
                      columns={[
                        colYear,
                        { header: "🏆 Winnaar", render: (e: { jaar: number; winnaar: string }) => createClickableName(e.winnaar) },
                      ]}
                      rows={[...record.entries].sort((a, b) => a.jaar - b.jaar)}
                      keyFn={(e, i) => `${e.jaar}-${i}`}
                    />
                  </ErelijstSection>
                ))}
              </ErelijstSectionList>
            ) : currentFormat === 'snelschaak' ? (
              <>
                <ErelijstTable
                  columns={[
                    colYear,
                    ...snelschaakKlassen.map((klasse): ErelijstColumn<KlasseResult> => ({
                      header: klasse,
                      render: (y) => createClickableName(snelschaakWinnaar(y, klasse) || "-"),
                    })),
                  ]}
                  rows={klasseResults}
                  keyFn={(y) => y.jaar}
                />
                {meervoudigePerKlasseSection}
              </>
            ) : currentFormat === 'klasses' ? (
              <>
                <ErelijstSectionList>
                  {klasseResults.map((yearData) => (
                    <ErelijstSection key={yearData.jaar} title={yearData.jaar}>
                      <ErelijstTable
                        columns={[
                          { header: "Klasse", emphasize: true, width: "32%", render: (k: KlasseResult['klasses'][number]) => k.klasse },
                          colGoud<KlasseResult['klasses'][number]>((k) => k.eerste),
                          colZilver<KlasseResult['klasses'][number]>((k) => k.tweede),
                          colBrons<KlasseResult['klasses'][number]>((k) => k.derde),
                        ]}
                        rows={yearData.klasses}
                        keyFn={(k) => k.klasse}
                      />
                    </ErelijstSection>
                  ))}
                </ErelijstSectionList>
              </>
            ) : currentFormat === 'zomer' ? (
              <>
                <ErelijstTable
                  columns={[
                    colYear,
                    { header: "🏆 Winnaar", render: (r: Result) => createClickableName(r.eerste || "-") },
                  ]}
                  rows={results}
                  keyFn={(r) => r.jaar}
                />
                {meervoudigeTitelsSection}
              </>
            ) : (
              // simple format
              <>
                <ErelijstTable
                  columns={[
                    colYear,
                    colGoud<Result>((r) => r.eerste),
                    colZilver<Result>((r) => r.tweede),
                    colBrons<Result>((r) => r.derde),
                    { header: "🏅", render: (r: Result) => createClickableName(r.ratingprijs || "-") },
                  ]}
                  rows={results}
                  keyFn={(r) => r.jaar}
                />
                {meervoudigeGoudZilverBronsSection}
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

"use client"

import { Crown, Medal, Trophy } from "lucide-react"
import { useEffect, useState } from "react"
import Link from 'next/link'
import useSWR from "swr"
import { getAllHonors } from "../api/index"

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
  type Result,
  type KlasseResult,
  type QuizResult,
  type KonijnResult,
  type RankingResult,
  type RecordResult,
} from "../../lib/erelijsten"

// Helper function to create URL-friendly names
const createUrlFriendlyName = (voornaam: string, achternaam: string): string => {
  return `${voornaam}_${achternaam}`.replace(/\s+/g, '_')
}

const createClickableName = (name: string) => {
  const displayName = cleanPlayerName(name)
  if (!displayName || displayName === '-') {
    return <span className="text-gray-500">{displayName || '-'}</span>
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

export default function ErelijstenPage() {
  const [results, setResults] = useState<Result[]>([])
  const [klasseResults, setKlasseResults] = useState<KlasseResult[]>([])
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [konijnResults, setKonijnResults] = useState<KonijnResult[]>([])
  const [megalijstResults, setMegalijstResults] = useState<Result[]>([])
  const [rankingResults, setRankingResults] = useState<RankingResult[]>([])
  const [recordResults, setRecordResults] = useState<RecordResult[]>([])
  const [rawData, setRawData] = useState<any[]>([])
  const [selectedTournament, setSelectedTournament] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [currentFormat, setCurrentFormat] = useState<'simple' | 'klasses' | 'zomer' | 'quiz' | 'konijn' | 'megalijst' | 'ranking' | 'records'>('simple')

  // Automatisch vastgelegde podia van afgesloten toernooien
  // (geen `= []` default: een nieuwe array per render zou de effect-dependency
  // hieronder blijven triggeren)
  const { data: honorsData } = useSWR<HonorTournament[]>("honors", getAllHonors, {
    revalidateOnFocus: false,
  })
  const honors = honorsData ?? EMPTY_HONORS

  useEffect(() => {
    if (selectedTournament) {
      loadExcelData(selectedTournament)
    }
    // Herlaad wanneer de automatische podia binnenkomen zodat ze meegenomen worden
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTournament, honorsData])

  const loadExcelData = async (tournamentName: string) => {
    setLoading(true)
    try {
      const tournament = EXCEL_FILES.find(t => t.name === tournamentName)
      if (!tournament) {
        return
      }

      const jsonData = await fetchErelijstRows(tournament.file)

      setCurrentFormat(tournament.format as 'simple' | 'klasses' | 'zomer' | 'quiz' | 'konijn' | 'megalijst' | 'ranking' | 'records')
      
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
      } else if (tournament.format === 'klasses') {
        // Process klasses format - check if it's snelschaak or lentekampioenschap
        let processedKlasseResults
        if (tournament.name === 'Snelschaak') {
          processedKlasseResults = processSnelschaakData(jsonData)
          processedKlasseResults = mergeKlasseHonors(processedKlasseResults, honors, ['snelschaak', 'blitz'])
        } else {
          processedKlasseResults = processKlasseData(jsonData)
          processedKlasseResults = mergeKlasseHonors(processedKlasseResults, honors, ['lente'])
        }
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

  results.forEach(({ eerste, tweede, derde, ratingprijs }) => {
    if (eerste) {
      prijzenPerSpeler[eerste] = prijzenPerSpeler[eerste] || { goud: 0, zilver: 0, brons: 0, ratingprijs: 0 }
      prijzenPerSpeler[eerste].goud++
    }
    if (tweede) {
      prijzenPerSpeler[tweede] = prijzenPerSpeler[tweede] || { goud: 0, zilver: 0, brons: 0, ratingprijs: 0 }
      prijzenPerSpeler[tweede].zilver++
    }
    if (derde) {
      prijzenPerSpeler[derde] = prijzenPerSpeler[derde] || { goud: 0, zilver: 0, brons: 0, ratingprijs: 0 }
      prijzenPerSpeler[derde].brons++
    }
    if (ratingprijs) {
      prijzenPerSpeler[ratingprijs] = prijzenPerSpeler[ratingprijs] || { goud: 0, zilver: 0, brons: 0, ratingprijs: 0 }
      prijzenPerSpeler[ratingprijs].ratingprijs++
    }
  })

  const spelersGesorteerd = Object.entries(prijzenPerSpeler).sort((a, b) => {
    const totalA = a[1].goud + a[1].zilver + a[1].brons + a[1].ratingprijs
    const totalB = b[1].goud + b[1].zilver + b[1].brons + b[1].ratingprijs
    return totalB - totalA
  })

  // Meervoudige winnaars voor zomertoernooi en snelschaak (alleen titels/1ste plaatsen)
  const titelsPerSpeler: Record<string, number> = {}
  if (currentFormat === 'zomer') {
    results.forEach(({ eerste }) => {
      if (eerste) titelsPerSpeler[eerste] = (titelsPerSpeler[eerste] || 0) + 1
    })
  } else if (currentFormat === 'klasses' && selectedTournament === 'Snelschaak') {
    klasseResults.forEach(({ klasses }) =>
      klasses.forEach(({ eerste }) => {
        if (eerste) titelsPerSpeler[eerste] = (titelsPerSpeler[eerste] || 0) + 1
      }),
    )
  }
  const meervoudigeTitels = Object.entries(titelsPerSpeler)
    .filter(([, aantal]) => aantal >= 2)
    .sort((a, b) => b[1] - a[1])

  const meervoudigeWinnaarsSection = meervoudigeTitels.length > 0 ? (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
        <Medal /> <span>Meervoudige Winnaars</span>
      </h2>
      <div className="overflow-auto">
        <table className="min-w-full text-sm border border-gray-300">
          <thead className="bg-neutral-100 text-left">
            <tr>
              <th className="p-2 border">Speler</th>
              <th className="p-2 border">🥇 Titels</th>
            </tr>
          </thead>
          <tbody>
            {meervoudigeTitels.map(([speler, aantal]) => (
              <tr key={speler} className="even:bg-neutral-50">
                <td className="p-2 border">{createClickableName(speler)}</td>
                <td className="p-2 border font-bold">{aantal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ) : null

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center justify-center space-x-2 text-gray-800">
          <Trophy className="text-yellow-500" size={24} /> 
          <span>Erelijsten</span>
      </h1>
        <p className="text-gray-600 text-sm">Ontdek de geschiedenis van onze toernooien</p>
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <label htmlFor="tournament-select" className="block text-sm font-semibold text-gray-800 mb-2">
            🏆 Selecteer een toernooi
          </label>
          <div className="flex gap-2 items-center">
            <select
              id="tournament-select"
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-mainAccent focus:border-mainAccent text-sm bg-white"
            >
              <option value="">Kies een toernooi om te bekijken...</option>
              {EXCEL_FILES.map((tournament) => (
                <option key={tournament.name} value={tournament.name}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedTournament && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Crown className="text-yellow-300" size={20} /> 
              <span>{selectedTournament}</span>
            </h2>
          </div>
          
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-mainAccent"></div>
                  <div className="text-sm text-gray-600">Laden...</div>
                </div>
              </div>
            ) : (currentFormat === 'simple' || currentFormat === 'zomer' ? results.length === 0 : currentFormat === 'quiz' ? quizResults.length === 0 : currentFormat === 'konijn' ? konijnResults.length === 0 : currentFormat === 'megalijst' ? megalijstResults.length === 0 : currentFormat === 'ranking' ? rankingResults.length === 0 : currentFormat === 'records' ? recordResults.length === 0 : klasseResults.length === 0) ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Trophy className="mx-auto text-gray-400 mb-2" size={32} />
                  <div className="text-sm text-gray-500">Geen data gevonden voor dit toernooi</div>
                </div>
              </div>
          ) : currentFormat === 'quiz' ? (
            // Render quiz format
            <div className="overflow-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Jaar</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">🏆 Ploeg</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">👥 Leden</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quizResults.map((r, index) => (
                    <tr key={r.jaar} className={index % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-mainAccent/10 transition-colors"}>
                      <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900">{r.jaar}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">{r.ploeg || "-"}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">{r.leden || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : currentFormat === 'konijn' ? (
            // Render konijn format
            <div className="overflow-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Jaar</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">🏆 Winnaar</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {konijnResults.map((r, index) => (
                    <tr key={r.jaar} className={index % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-mainAccent/10 transition-colors"}>
                      <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900">{r.jaar}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">{createClickableName(r.winnaar || "-")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : currentFormat === 'megalijst' ? (
            // Render megalijst format
            <div className="overflow-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Jaar</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">🥇 Eerste Plaats</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">🥈 Tweede Plaats</th>
                    <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">🥉 Derde Plaats</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {megalijstResults.map((r, index) => (
                    <tr key={r.jaar} className={index % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-mainAccent/10 transition-colors"}>
                      <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900">{r.jaar}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">{createClickableName(r.eerste || "-")}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">{createClickableName(r.tweede || "-")}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">{createClickableName(r.derde || "-")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : currentFormat === 'ranking' ? (
            // Render ranking format per klasse
            <div className="space-y-8">
              {['Eerste Klasse', 'Tweede Klasse', 'Derde Klasse', 'Vierde Klasse', 'Vijfde Klasse'].map((klasseNaam, klasseIndex) => (
                <div key={klasseNaam} className="border border-gray-300 rounded-lg overflow-hidden">
                  <div className="bg-neutral-100 px-4 py-2 border-b border-gray-300">
                    <h3 className="text-lg font-semibold">{klasseNaam}</h3>
                  </div>
                  <div className="overflow-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50 text-left">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Speler</th>
                          <th className="p-2 border text-center">🥇 1ste Plaats</th>
                          <th className="p-2 border text-center">🥈 2de Plaats</th>
                          <th className="p-2 border text-center">🥉 3de Plaats</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rankingResults
                          .filter(r => r.klasses[klasseIndex].eerste > 0) // Only show players with at least 1 gold
                          .sort((a, b) => {
                            const aData = a.klasses[klasseIndex]
                            const bData = b.klasses[klasseIndex]
                            
                            // Sort by goud (eerste) first, then zilver (tweede), then brons (derde)
                            if (bData.eerste !== aData.eerste) {
                              return bData.eerste - aData.eerste // Most gold first
                            }
                            if (bData.tweede !== aData.tweede) {
                              return bData.tweede - aData.tweede // Most silver second
                            }
                            return bData.derde - aData.derde // Most bronze third
                          })
                          .map((r, index) => {
                            const klasseData = r.klasses[klasseIndex]
                            return (
                              <tr key={index} className="even:bg-neutral-50">
                                <td className="p-2 border font-medium">{createClickableName(r.speler)}</td>
                                <td className="p-2 border text-center">
                                  <span className="text-green-600 font-semibold">{klasseData.eerste}</span>
                                </td>
                                <td className="p-2 border text-center">
                                  <span className="text-gray-600 font-semibold">{klasseData.tweede}</span>
                                </td>
                                <td className="p-2 border text-center">
                                  <span className="text-orange-600 font-semibold">{klasseData.derde}</span>
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : currentFormat === 'records' ? (
            // Render records format
            <div className="space-y-4">
              {recordResults.map((record, index) => (
                <div key={index} className="border border-gray-300 rounded-lg overflow-hidden">
                  <div className="bg-neutral-100 px-3 py-2 border-b border-gray-300">
                    <h3 className="text-xs font-semibold">{record.titel}</h3>
                  </div>
                  <div className="overflow-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50 text-left">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Jaar</th>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">🏆 Winnaar</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {record.entries
                          .sort((a, b) => a.jaar - b.jaar) // Sort by year (oldest first)
                          .map((entry, entryIndex) => (
                            <tr key={entryIndex} className="even:bg-neutral-50">
                              <td className="p-2 border font-medium">{entry.jaar}</td>
                                <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">{createClickableName(entry.winnaar)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : currentFormat === 'klasses' ? (
            // Render klasses format with correct data
            <>
            <div className="space-y-8">
              {klasseResults.map((yearData, yearIndex) => (
                <div key={yearData.jaar} className="border border-gray-300 rounded-lg overflow-hidden">
                  <div className="bg-neutral-100 px-4 py-2 border-b border-gray-300">
                    <h3 className="text-lg font-bold">{yearData.jaar}</h3>
                  </div>
                  <div className="overflow-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3 border-r border-gray-300 text-left">Klasse</th>
                          <th className="p-3 border-r border-gray-300 text-center">🥇 1e plaats</th>
                          <th className="p-3 border-r border-gray-300 text-center">🥈 2e plaats</th>
                          <th className="p-3 text-center">🥉 3e plaats</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {yearData.klasses.map((klasse, klasseIndex) => (
                          <tr key={klasseIndex} className={klasseIndex % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-mainAccent/10 transition-colors"}>
                            <td className="p-3 border-r border-gray-300 font-medium">{klasse.klasse}</td>
                            <td className="p-3 border-r border-gray-300 text-center">{createClickableName(klasse.eerste || "-")}</td>
                            <td className="p-3 border-r border-gray-300 text-center">{createClickableName(klasse.tweede || "-")}</td>
                            <td className="p-3 text-center">{createClickableName(klasse.derde || "-")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            {meervoudigeWinnaarsSection}
            </>
          ) : currentFormat === 'zomer' ? (
            // Render zomer format (only winners)
            <>
              <div className="overflow-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Jaar</th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">🏆 Winnaar</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((r, index) => (
                      <tr key={r.jaar} className={index % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-mainAccent/10 transition-colors"}>
                        <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900">{r.jaar}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">{createClickableName(r.eerste || "-")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {meervoudigeWinnaarsSection}
            </>
          ) : (
            // Render simple format
            <>
      <div className="overflow-auto mb-12">
        <table className="min-w-full text-sm border border-gray-300">
          <thead className="bg-neutral-100 text-left">
            <tr>
              <th className="p-2 border">Jaar</th>
              <th className="p-2 border">🥇 1e plaats</th>
              <th className="p-2 border">🥈 2e plaats</th>
              <th className="p-2 border">🥉 3e plaats</th>
              <th className="p-2 border">🏅 Ratingprijs</th>
            </tr>
          </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((r, index) => (
                    <tr key={r.jaar} className={index % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-mainAccent/10 transition-colors"}>
                      <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-900">{r.jaar}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">{createClickableName(r.eerste || "-")}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">{createClickableName(r.tweede || "-")}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">{createClickableName(r.derde || "-")}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">{createClickableName(r.ratingprijs || "-")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

              {spelersGesorteerd.filter(([_, telling]) => (telling.goud + telling.zilver + telling.brons) >= 2).length > 0 && (
                <>
      <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
        <Medal /> <span>Meervoudige Winnaars</span>
      </h2>
      <div className="overflow-auto">
        <table className="min-w-full text-sm border border-gray-300">
          <thead className="bg-neutral-100 text-left">
            <tr>
              <th className="p-2 border">Speler</th>
              <th className="p-2 border">🥇 Goud</th>
              <th className="p-2 border">🥈 Zilver</th>
              <th className="p-2 border">🥉 Brons</th>
              <th className="p-2 border">🏅 Ratingprijs</th>
              <th className="p-2 border">Totaal</th>
            </tr>
          </thead>
          <tbody>
            {spelersGesorteerd
                .filter(([_, telling]) =>
                (telling.goud + telling.zilver + telling.brons) >= 2
                )
                .map(([speler, telling]) => (
                <tr key={speler} className="even:bg-neutral-50">
                    <td className="p-2 border">{createClickableName(speler)}</td>
                    <td className="p-2 border">{telling.goud}</td>
                    <td className="p-2 border">{telling.zilver}</td>
                    <td className="p-2 border">{telling.brons}</td>
                    <td className="p-2 border">{telling.ratingprijs}</td>
                    <td className="p-2 border font-bold">
                    {telling.goud + telling.zilver + telling.brons + telling.ratingprijs}
                    </td>
                </tr>
                ))}
           </tbody>
        </table>
      </div>
                </>
              )}
            </>
          )}
          </div>
        </div>
      )}
    </main>
  )
}
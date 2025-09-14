"use client"

import { Crown, Medal, Trophy } from "lucide-react"
import { useEffect, useState } from "react"
import * as XLSX from 'xlsx'
import Link from 'next/link'

// Helper function to create URL-friendly names
const createUrlFriendlyName = (voornaam: string, achternaam: string): string => {
  return `${voornaam}_${achternaam}`.replace(/\s+/g, '_')
}

// Helper function to create clickable name links
const createClickableName = (name: string) => {
  if (!name || name.trim() === '' || name === '-') {
    return <span className="text-gray-500">{name || '-'}</span>
  }
  
  // Split name into first and last name
  const nameParts = name.trim().split(' ')
  if (nameParts.length < 2) {
    return <span className="text-gray-700">{name}</span>
  }
  
  const voornaam = nameParts[0]
  const achternaam = nameParts.slice(1).join(' ')
  const profileUrl = `/profile/${createUrlFriendlyName(voornaam, achternaam)}`
  
  return (
    <Link 
      href={profileUrl}
      className="text-gray-900 hover:text-mainAccent hover:underline transition-colors cursor-pointer"
    >
      {name}
    </Link>
  )
}

interface Result {
  jaar: number
  eerste?: string
  tweede?: string
  derde?: string
  ratingprijs?: string
}

interface KlasseResult {
  jaar: number
  klasses: {
    klasse: string
    eerste: string
    tweede: string
    derde: string
  }[]
}

interface QuizResult {
  jaar: number
  ploeg: string
  leden: string
}

interface KonijnResult {
  jaar: number
  winnaar: string
}

interface RankingResult {
  speler: string
  klasses: {
    klasse: string
    eerste: number
    tweede: number
    derde: number
  }[]
}

interface RecordResult {
  titel: string
  entries: {
    jaar: number
    winnaar: string
  }[]
}

interface PrijzenTelling {
  goud: number
  zilver: number
  brons: number
  ratingprijs: number
}

const EXCEL_FILES = [
  { name: 'Herfstkampioenschap', file: 'herfst.xlsx', format: 'simple' },
  { name: 'Lentekampioenschap', file: 'lente.xlsx', format: 'klasses' },
  { name: 'Zomertoernooi', file: 'zomer.xlsx', format: 'zomer' },
  { name: 'Snelschaak', file: 'snelschaak.xlsx', format: 'klasses' },
  { name: 'Quiz', file: 'quiz.xlsx', format: 'quiz' },
  { name: 'Konijn', file: 'konijn.xlsx', format: 'konijn' },
  { name: 'Megalijst', file: 'Megalijst.xlsx', format: 'megalijst' },
  { name: 'Ranking', file: 'Ranking.xlsx', format: 'ranking' },
  { name: 'Records', file: 'Records.xlsx', format: 'records' }
]

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

  useEffect(() => {
    if (selectedTournament) {
      loadExcelData(selectedTournament)
    }
  }, [selectedTournament])

  // Test function to check if files are accessible
  useEffect(() => {
    const testFileAccess = async () => {
      try {
        const response = await fetch('/data/erelijsten/herfst.xlsx')
        console.log('File access test:', response.status, response.ok)
      } catch (error) {
        console.error('File access error:', error)
      }
    }
    testFileAccess()
  }, [])

  const loadExcelData = async (tournamentName: string) => {
    setLoading(true)
    try {
      const tournament = EXCEL_FILES.find(t => t.name === tournamentName)
      if (!tournament) {
        console.error('Tournament not found:', tournamentName)
        return
      }

      console.log('Loading tournament:', tournament.file, 'Format:', tournament.format)
      const response = await fetch(`/data/erelijsten/${tournament.file}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${tournament.file}: ${response.status}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      console.log('Workbook sheets:', workbook.SheetNames)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      console.log('Raw data:', jsonData.slice(0, 10)) // Log first 10 rows
      
      setCurrentFormat(tournament.format as 'simple' | 'klasses' | 'zomer' | 'quiz' | 'konijn' | 'megalijst' | 'ranking' | 'records')
      
      if (tournament.format === 'quiz') {
        // Process quiz format
        const processedQuizResults = processQuizData(jsonData)
        console.log('Processed quiz results:', processedQuizResults)
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
        console.log('Processed konijn results:', processedKonijnResults)
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
        console.log('Processed megalijst results:', processedMegalijstResults)
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
        console.log('Processed ranking results:', processedRankingResults)
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
        console.log('Processed records results:', processedRecordResults)
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
        } else {
          processedKlasseResults = processKlasseData(jsonData)
        }
        console.log('Processed klasse results:', processedKlasseResults)
        setKlasseResults(processedKlasseResults)
        setRawData([]) // Clear raw data
        setResults([]) // Clear simple results
      } else if (tournament.format === 'zomer') {
        // Process zomer format
        const processedZomerResults = processZomerData(jsonData)
        console.log('Processed zomer results:', processedZomerResults)
        setResults(processedZomerResults)
        setKlasseResults([]) // Clear klasse results
        setRawData([]) // Clear raw data
      } else {
        // Process simple format
        const dataRows = jsonData.slice(2) // Skip first two rows (headers)
        
        const processedResults: Result[] = []
        
        for (const row of dataRows) {
          // Skip empty rows
          if (!row || !Array.isArray(row) || row.length === 0 || !row[0]) {
            continue
          }
          
          const jaar = row[0]
          if (typeof jaar !== 'number') {
            continue
          }
          
          processedResults.push({
            jaar: jaar,
            eerste: row[2] || '',
            tweede: row[4] || '',
            derde: row[6] || '',
            ratingprijs: row[8] || ''
          })
        }
        
        console.log('Processed results:', processedResults)
        setResults(processedResults)
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

  const processKlasseData = (jsonData: any[]): KlasseResult[] => {
    console.log('Processing klasse data with correct structure:', jsonData)
    
    const results: KlasseResult[] = []
    const klasseNames = ['1ste Klasse', '2de Klasse', '3de Klasse', '4de Klasse', '5de Klasse']
    
    // Process the data row by row
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.length === 0) continue
      
      // Check if this is a year row (has a year in first column)
      const jaar = row[0]
      if (typeof jaar === 'number' && jaar > 1900 && jaar < 2100) {
        console.log(`Processing year ${jaar}`)
        
        // This is a year row, collect the next 2 rows for this year
        const yearData: any[] = []
        
        // Add the current row (year + 1st places)
        yearData.push(row)
        
        // Add the next row (2nd places)
        if (i + 1 < jsonData.length) {
          yearData.push(jsonData[i + 1])
        }
        
        // Add the row after that (3rd places)
        if (i + 2 < jsonData.length) {
          yearData.push(jsonData[i + 2])
        }
        
        console.log(`Year ${jaar} has ${yearData.length} data rows:`, yearData)
        
        // Process the data for this year
        const klasses: any[] = []
        
        // For each klasse (columns 2, 4, 6, 8, 10 - the name columns, not the number columns)
        for (let k = 0; k < 5; k++) {
          const nameColIndex = 2 + (k * 2) // Columns 2, 4, 6, 8, 10 (the name columns)
          
          let eerste = ''
          let tweede = ''
          let derde = ''
          
          // Row 0: 1st places (names are in the name columns)
          if (yearData[0] && yearData[0][nameColIndex] && typeof yearData[0][nameColIndex] === 'string') {
            eerste = yearData[0][nameColIndex]
          }
          
          // Row 1: 2nd places (names are in the name columns)
          if (yearData[1] && yearData[1][nameColIndex] && typeof yearData[1][nameColIndex] === 'string') {
            tweede = yearData[1][nameColIndex]
          }
          
          // Row 2: 3rd places (names are in the name columns)
          if (yearData[2] && yearData[2][nameColIndex] && typeof yearData[2][nameColIndex] === 'string') {
            derde = yearData[2][nameColIndex]
          }
          
          // Only add klasse if it has any data
          if (eerste || tweede || derde) {
            klasses.push({
              klasse: klasseNames[k],
              eerste: eerste,
              tweede: tweede,
              derde: derde
            })
          }
        }
        
        if (klasses.length > 0) {
          results.push({
            jaar: jaar,
            klasses: klasses
          })
        }
        
        // Skip the next 2 rows since we've processed them
        i += 2
      }
    }
    
    console.log('Final processed results:', results)
    return results
  }

  const processZomerData = (jsonData: any[]): Result[] => {
    console.log('Processing zomer data, total rows:', jsonData.length)
    console.log('First 10 rows:', jsonData.slice(0, 10))
    
    const results: Result[] = []
    
    // Skip header row and process data rows
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.length === 0) {
        console.log(`Skipping empty row ${i}`)
        continue
      }
      
      console.log(`Processing row ${i}:`, row)
      
      // Check specific column pairs based on the actual data structure
      // First set: columns 0+1 (1960-2000)
      if (row[0] && row[1]) {
        const jaar = row[0]
        const winnaar = row[1]
        
        console.log(`  First set (0+1): jaar=${jaar} (${typeof jaar}), winnaar=${winnaar} (${typeof winnaar})`)
        
        if (typeof jaar === 'number' && jaar > 1900 && jaar < 2100 && winnaar && winnaar !== '') {
          results.push({
            jaar: jaar,
            eerste: winnaar,
            tweede: '',
            derde: '',
            ratingprijs: ''
          })
          console.log(`  -> FOUND FIRST SET: ${jaar} - ${winnaar}`)
        }
      }
      
      // Second set: columns 3+4 (2001-2025)
      if (row[3] && row[4]) {
        const jaar = row[3]
        const winnaar = row[4]
        
        console.log(`  Second set (3+4): jaar=${jaar} (${typeof jaar}), winnaar=${winnaar} (${typeof winnaar})`)
        
        if (typeof jaar === 'number' && jaar > 1900 && jaar < 2100 && winnaar && winnaar !== '') {
          results.push({
            jaar: jaar,
            eerste: winnaar,
            tweede: '',
            derde: '',
            ratingprijs: ''
          })
          console.log(`  -> FOUND SECOND SET: ${jaar} - ${winnaar}`)
        } else {
          console.log(`  -> SKIPPED SECOND SET: jaar=${jaar} (valid: ${typeof jaar === 'number' && jaar > 1900 && jaar < 2100}), winnaar=${winnaar} (valid: ${winnaar && winnaar !== ''})`)
        }
      }
    }
    
    // Sort by year (oldest first, newest last)
    results.sort((a, b) => a.jaar - b.jaar)
    
    console.log('Final zomer results:', results)
    return results
  }

  const processSnelschaakData = (jsonData: any[]): KlasseResult[] => {
    console.log('Processing snelschaak data:', jsonData)
    
    const results: KlasseResult[] = []
    const klasseNames = ['1ste Klasse', '2de Klasse', '3de Klasse', '4de Klasse', '5de Klasse']
    
    // Skip header row and process data rows
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.length === 0) continue
      
      // Check if this row has a year in the first column
      const jaar = row[0]
      if (typeof jaar === 'number' && jaar > 1900 && jaar < 2100) {
        console.log(`Processing snelschaak year ${jaar}:`, row)
        
        const klasses: any[] = []
        
        // Process each klasse based on the actual Excel structure
        // Kolom C (index 2): Eerste Klasse
        // Kolom F (index 5): Tweede Klasse  
        // Kolom I (index 8): Derde Klasse
        // Kolom L (index 11): Vierde Klasse
        const klasseColumns = [2, 5, 8, 11] // C, F, I, L
        
        for (let k = 0; k < klasseColumns.length; k++) {
          const klasseColIndex = klasseColumns[k]
          const winnaar = row[klasseColIndex]
          
          console.log(`  Checking ${klasseNames[k]} (kolom ${klasseColIndex}): "${winnaar}" (type: ${typeof winnaar})`)
          
          if (winnaar && winnaar !== '') {
            klasses.push({
              klasse: klasseNames[k],
              eerste: winnaar,
              tweede: '',
              derde: ''
            })
            console.log(`  -> FOUND: ${klasseNames[k]}: ${winnaar}`)
          } else {
            console.log(`  -> SKIPPED: ${klasseNames[k]} (empty or null)`)
          }
        }
        
        if (klasses.length > 0) {
          results.push({
            jaar: jaar,
            klasses: klasses
          })
        }
      }
    }
    
    // Sort by year (oldest first, newest last)
    results.sort((a, b) => a.jaar - b.jaar)
    
    console.log('Final snelschaak results:', results)
    return results
  }

  const processQuizData = (jsonData: any[]): QuizResult[] => {
    console.log('Processing quiz data:', jsonData)
    
    const results: QuizResult[] = []
    
    // Skip header row and process data rows
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.length === 0) continue
      
      // Check if this row has a year in the first column
      const jaar = row[0]
      if (typeof jaar === 'number' && jaar > 1900 && jaar < 2100) {
        const ploeg = row[1] || ''
        const leden = row[2] || ''
        
        console.log(`Processing quiz year ${jaar}: ploeg="${ploeg}", leden="${leden}"`)
        
        if (ploeg || leden) {
          results.push({
            jaar: jaar,
            ploeg: ploeg,
            leden: leden
          })
        }
      }
    }
    
    // Sort by year (oldest first, newest last)
    results.sort((a, b) => a.jaar - b.jaar)
    
    console.log('Final quiz results:', results)
    return results
  }

  const processKonijnData = (jsonData: any[]): KonijnResult[] => {
    console.log('Processing konijn data:', jsonData)
    
    const results: KonijnResult[] = []
    
    // Skip header row and process data rows
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.length === 0) continue
      
      // Check if this row has a year in the first column
      const jaar = row[0]
      if (typeof jaar === 'number' && jaar > 1900 && jaar < 2100) {
        const winnaar = row[1] || ''
        
        console.log(`Processing konijn year ${jaar}: winnaar="${winnaar}"`)
        
        if (winnaar) {
          results.push({
            jaar: jaar,
            winnaar: winnaar
          })
        }
      }
    }
    
    // Sort by year (oldest first, newest last)
    results.sort((a, b) => a.jaar - b.jaar)
    
    console.log('Final konijn results:', results)
    return results
  }

  const processMegalijstData = (jsonData: any[]): Result[] => {
    console.log('Processing megalijst data:', jsonData)
    
    const results: Result[] = []
    
    // Skip header row and process data rows
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.length === 0) continue
      
      // Check if this row has a year in the first column
      const jaar = row[0]
      if (typeof jaar === 'number' && jaar > 1900 && jaar < 2100) {
        // Kolommen: Jaar, /, Eerste Plaats, /, Tweede Plaats, /, Derde Plaats
        // Dus indices: 0, 1, 2, 3, 4, 5, 6
        const eerste = row[2] || '' // Kolom 2: Eerste Plaats
        const tweede = row[4] || '' // Kolom 4: Tweede Plaats  
        const derde = row[6] || ''  // Kolom 6: Derde Plaats
        
        console.log(`Processing megalijst year ${jaar}: eerste="${eerste}", tweede="${tweede}", derde="${derde}"`)
        
        if (eerste || tweede || derde) {
          results.push({
            jaar: jaar,
            eerste: eerste,
            tweede: tweede,
            derde: derde
          })
        }
      }
    }
    
    // Sort by year (oldest first, newest last)
    results.sort((a, b) => a.jaar - b.jaar)
    
    console.log('Final megalijst results:', results)
    return results
  }

  const processRankingData = (jsonData: any[]): RankingResult[] => {
    console.log('Processing ranking data:', jsonData)
    
    const results: RankingResult[] = []
    const klasseNames = ['Eerste Klasse', 'Tweede Klasse', 'Derde Klasse', 'Vierde Klasse', 'Vijfde Klasse']
    
    // Process each klasse separately based on screenshot
    // Eerste Klasse: C (namen), D (1ste), E (2de), F (3de)
    // Tweede Klasse: H (namen), I (1ste), J (2de), K (3de)
    // Derde Klasse: M (namen), N (1ste), O (2de), P (3de)
    // Vierde Klasse: R (namen), S (1ste), T (2de), U (3de)
    // Vijfde Klasse: V (namen), W (1ste), X (2de), Y (3de)
    const klasseConfigs = [
      { name: 'Eerste Klasse', spelerCol: 2, eersteCol: 3, tweedeCol: 4, derdeCol: 5 }, // C, D, E, F
      { name: 'Tweede Klasse', spelerCol: 7, eersteCol: 8, tweedeCol: 9, derdeCol: 10 }, // H, I, J, K
      { name: 'Derde Klasse', spelerCol: 12, eersteCol: 13, tweedeCol: 14, derdeCol: 15 }, // M, N, O, P
      { name: 'Vierde Klasse', spelerCol: 17, eersteCol: 18, tweedeCol: 19, derdeCol: 20 }, // R, S, T, U
      { name: 'Vijfde Klasse', spelerCol: 22, eersteCol: 23, tweedeCol: 24, derdeCol: 25 }  // W, X, Y, Z
    ]
    
    // Debug: let's check what's in the fifth class columns
    console.log('Debugging Vijfde Klasse columns:')
    for (let debugRow = 0; debugRow < Math.min(10, jsonData.length); debugRow++) {
      const debugRowData = jsonData[debugRow]
      console.log(`Row ${debugRow}: V(21)="${debugRowData[21]}", W(22)="${debugRowData[22]}", X(23)="${debugRowData[23]}", Y(24)="${debugRowData[24]}"`)
    }
    
    for (let k = 0; k < 5; k++) {
      const config = klasseConfigs[k]
      const klasse = config.name
      console.log(`Processing ${klasse}...`)
      
      console.log(`  ${klasse}: spelerCol=${config.spelerCol}, eersteCol=${config.eersteCol}, tweedeCol=${config.tweedeCol}, derdeCol=${config.derdeCol}`)
      
      // Skip header row and process data rows
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (!row || row.length === 0) continue
        
        // Check if this row has a speler name for this klasse
        const speler = row[config.spelerCol]
        
        if (typeof speler === 'string' && speler.trim() !== '') {
          const eerste = row[config.eersteCol] || 0 // Aantal 1ste plaatsen
          const tweede = row[config.tweedeCol] || 0 // Aantal 2de plaatsen
          const derde = row[config.derdeCol] || 0  // Aantal 3de plaatsen
          
          console.log(`  ${speler}: eerste=${eerste}, tweede=${tweede}, derde=${derde}`)
          
          // Find existing speler or create new one
          let spelerIndex = results.findIndex(r => r.speler === speler)
          if (spelerIndex === -1) {
            // Create new speler with empty klasses
            results.push({
              speler: speler,
              klasses: [
                { klasse: 'Eerste Klasse', eerste: 0, tweede: 0, derde: 0 },
                { klasse: 'Tweede Klasse', eerste: 0, tweede: 0, derde: 0 },
                { klasse: 'Derde Klasse', eerste: 0, tweede: 0, derde: 0 },
                { klasse: 'Vierde Klasse', eerste: 0, tweede: 0, derde: 0 },
                { klasse: 'Vijfde Klasse', eerste: 0, tweede: 0, derde: 0 }
              ]
            })
            spelerIndex = results.length - 1
          }
          
          // Update the specific klasse data
          results[spelerIndex].klasses[k] = {
            klasse: klasse,
            eerste: Number(eerste) || 0,
            tweede: Number(tweede) || 0,
            derde: Number(derde) || 0
          }
        }
      }
    }
    
    return results
  }

  const processRecordsData = (jsonData: any[]): RecordResult[] => {
    const results: RecordResult[] = []
    
    // Process each section based on the screenshot structure
    // Each section has a title and then year-winner pairs in columns A,B,C,D,E,F,G,H
    let currentSection: RecordResult | null = null
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.length === 0) continue
      
      // Check if this row contains a section title (bold text in first column)
      const firstCell = row[0]
      if (typeof firstCell === 'string' && firstCell.includes('Winnaars')) {
        // Save previous section if exists
        if (currentSection && currentSection.entries.length > 0) {
          results.push(currentSection)
        }
        
        // Start new section
        currentSection = {
          titel: firstCell,
          entries: []
        }
      } else if (currentSection) {
        // Process year-winner pairs in this row
        // Check all possible year-winner pairs in the row
        for (let col = 0; col < row.length - 1; col += 2) {
          const jaar = row[col]
          const winnaar = row[col + 1]
          
          // More flexible year validation - accept both numbers and strings
          const yearValue = typeof jaar === 'string' ? parseInt(jaar) : jaar
          const isValidYear = typeof yearValue === 'number' && !isNaN(yearValue) && yearValue > 1900 && yearValue < 2100
          const isValidWinner = typeof winnaar === 'string' && winnaar && winnaar.trim() !== ''
          
          if (isValidYear && isValidWinner) {
            currentSection.entries.push({
              jaar: yearValue,
              winnaar: winnaar.trim()
            })
          }
        }
        
        // Also check for any single entries that might be missed
        for (let col = 0; col < row.length; col++) {
          const cell = row[col]
          const cellValue = typeof cell === 'string' ? parseInt(cell) : cell
          if (typeof cellValue === 'number' && !isNaN(cellValue) && cellValue > 1900 && cellValue < 2100) {
            // Found a year, check if next cell is a winner
            if (col + 1 < row.length) {
              const nextCell = row[col + 1]
              if (typeof nextCell === 'string' && nextCell && nextCell.trim() !== '') {
                // Check if this pair wasn't already added
                const alreadyExists = currentSection.entries.some(entry => 
                  entry.jaar === cellValue && entry.winnaar === nextCell.trim()
                )
                if (!alreadyExists) {
                  currentSection.entries.push({
                    jaar: cellValue,
                    winnaar: nextCell.trim()
                  })
                }
              }
            }
          }
        }
      }
    }
    
    // Add the last section
    if (currentSection && currentSection.entries.length > 0) {
      results.push(currentSection)
    }
    
    return results
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

  // Remove the initial loading screen

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
          ) : currentFormat === 'zomer' ? (
            // Render zomer format (only winners)
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
                    <td className="p-2 border">{speler}</td>
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
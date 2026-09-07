/**
 * Gedeelde parsing van de erelijst-Excelbestanden (public/data/erelijsten).
 * Gebruikt door de erelijsten-pagina en de palmares op spelersprofielen.
 */

/** Strip trailing ELO suffix from Excel cells, e.g. "Jan Janssen (2150)" → "Jan Janssen" */
export const cleanPlayerName = (name: string): string => {
  if (!name || typeof name !== 'string') return name
  return name.trim().replace(/\s*\(\d{3,4}\)\s*$/, '')
}

export const cellName = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) return ''
  return cleanPlayerName(value)
}

export interface Result {
  jaar: number
  eerste?: string
  tweede?: string
  derde?: string
  ratingprijs?: string
}

export interface KlasseResult {
  jaar: number
  klasses: {
    klasse: string
    eerste: string
    tweede: string
    derde: string
  }[]
}

export interface QuizResult {
  jaar: number
  ploeg: string
  leden: string
}

export interface KonijnResult {
  jaar: number
  winnaar: string
}

export interface RankingResult {
  speler: string
  klasses: {
    klasse: string
    eerste: number
    tweede: number
    derde: number
  }[]
}

export interface RecordResult {
  titel: string
  entries: {
    jaar: number
    winnaar: string
  }[]
}

export const EXCEL_FILES = [
  { name: 'Herfsttoernooi', file: 'herfst.xlsx', format: 'simple' },
  { name: 'Clubkampioenschap', file: 'lente.xlsx', format: 'klasses' },
  { name: 'Zomertoernooi', file: 'zomer.xlsx', format: 'zomer' },
  { name: 'Snelschaakkampioenschap', file: 'snelschaak.xlsx', format: 'klasses' },
  { name: 'Nieuwjaarsquiz', file: 'quiz.xlsx', format: 'quiz' },
  { name: 'Konijnenschaak', file: 'konijn.xlsx', format: 'konijn' },
  { name: 'Megaschaak', file: 'Megalijst.xlsx', format: 'megalijst' },
  { name: 'Ranking Clubkampioenschap', file: 'Ranking.xlsx', format: 'ranking' },
  { name: 'Unieke Prestaties', file: 'Records.xlsx', format: 'records' }
]

/** Haal een erelijst-Excel op en geef de ruwe rijen terug (header: 1). */
export async function fetchErelijstRows(file: string): Promise<any[]> {
  const response = await fetch(`/data/erelijsten/${file}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${file}: ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json(worksheet, { header: 1 })
}

/** Eén regel uit de historische erelijsten, herleid tot een palmares-item voor een speler. */
export interface PalmaresEntry {
  jaar: number
  competitie: string
  /** 1, 2, 3 of 4 (= ratingprijs) */
  positie: number
  /** Dedupe-sleutel t.o.v. automatische podia: herfst/lente/zomer/snelschaak/... */
  bucket: string
}

const namesEqual = (a: string, b: string): boolean =>
  a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase()

/**
 * Doorzoek de historische erelijst-Excels naar podiumplaatsen van één speler.
 * Bestanden die niet laden worden stil overgeslagen (palmares is best-effort).
 */
export async function getHistorischPalmares(
  voornaam: string,
  achternaam: string,
): Promise<PalmaresEntry[]> {
  const fullName = `${voornaam} ${achternaam}`
  const entries: PalmaresEntry[] = []
  const match = (naam?: string) => Boolean(naam && namesEqual(naam, fullName))

  const bronnen: Array<{ file: string; extract: (rows: any[]) => void }> = [
    {
      file: 'herfst.xlsx',
      extract: (rows) => {
        for (const r of processSimpleData(rows)) {
          if (match(r.eerste)) entries.push({ jaar: r.jaar, competitie: 'Herfstkampioenschap', positie: 1, bucket: 'herfst' })
          if (match(r.tweede)) entries.push({ jaar: r.jaar, competitie: 'Herfstkampioenschap', positie: 2, bucket: 'herfst' })
          if (match(r.derde)) entries.push({ jaar: r.jaar, competitie: 'Herfstkampioenschap', positie: 3, bucket: 'herfst' })
          if (match(r.ratingprijs)) entries.push({ jaar: r.jaar, competitie: 'Herfstkampioenschap', positie: 4, bucket: 'herfst' })
        }
      },
    },
    {
      file: 'lente.xlsx',
      extract: (rows) => {
        for (const y of processKlasseData(rows)) {
          for (const k of y.klasses) {
            const label = `Lentekampioenschap – ${k.klasse}`
            if (match(k.eerste)) entries.push({ jaar: y.jaar, competitie: label, positie: 1, bucket: 'lente' })
            if (match(k.tweede)) entries.push({ jaar: y.jaar, competitie: label, positie: 2, bucket: 'lente' })
            if (match(k.derde)) entries.push({ jaar: y.jaar, competitie: label, positie: 3, bucket: 'lente' })
          }
        }
      },
    },
    {
      file: 'zomer.xlsx',
      extract: (rows) => {
        for (const r of processZomerData(rows)) {
          if (match(r.eerste)) entries.push({ jaar: r.jaar, competitie: 'Zomertoernooi', positie: 1, bucket: 'zomer' })
        }
      },
    },
    {
      file: 'snelschaak.xlsx',
      extract: (rows) => {
        for (const y of processSnelschaakData(rows)) {
          for (const k of y.klasses) {
            if (match(k.eerste)) entries.push({ jaar: y.jaar, competitie: `Snelschaak – ${k.klasse}`, positie: 1, bucket: 'snelschaak' })
          }
        }
      },
    },
    {
      file: 'konijn.xlsx',
      extract: (rows) => {
        for (const r of processKonijnData(rows)) {
          if (match(r.winnaar)) entries.push({ jaar: r.jaar, competitie: 'Konijnenschaak', positie: 1, bucket: 'konijn' })
        }
      },
    },
    {
      file: 'Megalijst.xlsx',
      extract: (rows) => {
        for (const r of processMegalijstData(rows)) {
          if (match(r.eerste)) entries.push({ jaar: r.jaar, competitie: 'Megalijst', positie: 1, bucket: 'megalijst' })
          if (match(r.tweede)) entries.push({ jaar: r.jaar, competitie: 'Megalijst', positie: 2, bucket: 'megalijst' })
          if (match(r.derde)) entries.push({ jaar: r.jaar, competitie: 'Megalijst', positie: 3, bucket: 'megalijst' })
        }
      },
    },
  ]

  await Promise.all(
    bronnen.map(async ({ file, extract }) => {
      try {
        extract(await fetchErelijstRows(file))
      } catch {
        // Bestand ontbreekt of laadt niet: overslaan
      }
    }),
  )

  return entries.sort((a, b) => b.jaar - a.jaar || a.positie - b.positie)
}

/** Simple formaat (herfst): Jaar | / | 1ste | / | 2de | / | 3de | / | Ratingprijs */
export const processSimpleData = (jsonData: any[]): Result[] => {
  const dataRows = jsonData.slice(2) // Skip first two rows (headers)
  const processedResults: Result[] = []

  for (const row of dataRows) {
    if (!row || !Array.isArray(row) || row.length === 0 || !row[0]) {
      continue
    }
    const jaar = row[0]
    if (typeof jaar !== 'number') {
      continue
    }
    processedResults.push({
      jaar: jaar,
      eerste: cellName(row[2]),
      tweede: cellName(row[4]),
      derde: cellName(row[6]),
      ratingprijs: cellName(row[8])
    })
  }

  return processedResults
}

export const processKlasseData = (jsonData: any[]): KlasseResult[] => {
  const results: KlasseResult[] = []
  const klasseNames = ['1ste Klasse', '2de Klasse', '3de Klasse', '4de Klasse', '5de Klasse']

  // Process the data row by row
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i]
    if (!row || row.length === 0) continue

    // Check if this is a year row (has a year in first column)
    const jaar = row[0]
    if (typeof jaar === 'number' && jaar > 1900 && jaar < 2100) {
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

      // Process the data for this year
      const klasses: any[] = []

      // For each klasse (columns 2, 4, 6, 8, 10 - the name columns, not the number columns)
      for (let k = 0; k < 5; k++) {
        const nameColIndex = 2 + (k * 2) // Columns 2, 4, 6, 8, 10 (the name columns)

        let eerste = ''
        let tweede = ''
        let derde = ''

        // Row 0: 1st places (names are in the name columns)
        if (yearData[0] && yearData[0][nameColIndex]) {
          eerste = cellName(yearData[0][nameColIndex])
        }

        // Row 1: 2nd places (names are in the name columns)
        if (yearData[1] && yearData[1][nameColIndex]) {
          tweede = cellName(yearData[1][nameColIndex])
        }

        // Row 2: 3rd places (names are in the name columns)
        if (yearData[2] && yearData[2][nameColIndex]) {
          derde = cellName(yearData[2][nameColIndex])
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

  return results
}

export const processZomerData = (jsonData: any[]): Result[] => {
  const results: Result[] = []

  // Skip header row and process data rows
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i]
    if (!row || row.length === 0) {
      continue
    }

    // Check specific column pairs based on the actual data structure
    // First set: columns 0+1 (1960-2000)
    if (row[0] && row[1]) {
      const jaar = row[0]
      const winnaar = row[1]

      const cleanedWinnaar = cellName(winnaar)
      if (typeof jaar === 'number' && jaar > 1900 && jaar < 2100 && cleanedWinnaar) {
        results.push({
          jaar: jaar,
          eerste: cleanedWinnaar,
          tweede: '',
          derde: '',
          ratingprijs: ''
        })
      }
    }

    // Second set: columns 3+4 (2001-2025)
    if (row[3] && row[4]) {
      const jaar = row[3]
      const winnaar = row[4]

      const cleanedWinnaar = cellName(winnaar)
      if (typeof jaar === 'number' && jaar > 1900 && jaar < 2100 && cleanedWinnaar) {
        results.push({
          jaar: jaar,
          eerste: cleanedWinnaar,
          tweede: '',
          derde: '',
          ratingprijs: ''
        })
      }
    }
  }

  results.sort((a, b) => a.jaar - b.jaar)

  return results
}

export const processSnelschaakData = (jsonData: any[]): KlasseResult[] => {
  const results: KlasseResult[] = []
  const klasseNames = ['1ste Klasse', '2de Klasse', '3de Klasse', '4de Klasse', '5de Klasse']

  // Skip header row and process data rows
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i]
    if (!row || row.length === 0) continue

    // Check if this row has a year in the first column
    const jaar = row[0]
    if (typeof jaar === 'number' && jaar > 1900 && jaar < 2100) {
      const klasses: any[] = []

      // Process each klasse based on the actual Excel structure
      // Kolom C (index 2): Eerste Klasse
      // Kolom F (index 5): Tweede Klasse
      // Kolom I (index 8): Derde Klasse
      // Kolom L (index 11): Vierde Klasse
      const klasseColumns = [2, 5, 8, 11] // C, F, I, L

      for (let k = 0; k < klasseColumns.length; k++) {
        const klasseColIndex = klasseColumns[k]
        const winnaar = cellName(row[klasseColIndex])

        if (winnaar) {
          klasses.push({
            klasse: klasseNames[k],
            eerste: winnaar,
            tweede: '',
            derde: ''
          })
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

  return results
}

export const processQuizData = (jsonData: any[]): QuizResult[] => {
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

  return results
}

export const processKonijnData = (jsonData: any[]): KonijnResult[] => {
  const results: KonijnResult[] = []

  // Skip header row and process data rows
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i]
    if (!row || row.length === 0) continue

    // Check if this row has a year in the first column
    const jaar = row[0]
    if (typeof jaar === 'number' && jaar > 1900 && jaar < 2100) {
      const winnaar = cellName(row[1])

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

  return results
}

export const processMegalijstData = (jsonData: any[]): Result[] => {
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
      const eerste = cellName(row[2])
      const tweede = cellName(row[4])
      const derde = cellName(row[6])

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

  return results
}

export const processRankingData = (jsonData: any[]): RankingResult[] => {
  const results: RankingResult[] = []

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

  for (let k = 0; k < 5; k++) {
    const config = klasseConfigs[k]
    const klasse = config.name

    // Skip header row and process data rows
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.length === 0) continue

      // Check if this row has a speler name for this klasse
      const speler = cellName(row[config.spelerCol])

      if (speler) {
        const eerste = row[config.eersteCol] || 0 // Aantal 1ste plaatsen
        const tweede = row[config.tweedeCol] || 0 // Aantal 2de plaatsen
        const derde = row[config.derdeCol] || 0  // Aantal 3de plaatsen

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

export const processRecordsData = (jsonData: any[]): RecordResult[] => {
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
            winnaar: cleanPlayerName(winnaar)
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
                  winnaar: cleanPlayerName(nextCell)
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

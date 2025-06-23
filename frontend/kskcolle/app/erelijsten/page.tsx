import { Crown, Medal } from "lucide-react"
import fs from "fs"
import path from "path"

interface Result {
  jaar: number
  eerste?: string
  tweede?: string
  derde?: string
  ratingprijs?: string
}

interface PrijzenTelling {
  goud: number
  zilver: number
  brons: number
  ratingprijs: number
}

export default function ErelijstenPage() {
  const filePath = path.join(process.cwd(), "data/erelijsten/herfstcompetitie.json")
  const fileData = fs.readFileSync(filePath, "utf-8")
  const results: Result[] = JSON.parse(fileData)

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

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center space-x-2">
        <Crown /> <span>Herfstcompetitie – Erelijst</span>
      </h1>

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
          <tbody>
            {results.map((r) => (
              <tr key={r.jaar} className="even:bg-neutral-50">
                <td className="p-2 border">{r.jaar}</td>
                <td className="p-2 border">{r.eerste ?? "-"}</td>
                <td className="p-2 border">{r.tweede ?? "-"}</td>
                <td className="p-2 border">{r.derde ?? "-"}</td>
                <td className="p-2 border">{r.ratingprijs ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </main>
  )
}

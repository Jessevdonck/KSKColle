import Link from "next/link"
import {
  Award,
  BarChart3,
  ChevronRight,
  Crown,
  Leaf,
  PartyPopper,
  Rabbit,
  Star,
  Sun,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { EXCEL_FILES } from "../../lib/erelijsten"

const ICONS: Record<string, LucideIcon> = {
  herfsttoernooi: Leaf,
  clubkampioenschap: Crown,
  zomertoernooi: Sun,
  snelschaakkampioenschap: Zap,
  nieuwjaarsquiz: PartyPopper,
  konijnenschaak: Rabbit,
  megaschaak: Award,
  "ranking-clubkampioenschap": BarChart3,
  "unieke-prestaties": Star,
}

export default function ErelijstenPage() {
  return (
    <main className="container mx-auto px-3 py-4">
      <div className="text-center mb-3">
        <h1 className="text-xl font-bold mb-1 flex items-center justify-center space-x-2 text-gray-800">
          <Trophy className="text-mainAccent" size={20} />
          <span>Erelijsten</span>
        </h1>
        <p className="text-gray-600 text-xs">Ontdek de geschiedenis van onze toernooien</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-w-5xl mx-auto">
        {EXCEL_FILES.map((erelijst) => {
          const Icon = ICONS[erelijst.slug] ?? Trophy
          return (
            <Link
              key={erelijst.slug}
              href={`/erelijsten/${erelijst.slug}`}
              className="group flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3 hover:border-mainAccent hover:shadow-md transition-all"
            >
              <div className="shrink-0 rounded-lg bg-mainAccent/10 p-2 text-mainAccent">
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-gray-900 group-hover:text-mainAccent transition-colors truncate">
                  {erelijst.name}
                </h2>
                <p className="text-xs text-gray-600 truncate">{erelijst.description}</p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-gray-400 group-hover:text-mainAccent transition-colors" />
            </Link>
          )
        })}
      </div>
    </main>
  )
}

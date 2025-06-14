"use client"
import { Button } from "@/components/ui/button"
import type { Round, MakeupDay } from "@/data/types"
import RoundGames from "./RoundGames"
import { Play, Users, Trophy } from "lucide-react"

interface Props {
  roundNumber: number
  roundData?: Round
  tournamentId: number
  makeupDays: MakeupDay[]
  onGenerate(): void
  canGenerate: boolean
  onUpdate(): void
  isGenerating?: boolean
}

export default function RoundSection({
  roundNumber,
  roundData,
  tournamentId,
  makeupDays,
  onGenerate,
  canGenerate,
  onUpdate,
  isGenerating = false,
}: Props) {
  // Alleen de wél gespeelde (en niet-uitgestelde) games tonen
  const games = roundData?.games.filter((g) => !g.uitgestelde_datum) ?? []

  // Toon de knop alleen als:
  // 1) canGenerate true is én
  // 2) er nog géén paringen voor deze ronde zijn (games array is leeg)
  const showGenerateButton = canGenerate && (roundData?.games.length ?? 0) === 0

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">
              <span className="text-sm font-bold">{roundNumber}</span>
            </div>
            Ronde {roundNumber}
          </h3>
          {showGenerateButton && (
            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Genereren...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Genereer Paringen
                </div>
              )}
            </Button>
          )}
        </div>
        {games.length > 0 && (
          <p className="text-white/80 mt-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            {games.length} partijen
          </p>
        )}
      </div>

      <div className="p-6">
        {games.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-mainAccent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-mainAccent" />
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">Nog geen paringen</h4>
            <p className="text-gray-500">
              {showGenerateButton
                ? "Klik op 'Genereer Paringen' om de partijen voor deze ronde aan te maken."
                : "Wacht tot de vorige ronde voltooid is voordat je paringen kunt genereren."}
            </p>
          </div>
        ) : (
          <RoundGames games={games} tournamentId={tournamentId} makeupDays={makeupDays} onUpdateGame={onUpdate} />
        )}
      </div>
    </div>
  )
}

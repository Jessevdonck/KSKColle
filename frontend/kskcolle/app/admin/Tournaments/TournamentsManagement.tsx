"use client"

import { useState } from "react"
import TournamentList from "./TournamentList"
import RoundManagement from "./rounds/RoundManagement"
import type { Toernooi } from "@/data/types"
import { Settings, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TournamentManagement() {
  const [selectedTournament, setSelectedTournament] = useState<Toernooi | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2.5">
            {selectedTournament && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTournament(null)}
                className="mr-2 border-mainAccent/30 text-mainAccent hover:bg-mainAccent/10 hover:border-mainAccent"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Terug
              </Button>
            )}
            <div className="bg-mainAccent/10 p-2 rounded-lg">
              <Settings className="h-5 w-5 text-mainAccent" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-textColor">
                {selectedTournament ? (
                  <>
                    {selectedTournament.naam}
                    {selectedTournament.class_name && (
                      <span className="text-base font-medium text-mainAccent ml-2">
                        ({selectedTournament.class_name})
                      </span>
                    )}
                    {" - Beheer"}
                  </>
                ) : "Toernooien Beheren"}
              </h1>
              <p className="text-gray-600 text-xs">
                {selectedTournament
                  ? "Beheer rondes, resultaten en inhaaldagen"
                  : "Beheer toernooien"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {selectedTournament ? (
          <RoundManagement tournament={selectedTournament} />
        ) : (
          <TournamentList onSelectTournament={setSelectedTournament} />
        )}
      </div>
    </div>
  )
}

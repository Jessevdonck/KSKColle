"use client"

import { useState } from "react"
import TournamentForm from "./components/forms/TournamentForm"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            {selectedTournament && (
              <Button
                variant="outline"
                onClick={() => setSelectedTournament(null)}
                className="mr-4 px-4 py-2 border-mainAccent/30 text-mainAccent hover:bg-mainAccent/10 hover:border-mainAccent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Terug
              </Button>
            )}
            <div className="bg-mainAccent/10 p-3 rounded-xl">
              <Settings className="h-8 w-8 text-mainAccent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-textColor">
                {selectedTournament ? `${selectedTournament.naam} - Beheer` : "Toernooien Beheren"}
              </h1>
              <p className="text-gray-600 mt-1">
                {selectedTournament
                  ? "Beheer rondes, resultaten en inhaaldagen"
                  : "Maak nieuwe toernooien aan en beheer bestaande toernooien"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTournament ? (
          <RoundManagement tournament={selectedTournament} />
        ) : (
          <div className="space-y-8">
            <TournamentForm />
            <TournamentList onSelectTournament={setSelectedTournament} />
          </div>
        )}
      </div>
    </div>
  )
}

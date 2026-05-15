"use client"

import { useState, useEffect, useMemo } from "react"
import useSWR from "swr"
import TournamentCard from "../../components/TournamentCard"
import { getAll } from "../../../api/index"
import { Archive, Trophy, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const CLASS_ORDER = [
  "Eerste Klasse",
  "Tweede Klasse",
  "Derde Klasse",
  "Vierde Klasse",
  "Vijfde Klasse",
  "Vierde en Vijfde Klasse",
  "Zesde Klasse",
  "Zevende Klasse",
]

function groupTournamentsByName<T extends { naam: string; class_name?: string | null; participations: unknown[]; rondes: number; tournament_id: number }>(
  tournaments: T[],
) {
  const groups = new Map<string, T[]>()

  tournaments.forEach((tournament) => {
    const group = groups.get(tournament.naam) ?? []
    group.push(tournament)
    groups.set(tournament.naam, group)
  })

  return Array.from(groups.entries()).map(([name, groupTournaments]) => ({
    name,
    tournaments: groupTournaments.sort((a, b) => {
      if (!a.class_name && !b.class_name) return 0
      if (!a.class_name) return 1
      if (!b.class_name) return -1

      const aIndex = CLASS_ORDER.indexOf(a.class_name)
      const bIndex = CLASS_ORDER.indexOf(b.class_name)

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1

      return a.class_name.localeCompare(b.class_name)
    }),
  }))
}

export default function TournamentArchive() {
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { data: allTournaments, error } = useSWR("tournament?active=false", getAll)

  useEffect(() => {
    if (allTournaments || error) {
      setIsLoading(false)
    }
  }, [allTournaments, error])

  // Filter out active tournaments to show only archived ones
  const archivedTournaments = useMemo(
    () => allTournaments?.filter((tournament) => !tournament.active) || [],
    [allTournaments]
  )

  // Filter tournaments based on search term
  const filteredTournaments = useMemo(() => {
    if (!searchTerm.trim()) {
      return archivedTournaments
    }

    const searchLower = searchTerm.toLowerCase().trim()
    return archivedTournaments.filter((tournament) => {
      const nameMatch = tournament.naam?.toLowerCase().includes(searchLower)
      const locationMatch = tournament.locatie?.toLowerCase().includes(searchLower)
      const descriptionMatch = tournament.beschrijving?.toLowerCase().includes(searchLower)

      return nameMatch || locationMatch || descriptionMatch
    })
  }, [archivedTournaments, searchTerm])

  const displayTournaments = useMemo(() => {
    const grouped = groupTournamentsByName(filteredTournaments)

    return grouped.map((group) => {
      const firstTournament = group.tournaments[0]
      const totalPlayers = group.tournaments.reduce((sum, t) => sum + t.participations.length, 0)
      const maxRounds = Math.max(...group.tournaments.map((t) => t.rondes))

      return {
        ...firstTournament,
        participations: Array.from({ length: totalPlayers }, (_, i) => ({
          user_id: i,
          voornaam: `Player ${i + 1}`,
          achternaam: "",
        })),
        rondes: maxRounds,
        _isMultiClass: group.tournaments.length > 1,
        _classCount: group.tournaments.length,
        _allTournamentIds: group.tournaments.map((t) => t.tournament_id),
      }
    })
  }, [filteredTournaments])

  const clearSearch = () => {
    setSearchTerm("")
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2e2c2c] mb-4 flex items-center justify-center">
            <Archive className="mr-2 h-10 w-10 text-mainAccent" />
            Toernooi Archief
          </h1>
          <p className="text-xl text-[#2e2c2c]">Bekijk alle afgelopen schaaktoernooien van KSK Colle</p>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Zoek toernooien op naam, locatie of beschrijving..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 py-3 text-lg border-2 border-gray-200 focus:border-[#B17457] focus:ring-[#B17457] rounded-lg"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-transparent"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </Button>
            )}
          </div>

          {/* Search Results Info */}
          {searchTerm && (
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600">
                {filteredTournaments.length} resultaten gevonden voor &quot;{searchTerm}&quot;
              </p>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center">
            <div
              className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#B17457]"
              data-cy="is_loading"
            ></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center">
            <div className="text-center text-red-500 bg-red-100 p-6 rounded-lg shadow-md" data-cy="axios_error_message">
              <h2 className="text-2xl font-bold mb-2">Error</h2>
              <p>Er is een fout opgetreden bij het laden van het archief</p>
            </div>
          </div>
        ) : displayTournaments && displayTournaments.length > 0 ? (
          <>
            <div className="mb-8 text-center">
              <p className="text-lg text-[#2e2c2c]">
                <Trophy className="inline mr-2 h-5 w-5 text-mainAccent" />
                {searchTerm
                  ? `${displayTournaments.length} van ${groupTournamentsByName(archivedTournaments).length} toernooi${displayTournaments.length !== 1 ? "en" : ""}`
                  : `${displayTournaments.length} afgelopen toernooi${displayTournaments.length !== 1 ? "en" : ""}`}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayTournaments.map((tournament) => (
                <div key={tournament.tournament_id} className="relative">
                  <TournamentCard tournament={tournament} />
                  <div className="absolute top-2 right-2 bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    Afgelopen
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : searchTerm ? (
          <div className="text-center text-[#2e2c2c] mt-12">
            <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-2xl font-semibold">Geen resultaten gevonden</p>
            <p className="mt-2">Geen toernooien gevonden voor &quot;{searchTerm}&quot;. Probeer een andere zoekterm.</p>
            <Button
              onClick={clearSearch}
              variant="outline"
              className="mt-4 border-[#B17457] text-[#B17457] hover:bg-[#B17457] hover:text-white"
            >
              Wis zoekopdracht
            </Button>
          </div>
        ) : (
          <div className="text-center text-[#2e2c2c] mt-12" data-cy="no_tournaments_message">
            <Archive className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-2xl font-semibold">Geen gearchiveerde toernooien gevonden</p>
            <p className="mt-2">Er zijn momenteel geen afgelopen toernooien in het archief.</p>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import RoundPairings from "./RoundPairings"
import StandingsWithModal from "./Standings"
import { getById, getAll, getAllTournamentRounds } from "../../api/index"
import { format, isSameDay, parseISO } from "date-fns"
import { Calendar, Trophy, Users, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"

type Game = {
  game_id: number
  result: string | null
  speler1: { user_id: number; voornaam: string; achternaam: string }
  speler2: { user_id: number; voornaam: string; achternaam: string } | null
  uitgestelde_datum?: string
}

type Round = {
  round_id: number
  ronde_nummer: number
  games: Game[]
}


type Tournament = {
  tournament_id: number
  naam: string
  rondes: number
  type: "SWISS" | "ROUND_ROBIN"
  participations: Array<{
    user: {
      user_id: number
      voornaam: string
      achternaam: string
    }
  }>
  rounds: Round[]
}

export default function TournamentDetails() {
  const { id } = useParams()
  const tournamentId = Number(id)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeline, setTimeline] = useState<
    ({ kind: "round"; round: Round } | { kind: "makeup"; day: any; games: Game[] })[]
  >([])

  // 1) Tournament data fetching
  const {
    data: tournament,
    error: tournamentError,
    isLoading: tournamentLoading,
  } = useSWR<Tournament>(
    tournamentId ? `tournament/${tournamentId}` : null,
    () => getById(`tournament/${tournamentId}`),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  // 2) All tournament rounds fetching (includes makeup days)
  const { data: allRounds = [], error: roundsError } = useSWR<any[]>(
    tournamentId ? `tournamentRounds?tournament_id=${tournamentId}` : null,
    () => getAllTournamentRounds(tournamentId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  // Build timeline when data is available
  useEffect(() => {
    if (tournament && allRounds) {
      const rounds: Round[] = tournament.rounds || []

      type Entry = { kind: "round"; round: Round } | { kind: "makeup"; day: any; games: Game[] }
      const newTimeline: Entry[] = []

      // Sort all rounds by ronde_nummer
      const sortedRounds = [...allRounds].sort((a, b) => a.ronde_nummer - b.ronde_nummer)

      let makeupDayCounter = 1

      for (const round of sortedRounds) {
        if (round.type === 'REGULAR') {
          // Regular round
          const found = rounds.find((x) => x.ronde_nummer === round.ronde_nummer)
          newTimeline.push({
            kind: "round",
            round: found ?? { round_id: round.round_id, ronde_nummer: round.ronde_nummer, games: round.games || [] },
          })
        } else if (round.type === 'MAKEUP') {
          // Makeup day - add sequential number
          newTimeline.push({
            kind: "makeup",
            day: { ...round, makeupDayNumber: makeupDayCounter },
            games: round.games || []
          })
          makeupDayCounter++
        }
      }

      setTimeline(newTimeline)
    }
  }, [tournament, allRounds])

  // Set default round (last round with results + 1)
  useEffect(() => {
    if (timeline.length > 0) {
      let defaultIndex = 0

      // Find the last round with results
      for (let i = timeline.length - 1; i >= 0; i--) {
        const entry = timeline[i]
        if (entry.kind === "round" && entry.round.games && entry.round.games.length > 0) {
          const hasResults = entry.round.games.some((game) => game.result !== null)
          if (hasResults) {
            // Take the next round if it exists
            defaultIndex = Math.min(i + 1, timeline.length - 1)
            break
          }
        }
      }

      setCurrentIndex(defaultIndex)
    }
  }, [timeline])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : timeline.length - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < timeline.length - 1 ? prev + 1 : 0))
  }

  const currentEntry = timeline[currentIndex]
  const rounds: Round[] = tournament?.rounds || []

  // Loading state
  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mainAccent mx-auto mb-4"></div>
          <p className="text-gray-600">Toernooi laden...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (tournamentError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Fout bij laden</h2>
          <p className="text-gray-600">Het toernooi kon niet worden geladen.</p>
        </div>
      </div>
    )
  }

  // No tournament found
  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Toernooi niet gevonden</h2>
          <p className="text-gray-600">Het opgevraagde toernooi bestaat niet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="bg-mainAccent/10 p-1.5 rounded-lg">
              <Trophy className="h-5 w-5 text-mainAccent" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-textColor">{tournament.naam}</h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{tournament.participations?.length || 0} spelers</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{tournament.rondes} rondes</span>
                </div>
                <div className="px-1.5 py-0.5 bg-mainAccent/10 text-mainAccent rounded-full text-xs font-medium">
                  {tournament.type}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Rounds & Makeup Days with Navigation */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-3 py-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Rondes & Inhaaldagen
                  </h2>

                  {/* Navigation Controls */}
                  {timeline.length > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={goToPrevious}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div className="px-3 py-1.5 bg-white/20 rounded-lg text-white font-medium min-w-[100px] text-center text-sm">
                        {currentEntry?.kind === "round"
                          ? `Ronde ${currentEntry.round.ronde_nummer}`
                          : `Inhaaldag ${currentEntry?.day.makeupDayNumber}`}
                      </div>
                      <button
                        onClick={goToNext}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Round Indicators */}
                {timeline.length > 1 && (
                  <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-1">
                    {timeline.map((entry, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          index === currentIndex
                            ? "bg-white text-mainAccent"
                            : "bg-white/20 text-white hover:bg-white/30"
                        }`}
                      >
                        {entry.kind === "round" ? `R${entry.round.ronde_nummer}` : `I${entry.day.makeupDayNumber}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Round/Makeup Day Content */}
              <div className="p-4 min-h-[300px]">
                {currentEntry ? (
                  currentEntry.kind === "round" ? (
                    <RoundPairings round={currentEntry.round} />
                  ) : (
                    <MakeupPairings round={currentEntry.day} games={currentEntry.games} />
                  )
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Geen rondes beschikbaar</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Standings */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-4">
              <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-3 py-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Stand
                </h2>
              </div>
              <div className="p-3">
                <StandingsWithModal tournament={tournament} rounds={rounds} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Component to show a makeup day + associated games
function MakeupPairings({ round, games }: { round: any; games: Game[] }) {
  const createUrlFriendlyName = (voornaam: string, achternaam: string) => {
    return `${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, "_")
  }

  const getByeText = (result: string | null) => {
    if (!result) return "Bye"
    
    // Check if it's an absent with message result (ABS-0.5, ABS-1, etc.)
    if (result.startsWith("ABS-")) {
      return "Abs with msg"
    }
    
    // Check if it's a bye result (e.g., "0.5-0", "1-0", "0-0")
    if (result.includes("-0") && result !== "0-0") {
      return "Bye"
    }
    
    return "Bye"
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-xl font-bold text-textColor mb-2 flex items-center gap-2">
          <div className="bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            I
          </div>
          Inhaaldag {round.makeupDayNumber}
        </h3>
        <p className="text-gray-600 flex items-center gap-2 text-sm">
          <Calendar className="h-3 w-3" />
          {format(parseISO(round.ronde_datum), "dd-MM-yyyy")}
        </p>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Calendar className="h-8 w-8 text-amber-500" />
          </div>
          <h4 className="text-base font-semibold text-gray-700 mb-2">Geen uitgestelde partijen</h4>
          <p className="text-gray-500 text-sm">Er zijn geen partijen uitgesteld naar deze inhaaldag.</p>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-amber-200 to-orange-200">
                <th className="p-3 text-center font-semibold text-amber-800 text-sm w-12">Bord</th>
                <th className="p-3 text-left font-semibold text-amber-800 text-sm">Wit</th>
                <th className="p-3 text-center font-semibold text-amber-800 w-8"></th>
                <th className="p-3 text-left font-semibold text-amber-800 text-sm">Zwart</th>
                <th className="p-3 text-center font-semibold text-amber-800 text-sm">Uitslag</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g, idx) => (
                <tr
                  key={g.game_id}
                  className={`border-b border-amber-100 ${
                    idx % 2 === 0 ? "bg-white" : "bg-amber-50/50"
                  } hover:bg-amber-100/50 transition-colors`}
                >
                  <td className="p-3 text-center">
                    <div className="bg-amber-200 text-amber-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/profile/${createUrlFriendlyName(g.speler1.voornaam, g.speler1.achternaam)}`}
                      className="group flex items-center gap-2 hover:text-mainAccent transition-colors"
                    >
                      <div className="w-6 h-6 bg-white border-2 border-amber-300 rounded-full flex items-center justify-center text-xs font-bold group-hover:border-mainAccent transition-colors">
                        W
                      </div>
                      <span className="font-medium text-gray-800 text-sm group-hover:text-mainAccent transition-colors">
                        {g.speler1.voornaam} {g.speler1.achternaam}
                      </span>
                    </Link>
                  </td>
                  <td className="p-3 text-center">
                    <div className="text-amber-400 text-sm">vs</div>
                  </td>
                  <td className="p-3">
                    {g.speler2 ? (
                      <Link
                        href={`/profile/${createUrlFriendlyName(g.speler2.voornaam, g.speler2.achternaam)}`}
                        className="group flex items-center gap-2 hover:text-mainAccent transition-colors"
                      >
                        <div className="w-6 h-6 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white group-hover:border-mainAccent transition-colors">
                          Z
                        </div>
                        <span className="font-medium text-gray-800 text-sm group-hover:text-mainAccent transition-colors">
                          {g.speler2.voornaam} {g.speler2.achternaam}
                        </span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600 italic">
                        <div className="w-6 h-6 bg-amber-200 border-2 border-amber-300 rounded-full flex items-center justify-center text-xs">
                          -
                        </div>
                        <span className="text-sm">{getByeText(g.result)}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        g.result && g.result !== "not_played"
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {g.result && g.result !== "not_played" ? g.result : "Nog te spelen"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

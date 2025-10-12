"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import RoundPairings from "./RoundPairings"
import StandingsWithModal from "./Standings"
import { getById, getAll, getAllTournamentRounds, undoPostponeGame } from "../../../api/index"
import { format, isSameDay, parseISO } from "date-fns"
import { Calendar, Trophy, Users, ChevronLeft, ChevronRight, X } from "lucide-react"
import { useState, useEffect } from "react"

type Game = {
  game_id: number
  result: string | null
  speler1: { user_id: number; voornaam: string; achternaam: string }
  speler2: { user_id: number; voornaam: string; achternaam: string } | null
  uitgestelde_datum?: Date
}

type Round = {
  round_id: number | null
  ronde_nummer: number
  games: Game[]
  ronde_datum?: string | null
  startuur?: string
  type: "REGULAR" | "MAKEUP"
  label?: string | null
  is_sevilla_imported?: boolean
}

type MakeupDay = {
  id: number
  tournament_id: number
  round_after: number
  date: string
  label: string | null
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
  is_sevilla_imported?: boolean
  class_name?: string | null
}

export default function TournamentDetails() {
  const { id } = useParams()
  const tournamentId = Number(id)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeline, setTimeline] = useState<
    ({ kind: "round"; round: Round } | { kind: "makeup"; day: MakeupDay; games: Game[] })[]
  >([])
  const [activeTab, setActiveTab] = useState<'rounds' | 'standings'>('rounds')

  // 1) Tournament data fetching
  const {
    data: tournament,
    error: tournamentError,
    isLoading: tournamentLoading,
  } = useSWR<Tournament>(
    tournamentId ? `tournament/${tournamentId}` : null,
    () => getById(`tournament/${tournamentId}`),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 0, // Disable deduplication to force fresh data
    },
  )

  // 2) All tournament rounds fetching (includes makeup days)
  const { data: allRounds = [], error: roundsError } = useSWR<Round[]>(
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

      // Sort all rounds by date first, then by ronde_nummer
      const sortedRounds = [...allRounds].sort((a, b) => {
        // First sort by date
        const dateA = new Date(a.ronde_datum).getTime()
        const dateB = new Date(b.ronde_datum).getTime()
        if (dateA !== dateB) {
          return dateA - dateB
        }
        // If dates are equal, sort by ronde_nummer
        return a.ronde_nummer - b.ronde_nummer
      })

      let makeupDayCounter = 1

      // Add all rounds (both REGULAR and MAKEUP) to timeline in chronological order
      for (const round of sortedRounds) {
        if (round.type === 'REGULAR') {
          // Regular round
          const found = rounds.find((x) => x.ronde_nummer === round.ronde_nummer)
          newTimeline.push({
            kind: "round",
            round: found ?? { 
              round_id: round.round_id, 
              ronde_nummer: round.ronde_nummer, 
              games: round.games || [], 
              ronde_datum: round.ronde_datum,
              startuur: round.startuur,
              type: "REGULAR" 
            },
          })
        } else if (round.type === 'MAKEUP') {
          // Makeup round
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

  // Set default round (next upcoming round based on date)
  useEffect(() => {
    if (timeline.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to start of day
      
      let defaultIndex = 0
      let foundUpcoming = false

      // Find the next upcoming round (today or future)
      for (let i = 0; i < timeline.length; i++) {
        const entry = timeline[i]
        let roundDate: Date | null = null

        if (entry.kind === "round" && entry.round.ronde_datum) {
          roundDate = new Date(entry.round.ronde_datum)
        } else if (entry.kind === "makeup" && entry.day.date) {
          roundDate = new Date(entry.day.date)
        }

        if (roundDate) {
          roundDate.setHours(0, 0, 0, 0) // Reset time to start of day
          
          // If this round is today or in the future, select it
          if (roundDate >= today) {
            defaultIndex = i
            foundUpcoming = true
            break
          }
        }
      }

      // If no upcoming round found, show the last round
      if (!foundUpcoming) {
        defaultIndex = timeline.length - 1
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
  const rounds: Round[] = (tournament?.rounds || []).map(round => ({
    ...round,
    type: round.type || "REGULAR" as "REGULAR" | "MAKEUP"
  }))

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
        <div className="max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-mainAccent/10 p-2 rounded-lg">
              <Trophy className="h-6 w-6 text-mainAccent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-textColor">
                {tournament.naam}
                {tournament.class_name && (
                  <span className="ml-2 text-lg font-medium text-mainAccent">
                    ({tournament.class_name})
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{tournament.participations?.length || 0} spelers</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{tournament.rondes} rondes</span>
                </div>
                <div className="px-2 py-1 bg-mainAccent/10 text-mainAccent rounded-full text-xs font-medium">
                  {tournament.type}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tabs - Only visible on mobile */}
      <div className="xl:hidden bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-[90rem] mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('rounds')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === 'rounds'
                  ? 'text-mainAccent border-mainAccent'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" />
                Rondes
              </div>
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === 'standings'
                  ? 'text-mainAccent border-mainAccent'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Trophy className="h-4 w-4" />
                Stand
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Rounds & Makeup Days with Navigation */}
          <div className={`xl:col-span-2 ${activeTab === 'rounds' ? 'block' : 'hidden xl:block'}`}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
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
                          : `Inhaaldag ${currentEntry?.day.label}`}
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
                        {entry.kind === "round" ? `R${entry.round.ronde_nummer}` : `I${entry.day.id}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Round/Makeup Day Content */}
              <div className="p-6 min-h-[400px]">
                {currentEntry ? (
                  currentEntry.kind === "round" ? (
                    <RoundPairings 
                      round={currentEntry.round} 
                      tournament={tournament}
                      allRounds={tournament?.rounds || []}
                    />
                  ) : (
                    <MakeupPairings day={currentEntry.day} games={currentEntry.games} />
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
          <div className={`xl:col-span-1 ${activeTab === 'standings' ? 'block' : 'hidden xl:block'}`}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-6">
              <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Stand
                </h2>
              </div>
              <div className="p-4">
                <StandingsWithModal tournament={tournament} rounds={allRounds} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Component to show a makeup day + associated games
function MakeupPairings({ day, games, currentUser }: { day: MakeupDay; games: Game[]; currentUser?: any }) {
  const createUrlFriendlyName = (voornaam: string, achternaam: string) => {
    return `${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, "_")
  }

  // Check if current user is involved in a game
  const isUserInvolvedInGame = (game: any) => {
    if (!currentUser) return false
    return game.speler1?.user_id === currentUser.user_id || 
           game.speler2?.user_id === currentUser.user_id
  }

  const handleUndoPostpone = async (gameId: number) => {
    if (!confirm('Weet je zeker dat je het uitstel ongedaan wilt maken? De game wordt teruggeplaatst naar de originele ronde.')) {
      return;
    }

    try {
      const result = await undoPostponeGame('', { arg: { game_id: gameId } });
      alert(result.message);
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to undo postpone game:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Kon uitstel niet ongedaan maken';
      alert(`Fout: ${errorMessage}`);
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-xl font-bold text-textColor mb-2 flex items-center gap-2">
          <div className="bg-mainAccent text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            I
          </div>
          Inhaaldag {day.label}
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
          <p>
            {games.length} partijen
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(parseISO(day.date), "dd-MM-yyyy")}</span>
            </div>
          </div>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-mainAccent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Calendar className="h-8 w-8 text-mainAccent" />
          </div>
          <h4 className="text-base font-semibold text-gray-700 mb-2">Geen uitgestelde partijen</h4>
          <p className="text-gray-500 text-sm">Er zijn geen partijen uitgesteld naar deze inhaaldag.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-mainAccent to-mainAccentDark text-white">
                <th className="px-2 py-1 text-left font-semibold text-sm">Wit</th>
                <th className="px-2 py-1 text-center font-semibold w-8"></th>
                <th className="px-2 py-1 text-left font-semibold text-sm">Zwart</th>
                <th className="px-2 py-1 text-center font-semibold text-sm">Uitslag</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g, idx) => (
                <tr
                  key={g.game_id}
                  className={`border-b border-neutral-100 ${
                    idx % 2 === 0 ? "bg-white" : "bg-neutral-50/50"
                  } hover:bg-mainAccent/5 transition-colors`}
                >
                  <td className="px-2 py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-white border-2 border-neutral-300 rounded-full flex items-center justify-center text-xs font-bold">
                        W
                      </div>
                      <span className="font-medium text-gray-800 text-sm">
                        {g.speler1.voornaam} {g.speler1.achternaam}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-1 text-center">
                    <ChevronRight className="h-3 w-3 text-gray-400 mx-auto" />
                  </td>
                  <td className="px-2 py-1">
                    {g.speler2 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          Z
                        </div>
                        <span className="font-medium text-gray-800 text-sm">
                          {g.speler2.voornaam} {g.speler2.achternaam}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-600 italic">
                        <div className="w-6 h-6 bg-gray-200 border-2 border-gray-300 rounded-full flex items-center justify-center text-xs">
                          -
                        </div>
                        <span className="text-sm">Bye</span>
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          g.uitgestelde_datum
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : g.result && g.result !== "not_played"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {g.uitgestelde_datum
                          ? "Uitgesteld"
                          : g.result && g.result !== "not_played"
                          ? g.result
                          : "Nog te spelen"}
                      </span>
                      {isUserInvolvedInGame(g) && (
                        <button
                          onClick={() => handleUndoPostpone(g.game_id)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors"
                          title="Uitstel ongedaan maken"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
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

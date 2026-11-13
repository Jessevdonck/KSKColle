"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import useSWR from "swr"
import RoundPairings from "./RoundPairings"
import StandingsWithModal from "./Standings"
import MegaschaakTab from "./MegaschaakTab"
import CrossTable from "./CrossTable"
import { getById, getAll, getAllTournamentRounds, undoPostponeGame, reportAbsence } from "../../api/index"
import { format, isSameDay, parseISO } from "date-fns"
import { Calendar, Trophy, Users, ChevronLeft, ChevronRight, X, UserX, Swords } from "lucide-react"
import { useState, useEffect } from "react"
import PostponeGameButton from './PostponeGameButton'
import { isLentecompetitieTieBreak } from "./tieBreakLente"
import { Button } from '@/components/ui/button'
import { useAuth } from '../../contexts/auth'
import Link from 'next/link'
import { tournamentDetailKey, tournamentRoundsKey } from "@/lib/swrTournamentKeys"
import { DEFAULT_SWR_OPTIONS } from "@/lib/swrConfig"

type Game = {
  game_id: number
  original_game_id?: number | null
  result: string | null
  speler1: { user_id: number; voornaam: string; achternaam: string; schaakrating_elo?: number }
  speler2: { user_id: number; voornaam: string; achternaam: string; schaakrating_elo?: number } | null
  uitgestelde_datum?: string
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


type Tournament = {
  tournament_id: number
  naam: string
  rondes: number
  type: "SWISS" | "ROUND_ROBIN"
  rating_enabled?: boolean
  megaschaak_enabled?: boolean
  is_youth?: boolean
  megaschaak_deadline?: string | null
  finished?: boolean
  participations: Array<{
    user: {
      user_id: number
      voornaam: string
      achternaam: string
      schaakrating_elo?: number
    }
    sevilla_rating_change?: number | null
    tie_break?: number | null
    score?: number | null
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
    ({ kind: "round"; round: Round } | { kind: "makeup"; day: any; games: Game[] })[]
  >([])
  const [reportingAbsence, setReportingAbsence] = useState(false)
  const [activeTab, setActiveTab] = useState<'rounds' | 'standings' | 'megaschaak' | 'crosstable'>('rounds')
  const [selectedClassId, setSelectedClassId] = useState<number>(tournamentId)
  const { user: currentUser } = useAuth()

  // 1) Tournament data fetching
  const {
    data: tournament,
    error: tournamentError,
    isLoading: tournamentLoading,
  } = useSWR<Tournament>(
    selectedClassId ? tournamentDetailKey(selectedClassId) : null,
    () => getById(`tournament/${selectedClassId}`),
    DEFAULT_SWR_OPTIONS,
  )

  const isLentecompetitie = tournament ? isLentecompetitieTieBreak(tournament) : false

  // Fetch active + archived tournaments so all classes remain visible after close
  const { data: activeTournaments = [] } = useSWR<Tournament[]>(
    'tournament?active=true&is_youth=false',
    () => getAll('tournament', { active: 'true', is_youth: 'false' }),
    DEFAULT_SWR_OPTIONS,
  )

  const { data: inactiveTournaments = [] } = useSWR<Tournament[]>(
    tournament?.naam ? 'tournament?active=false&is_youth=false' : null,
    () => getAll('tournament', { active: 'false', is_youth: 'false' }),
    DEFAULT_SWR_OPTIONS,
  )

  const allTournamentsForClasses = React.useMemo(() => {
    const byId = new Map<number, Tournament>()
    for (const t of [...activeTournaments, ...inactiveTournaments]) {
      byId.set(t.tournament_id, t)
    }
    return Array.from(byId.values())
  }, [activeTournaments, inactiveTournaments])

  // Find all classes of this tournament (tournaments with same naam)
  const tournamentClasses = React.useMemo(() => {
    if (!tournament) return []

    const classes = allTournamentsForClasses.filter(t => t.naam === tournament.naam)

    if (!classes.some(t => t.tournament_id === tournament.tournament_id)) {
      classes.push(tournament)
    }

    // Custom sort order for class names
    const classOrder = [
      'Eerste Klasse',
      'Tweede Klasse', 
      'Derde Klasse',
      'Vierde Klasse',
      'Vijfde Klasse',
      'Vierde en Vijfde Klasse',
      'Zesde Klasse',
      'Zevende Klasse'
    ]
    
    return classes.sort((a, b) => {
      // If no class_name, put at the end
      if (!a.class_name && !b.class_name) return 0
      if (!a.class_name) return 1
      if (!b.class_name) return -1
      
      // Use custom order for known class names
      const aIndex = classOrder.indexOf(a.class_name)
      const bIndex = classOrder.indexOf(b.class_name)
      
      // If both are in the order list, use their index
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }
      
      // If only one is in the list, prioritize it
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      
      // If neither is in the list, use alphabetical
      return a.class_name.localeCompare(b.class_name)
    })
  }, [tournament, allTournamentsForClasses])

  const hasMultipleClasses = tournamentClasses.length > 1

  // Reset state when switching classes
  useEffect(() => {
    setCurrentIndex(0)
    setTimeline([])
  }, [selectedClassId])

  // Check if current user is participating in the tournament
  const isParticipating = currentUser && tournament && 
    tournament.participations.some(p => p.user.user_id === currentUser.user_id)

  // 2) All tournament rounds fetching (includes makeup days)
  const { data: allRounds = [], error: roundsError } = useSWR<any[]>(
    selectedClassId ? tournamentRoundsKey(selectedClassId) : null,
    () => getAllTournamentRounds(selectedClassId),
    DEFAULT_SWR_OPTIONS,
  )

  // 3) Makeup days fetching (legacy system) - not used anymore
  // const { data: makeupDays = [], error: makeupError } = useSWR<any[]>(
  //   tournamentId ? `makeupDay?tournament_id=${tournamentId}` : null,
  //   () => getAll(`makeupDay?tournament_id=${tournamentId}`),
  //   {
  //     revalidateOnFocus: false,
  //     revalidateOnReconnect: false,
  //   },
  // )

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
      // Available rounds processed
      
      for (const round of sortedRounds) {
        if (round.type === 'REGULAR') {
          // Normale speeldag: toon deze ronde met alle partijen; uitgestelde partijen tonen we met label "Uitgesteld"
          const found = rounds.find(
            (x) => (round.round_id != null && x.round_id === round.round_id) ||
              (x.ronde_nummer === round.ronde_nummer && x.type === 'REGULAR')
          )
          // `games` altijd van allRounds (actueel); embedded tournament.rounds kan achterlopen t.o.v. dezelfde SWR-cache.
          newTimeline.push({
            kind: "round",
            round: {
              ...found,
              round_id: round.round_id ?? found?.round_id ?? null,
              ronde_nummer: round.ronde_nummer,
              games: round.games ?? [],
              ronde_datum: round.ronde_datum ?? found?.ronde_datum,
              startuur: round.startuur ?? found?.startuur,
              type: "REGULAR",
              label: round.label ?? found?.label,
              is_sevilla_imported: round.is_sevilla_imported ?? found?.is_sevilla_imported,
            },
          })
        } else if (round.type === 'MAKEUP') {
          // Inhaaldag: toon alleen de partijen die naar deze inhaaldag zijn uitgesteld (games van deze ronde)
          newTimeline.push({
            kind: "makeup",
            day: { ...round, makeupDayNumber: makeupDayCounter },
            games: round.games || [],
          })
          makeupDayCounter++
        }
      }

      // Final timeline processed
      
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
        } else if (entry.kind === "makeup" && entry.day.ronde_datum) {
          roundDate = new Date(entry.day.ronde_datum)
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

  const goToRound = (roundNumber: number) => {
    const roundIndex = timeline.findIndex(entry => 
      entry.kind === "round" && entry.round.ronde_nummer === roundNumber
    )
    if (roundIndex !== -1) {
      setCurrentIndex(roundIndex)
    }
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

  const handleReportAbsence = async () => {
    if (!tournament) return
    
    // Bevestigingsbericht
    const confirmed = window.confirm(
      `Weet je zeker dat je je wilt afmelden voor de volgende ronde?\n\n` +
      `Dit betekent dat je niet uitgeloot wordt voor de volgende reguliere ronde van "${tournament.naam}".\n\n` +
      `De toernooileiders krijgen een email met deze melding.`
    )
    
    if (!confirmed) return
    
    setReportingAbsence(true)
    try {
      const result = await reportAbsence('', { 
        arg: { 
          tournament_id: tournament.tournament_id
        } 
      })
      alert(result.message)
    } catch (error: any) {
      // Failed to report absence
      const errorMessage = error?.response?.data?.message || error?.message || 'Kon afwezigheid niet melden'
      alert(`Fout bij afwezigheid melden: ${errorMessage}`)
    } finally {
      setReportingAbsence(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-[90rem] mx-auto px-3 sm:px-8 lg:px-12 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-mainAccent/10 p-1.5 rounded-lg">
                <Trophy className="h-5 w-5 text-mainAccent" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-textColor">
                  {tournament.naam}
                  {tournament.class_name && (
                    <span className="ml-2 text-base font-medium text-mainAccent">
                      ({tournament.class_name})
                    </span>
                  )}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{tournament.participations?.length || 0} spelers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{tournament.rondes} rondes</span>
                  </div>
                  <div className="px-1.5 py-0.5 bg-mainAccent/10 text-mainAccent rounded-full text-xs font-medium">
                    {tournament.naam.toLowerCase().includes('lentecompetitie') ? 'Round Robin' : tournament.type}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <PostponeGameButton 
                tournamentId={selectedClassId}
                tournamentName={tournament.naam}
                isHerfst={tournament.naam.toLowerCase().includes('herfst')}
                participations={tournament.participations.map(p => ({ user_id: p.user.user_id }))}
                onGamePostponed={goToRound}
              />
              {isParticipating && !isLentecompetitie && !tournament.finished && (
                <Button
                  onClick={handleReportAbsence}
                  disabled={reportingAbsence}
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  {reportingAbsence ? 'Melden...' : 'Afwezig Melden'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Class Tabs - Only show if tournament has multiple classes */}
      {hasMultipleClasses && (
        <div className="bg-white border-b border-neutral-200">
          <div className={isLentecompetitie ? "max-w-4xl mx-auto px-2" : "max-w-[90rem] mx-auto px-3 sm:px-8 lg:px-12"}>
            <div className="flex gap-2 overflow-x-auto py-2">
              {tournamentClasses.map((tournamentClass, index) => (
                <React.Fragment key={tournamentClass.tournament_id}>
                  <button
                    onClick={() => setSelectedClassId(tournamentClass.tournament_id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedClassId === tournamentClass.tournament_id
                        ? 'bg-mainAccent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tournamentClass.class_name || 'Hoofdtoernooi'}
                  </button>
                  {/* Add Megaschaak link after Vierde Klasse if megaschaak is enabled */}
                  {tournament.megaschaak_enabled && 
                   tournamentClass.class_name === 'Vierde Klasse' && (
                    <Link
                      href="/toernooien/megaschaak"
                      className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <Swords className="h-4 w-4" />
                        Megaschaak
                      </div>
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Tabs - Only visible on desktop */}
      {/* For lentecompetitie: hide tabs completely (kruistabel is already shown, megaschaak is in class bar) */}
      {/* For other tournaments with megaschaak: show tabs if there's more than just "rounds" */}
      {(!isLentecompetitie && tournament.megaschaak_enabled) && (
        <div className="hidden xl:block bg-white border-b border-neutral-200">
          <div className="max-w-[90rem] mx-auto px-3 sm:px-8 lg:px-12">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('rounds')}
                className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'rounds'
                    ? 'text-mainAccent border-mainAccent'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Rondes & Stand
                </div>
              </button>
              <button
                onClick={() => setActiveTab('crosstable')}
                className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'crosstable'
                    ? 'text-mainAccent border-mainAccent'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Kruistabel
                </div>
              </button>
              <button
                onClick={() => setActiveTab('megaschaak')}
                className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'megaschaak'
                    ? 'text-mainAccent border-mainAccent'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Swords className="h-4 w-4" />
                  Megaschaak
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Tabs - Only visible on mobile */}
      {/* For lentecompetitie: hide tabs completely (kruistabel is already shown, megaschaak is in class bar) */}
      {/* For other tournaments with megaschaak: show tabs if there's more than just "rounds" */}
      {(!isLentecompetitie && tournament.megaschaak_enabled) && (
        <div className="xl:hidden bg-white border-b border-neutral-200 sticky top-0 z-10">
          <div className="max-w-[90rem] mx-auto px-3 sm:px-6">
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
                onClick={() => setActiveTab('crosstable')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'crosstable'
                    ? 'text-mainAccent border-mainAccent'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Users className="h-4 w-4" />
                  Kruistabel
                </div>
              </button>
              <button
                onClick={() => setActiveTab('megaschaak')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'megaschaak'
                    ? 'text-mainAccent border-mainAccent'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Swords className="h-4 w-4" />
                  Megaschaak
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[90rem] mx-auto px-3 sm:px-8 lg:px-12 py-4">
        {/* Megaschaak Tab - Full Width */}
        {tournament.megaschaak_enabled && activeTab === 'megaschaak' && (
          <div className="xl:hidden">
            <MegaschaakTab 
              tournamentId={selectedClassId} 
              tournamentName={tournament.naam}
              megaschaakDeadline={tournament.megaschaak_deadline}
              tournamentFinished={tournament.finished}
            />
          </div>
        )}

        {/* Desktop Megaschaak Tab - Only show if megaschaak enabled and active */}
        {tournament.megaschaak_enabled && activeTab === 'megaschaak' && (
          <div className="hidden xl:block">
            <MegaschaakTab 
              tournamentId={selectedClassId} 
              tournamentName={tournament.naam}
              megaschaakDeadline={tournament.megaschaak_deadline}
              tournamentFinished={tournament.finished}
            />
          </div>
        )}

        {/* Regular Layout - Rounds and Standings */}
        {isLentecompetitie ? (
          /* For Lentecompetitie: Rounds and CrossTable full width, stacked */
          <div className={`space-y-3 max-w-4xl mx-auto px-2 ${activeTab === 'megaschaak' ? 'hidden' : ''}`}>
            {/* Rounds & Makeup Days with Navigation - Only show on rounds tab */}
            <div className={`${activeTab === 'rounds' ? 'block' : 'hidden'}`}>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-2 py-1.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Rondes & Inhaaldagen
                    </h2>

                    {/* Navigation Controls */}
                    {timeline.length > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={goToPrevious}
                          className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <div className="px-2 py-1 bg-white/20 rounded-lg text-white font-medium min-w-[90px] text-center text-xs">
                          {currentEntry?.kind === "round"
                            ? `Ronde ${currentEntry.round.ronde_nummer}`
                            : `Inhaaldag ${currentEntry?.day.makeupDayNumber}`}
                        </div>
                        <button
                          onClick={goToNext}
                          className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Round Indicators */}
                  {timeline.length > 1 && (
                    <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-0.5">
                      {timeline.map((entry, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentIndex(index)}
                          className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
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
                <div className="p-2">
                  {currentEntry ? (
                    currentEntry.kind === "round" ? (
                      <RoundPairings 
                        round={currentEntry.round} 
                        tournament={tournament}
                        allRounds={allRounds}
                      />
                    ) : (
                      <MakeupPairings 
                        round={currentEntry.day} 
                        games={currentEntry.games} 
                        onGameUndone={goToRound} 
                        currentUser={currentUser}
                        tournament={tournament}
                        allRounds={allRounds}
                      />
                    )
                  ) : (
                    <div className="text-center py-6">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Geen rondes beschikbaar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cross Table - Full width below rounds for Lentecompetitie, on rounds tab */}
            {activeTab === 'rounds' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-2 py-1.5">
                  <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Kruistabel
                  </h2>
                </div>
                <div className="p-2 pl-0">
                  <CrossTable tournament={tournament} rounds={allRounds} />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* For other tournaments: Rounds and Standings side by side (op mobile: stand onder de rondes) */
          <div className={`grid grid-cols-1 xl:grid-cols-3 gap-3 max-w-7xl mx-auto px-0 sm:px-2 ${activeTab === 'megaschaak' ? 'hidden' : ''}`}>
            {/* Rounds & Makeup Days - op mobile eerst (order-1), op desktop links */}
            <div className={`xl:col-span-2 order-1 xl:order-1 ${activeTab === 'rounds' || activeTab === 'standings' ? 'block' : 'hidden xl:block'}`}>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-2 py-1.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Rondes & Inhaaldagen
                    </h2>

                    {/* Navigation Controls */}
                    {timeline.length > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={goToPrevious}
                          className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <div className="px-2 py-1 bg-white/20 rounded-lg text-white font-medium min-w-[90px] text-center text-xs">
                          {currentEntry?.kind === "round"
                            ? `Ronde ${currentEntry.round.ronde_nummer}`
                            : `Inhaaldag ${currentEntry?.day.makeupDayNumber}`}
                        </div>
                        <button
                          onClick={goToNext}
                          className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Round Indicators */}
                  {timeline.length > 1 && (
                    <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-0.5">
                      {timeline.map((entry, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentIndex(index)}
                          className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
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
                <div className="p-1.5 sm:p-2">
                  {currentEntry ? (
                    currentEntry.kind === "round" ? (
                      <RoundPairings 
                        round={currentEntry.round} 
                        tournament={tournament}
                        allRounds={allRounds}
                      />
                    ) : (
                      <MakeupPairings 
                        round={currentEntry.day} 
                        games={currentEntry.games} 
                        onGameUndone={goToRound} 
                        currentUser={currentUser}
                        tournament={tournament}
                        allRounds={allRounds}
                      />
                    )
                  ) : (
                    <div className="text-center py-6">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Geen rondes beschikbaar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Standings - op mobile onder de rondes (order-2), compacter; op desktop rechts */}
            <div className={`xl:col-span-1 order-2 xl:order-2 ${activeTab === 'rounds' || activeTab === 'standings' ? 'block' : 'hidden xl:block'}`}>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-2 py-1.5 sm:px-3 sm:py-2">
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Stand
                  </h2>
                </div>
                <div className="p-2 sm:p-3">
                  <StandingsWithModal tournament={tournament} rounds={allRounds} />
                </div>
              </div>
            </div>
            
            {/* Cross Table - Full width on separate crosstable tab for other tournaments */}
            {activeTab === 'crosstable' && (
              <div className="xl:col-span-3 order-3">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-3 py-2">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Kruistabel
                    </h2>
                  </div>
                  <div className="p-4 pl-0">
                    <CrossTable tournament={tournament} rounds={allRounds} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Inhaaldag: zelfde weergave als een gewone ronde (RoundPairings), plus "uitstel ongedaan maken"
function MakeupPairings({ round, games, currentUser, tournament, allRounds }: {
  round: any;
  games: Game[];
  onGameUndone?: (originalRoundNumber: number) => void;
  currentUser?: any;
  tournament?: any;
  allRounds?: any[];
}) {
  const isUserInvolvedInGame = (game: any) =>
    !!currentUser &&
    (game.speler1?.user_id === currentUser.user_id || game.speler2?.user_id === currentUser.user_id)

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
      const errorMessage = error?.response?.data?.message || error?.message || 'Kon uitstel niet ongedaan maken';
      alert(`Fout: ${errorMessage}`);
    }
  }

  return (
    <RoundPairings
      makeupDayNumber={round.makeupDayNumber}
      round={{
        ...round,
        round_id: round.round_id ?? round.id,
        ronde_datum: round.ronde_datum || round.date,
        games,
      }}
      tournament={tournament}
      allRounds={allRounds}
      renderAction={(game) =>
        isUserInvolvedInGame(game) ? (
          <button
            onClick={() => handleUndoPostpone(game.game_id)}
            className="shrink-0 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors"
            title="Uitstel ongedaan maken"
          >
            <X className="h-3 w-3" />
          </button>
        ) : null
      }
    />
  )
}

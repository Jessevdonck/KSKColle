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
import { Calendar, Trophy, Users, ChevronLeft, ChevronRight, X, UserX, Clock, Swords } from "lucide-react"
import { useState, useEffect } from "react"
import PostponeGameButton from './PostponeGameButton'
import { Button } from '@/components/ui/button'
import { useAuth } from '../../contexts/auth'
import Link from 'next/link'

type Game = {
  game_id: number
  result: string | null
  speler1: { user_id: number; voornaam: string; achternaam: string }
  speler2: { user_id: number; voornaam: string; achternaam: string } | null
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
    selectedClassId ? `tournament/${selectedClassId}` : null,
    () => getById(`tournament/${selectedClassId}`),
    {
      revalidateOnFocus: false, // Disabled to reduce API calls
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Enable deduplication to prevent duplicate requests
    },
  )

  // Check if this is a Lentecompetitie tournament
  const isLentecompetitie = tournament?.naam.toLowerCase().includes('lentecompetitie') || false

  // Debug logging
  console.log('🎯 Tournament type check - is_youth:', tournament?.is_youth, 'naam:', tournament?.naam);

  // Fetch all active tournaments to find other classes
  const { data: allTournaments = [] } = useSWR<Tournament[]>(
    'tournament?active=true&is_youth=false',
    () => getAll('tournament', { active: 'true', is_youth: 'false' }),
    { revalidateOnFocus: false }
  )

  // Find all classes of this tournament (tournaments with same naam)
  const tournamentClasses = React.useMemo(() => {
    if (!tournament || !allTournaments) return []
    
    const classes = allTournaments.filter(t => t.naam === tournament.naam)
    
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
  }, [tournament, allTournaments])

  const hasMultipleClasses = tournamentClasses.length > 1

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 TournamentDetails Debug:', {
      tournamentName: tournament?.naam,
      tournamentClasses: tournamentClasses.map(t => ({ 
        id: t.tournament_id, 
        class_name: t.class_name,
        participations: t.participations.length 
      })),
      hasMultipleClasses,
      selectedClassId
    })
  }, [tournament, tournamentClasses, hasMultipleClasses, selectedClassId])

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
    selectedClassId ? `tournamentRounds?tournament_id=${selectedClassId}` : null,
    () => getAllTournamentRounds(selectedClassId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
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
        <div className="max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12 py-3">
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
          <div className={isLentecompetitie ? "max-w-4xl mx-auto px-2" : "max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12"}>
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
          <div className="max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12">
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
      <div className="max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12 py-4">
        {/* Megaschaak Tab - Full Width */}
        {tournament.megaschaak_enabled && activeTab === 'megaschaak' && (
          <div className="xl:hidden">
            <MegaschaakTab 
              tournamentId={selectedClassId} 
              tournamentName={tournament.naam}
              megaschaakDeadline={tournament.megaschaak_deadline}
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
                    <div className="text-center py-8">
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
          /* For other tournaments: Rounds and Standings side by side */
          <div className={`grid grid-cols-1 xl:grid-cols-3 gap-3 max-w-7xl mx-auto px-2 ${activeTab === 'megaschaak' ? 'hidden' : ''}`}>
            {/* Rounds & Makeup Days with Navigation */}
            <div className={`xl:col-span-2 order-2 xl:order-1 ${activeTab === 'rounds' ? 'block' : 'hidden xl:block'}`}>
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
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Geen rondes beschikbaar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Standings */}
            <div className={`xl:col-span-1 order-1 xl:order-2 ${activeTab === 'standings' ? 'block' : 'hidden xl:block'}`}>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-3 py-2">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Stand
                  </h2>
                </div>
                <div className="p-3">
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

// Component to show a makeup day + associated games
function MakeupPairings({ round, games, onGameUndone, currentUser, tournament, allRounds }: { 
  round: any; 
  games: Game[]; 
  onGameUndone?: (originalRoundNumber: number) => void; 
  currentUser?: any;
  tournament?: any;
  allRounds?: any[];
}) {
  const createUrlFriendlyName = (voornaam: string, achternaam: string) => {
    return `${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, "_")
  }

  // Calculate player scores (same logic as RoundPairings)
  // For makeup rounds, we show current standings (all rounds before this makeup day)
  const playerScores = tournament && allRounds 
    ? calculateStandingsForMakeupDay(tournament, allRounds) 
    : []
  const getPlayerScore = (userId: number) => {
    const player = playerScores.find(p => p.user_id === userId)
    return player ? player.score : 0
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
      // Failed to undo postpone game
      const errorMessage = error?.response?.data?.message || error?.message || 'Kon uitstel niet ongedaan maken';
      alert(`Fout: ${errorMessage}`);
    }
  }

  // Check if games data is properly loaded
  if (!games || games.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-mainAccent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
          <Calendar className="h-8 w-8 text-mainAccent" />
        </div>
        <h4 className="text-base font-semibold text-gray-700 mb-2">Geen partijen</h4>
        <p className="text-gray-500 text-sm">Er zijn nog geen partijen voor deze inhaaldag.</p>
      </div>
    )
  }


  const getByeText = (result: string | null) => {
    if (!result || result === "...") return "Nog te spelen"
    
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
    <div className="text-[0.9em]">
      <div className="mb-3">
        <h3 className="text-lg font-bold text-textColor mb-1.5 flex items-center gap-1.5">
          <div className="bg-mainAccent text-white rounded-full w-5 h-5 flex items-center justify-center text-[0.7em] font-bold">
            I
          </div>
          Inhaaldag {round.makeupDayNumber}
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-xs text-gray-600">
          <p>
            {games.length} partijen
          </p>
          {round.ronde_datum && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(round.ronde_datum).toLocaleDateString('nl-NL', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              {round.startuur && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{round.startuur}</span>
                </div>
              )}
            </div>
          )}
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
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-mainAccent to-mainAccentDark text-white">
                  <th className="px-1 py-0.5 text-center font-semibold text-xs w-[45px]">Bord</th>
                  <th className="px-1 py-0.5 text-left font-semibold text-xs w-[150px]">Wit</th>
                  {tournament?.is_youth !== true && (
                    <th className="px-1 py-0.5 text-center font-semibold text-xs w-[60px]">Rating</th>
                  )}
                  <th className="px-1 py-0.5 text-center font-semibold text-xs w-[50px]">Punten</th>
                  <th className="px-1 py-0.5 text-center font-semibold w-[30px]"></th>
                  <th className="px-1 py-0.5 text-left font-semibold text-xs w-[170px]">Zwart</th>
                  {tournament?.is_youth !== true && (
                    <th className="px-1 py-0.5 text-center font-semibold text-xs w-[60px]">Rating</th>
                  )}
                  <th className="px-1 py-0.5 text-center font-semibold text-xs w-[50px]">Punten</th>
                  <th className="px-1 py-0.5 text-center font-semibold text-xs w-[130px]">Uitslag</th>
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
                    <td className="px-1 py-0.5 text-center w-[45px]">
                      <div className="bg-mainAccent/10 text-mainAccent rounded-full w-5 h-5 flex items-center justify-center text-[0.7em] font-bold">
                        {idx + 1}
                      </div>
                    </td>
                    <td className="px-1 py-0.5 w-[150px]">
                      {g.speler1 && g.speler1.voornaam && g.speler1.achternaam ? (
                        <Link
                          href={`/profile/${createUrlFriendlyName(g.speler1.voornaam, g.speler1.achternaam)}`}
                          className="font-medium text-textColor hover:text-mainAccent transition-colors flex items-center gap-1.5 group text-xs truncate"
                          title={`${g.speler1.voornaam} ${g.speler1.achternaam}`}
                        >
                          <div className="w-5 h-5 bg-white border-2 border-neutral-300 rounded-full flex items-center justify-center text-[0.7em] font-bold group-hover:border-mainAccent transition-colors flex-shrink-0">
                            W
                          </div>
                          <span className="truncate">{`${g.speler1.voornaam} ${g.speler1.achternaam}`}</span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500 italic text-sm">
                          <div className="w-5 h-5 bg-gray-200 border-2 border-gray-300 rounded-full flex items-center justify-center text-[0.7em] flex-shrink-0">
                            ?
                          </div>
                          <span>Speler niet gevonden</span>
                        </div>
                      )}
                    </td>
                    {tournament?.is_youth !== true && (
                      <td className="px-1 py-0.5 text-center w-[60px]">
                        {g.speler1?.schaakrating_elo ? (
                          <span className="text-sm font-normal text-yellow-600">
                            {g.speler1.schaakrating_elo}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-1 py-0.5 text-center w-[50px]">
                      {playerScores.length > 0 ? (
                        <span className="text-sm font-bold text-black">
                          {getPlayerScore(g.speler1?.user_id || 0)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-1 py-0.5 text-center w-[30px]">
                      <ChevronRight className="h-3 w-3 text-gray-400 mx-auto" />
                    </td>
                    <td className="px-1 py-0.5 w-[170px]">
                      {g.speler2 && g.speler2.voornaam && g.speler2.achternaam ? (
                        <Link
                          href={`/profile/${createUrlFriendlyName(g.speler2.voornaam, g.speler2.achternaam)}`}
                          className="font-medium text-textColor hover:text-mainAccent transition-colors flex items-center gap-2 group text-xs truncate"
                          title={`${g.speler2.voornaam} ${g.speler2.achternaam}`}
                        >
                          <div className="w-5 h-5 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center text-[0.7em] font-bold text-white group-hover:border-mainAccent transition-colors flex-shrink-0">
                            Z
                          </div>
                          <span className="truncate">{`${g.speler2.voornaam} ${g.speler2.achternaam}`}</span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500 italic text-sm">
                          <div className="w-5 h-5 bg-gray-200 border-2 border-gray-300 rounded-full flex items-center justify-center text-[0.7em] flex-shrink-0">
                            -
                          </div>
                          <span>{getByeText(g.result)}</span>
                        </div>
                      )}
                    </td>
                    {tournament?.is_youth !== true && (
                      <td className="px-1 py-0.5 text-center w-[60px]">
                        {g.speler2?.schaakrating_elo ? (
                          <span className="text-sm font-normal text-yellow-600">
                            {g.speler2.schaakrating_elo}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-1 py-0.5 text-center w-[50px]">
                      {g.speler2 && playerScores.length > 0 ? (
                        <span className="text-sm font-bold text-black">
                          {getPlayerScore(g.speler2.user_id)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-1 py-0.5 text-center w-[130px]">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`px-0.5 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                            g.result && g.result !== "not_played" && g.result !== "..."
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {g.result && g.result !== "not_played" && g.result !== "..." ? g.result : "..."}
                        </span>
                        {isUserInvolvedInGame(g) && (
                          <button
                            onClick={() => handleUndoPostpone(g.game_id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors"
                            title="Uitstel ongedaan maken"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {games.map((g, idx) => (
              <div
                key={g.game_id}
                className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4"
              >
                {/* Header with Board Number and Result */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-mainAccent/10 text-mainAccent rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div className="text-sm font-medium text-gray-700">Bord {idx + 1}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        g.result && g.result !== "not_played" && g.result !== "..."
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {g.result && g.result !== "not_played" && g.result !== "..." ? g.result : "Nog te spelen"}
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
                </div>

                {/* Players */}
                <div className="space-y-4">
                  {/* White Player */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white border-2 border-neutral-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      W
                    </div>
                    <div className="flex-1 min-w-0">
                      {g.speler1 && g.speler1.voornaam && g.speler1.achternaam ? (
                        <Link
                          href={`/profile/${createUrlFriendlyName(g.speler1.voornaam, g.speler1.achternaam)}`}
                          className="font-medium text-textColor hover:text-mainAccent transition-colors block whitespace-nowrap"
                        >
                          {g.speler1.voornaam} {g.speler1.achternaam}
                        </Link>
                      ) : (
                        <div className="text-gray-600 italic text-sm">
                          Speler niet gevonden
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-0.5 text-xs">
                        {tournament?.is_youth !== true && g.speler1?.schaakrating_elo && (
                          <span className="font-normal text-yellow-600">ELIO: {g.speler1.schaakrating_elo}</span>
                        )}
                        {playerScores.length > 0 && (
                          <span className="font-bold text-black">
                            {getPlayerScore(g.speler1?.user_id || 0)} pt
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* VS Divider */}
                  <div className="flex items-center justify-center">
                    <div className="text-gray-400 text-sm font-medium">VS</div>
                  </div>

                  {/* Black Player */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      Z
                    </div>
                    <div className="flex-1 min-w-0">
                      {g.speler2 && g.speler2.voornaam && g.speler2.achternaam ? (
                        <Link
                          href={`/profile/${createUrlFriendlyName(g.speler2.voornaam, g.speler2.achternaam)}`}
                          className="font-medium text-textColor hover:text-mainAccent transition-colors block whitespace-nowrap"
                        >
                          {g.speler2.voornaam} {g.speler2.achternaam}
                        </Link>
                      ) : (
                        <div className="font-medium text-gray-500 italic whitespace-nowrap">
                          {getByeText(g.result)}
                        </div>
                      )}
                      {g.speler2 && (
                        <div className="flex items-center gap-4 mt-0.5 text-xs">
                          {tournament?.is_youth !== true && g.speler2?.schaakrating_elo && (
                            <span className="font-normal text-yellow-600">ELIO: {g.speler2.schaakrating_elo}</span>
                          )}
                          {playerScores.length > 0 && (
                            <span className="font-bold text-black">
                              {getPlayerScore(g.speler2.user_id)} pt
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Calculate standings for makeup day (shows current standings from all regular rounds)
 */
function calculateStandingsForMakeupDay(
  tournament: any, 
  rounds: any[]
): Array<{ user_id: number; voornaam: string; achternaam: string; score: number; gamesPlayed: number; tieBreak: number }> {
  if (!tournament || !rounds) return []

  // 1) init
  const scoreMap: Record<number, number> = {}
  const gamesPlayed: Record<number, number> = {}

  // deelnemers
  tournament.participations.forEach(({ user }: any) => {
    scoreMap[user.user_id] = 0
    gamesPlayed[user.user_id] = 0
  })

  // 2) score & gamesPlayed - only for regular rounds (not makeup rounds)
  rounds.forEach(({ games, type: roundType }: any) => {
    // Skip makeup rounds for points calculation - they don't count for standings
    const isMakeupRound = roundType === 'MAKEUP'
    if (isMakeupRound) return
    
    // Process all games with results (only for regular rounds)
    games.forEach(({ speler1, speler2, result }: any) => {
      const p1 = speler1.user_id
      const p2 = speler2?.user_id ?? null

      // Only count games that are actually played (not postponed or not yet played)
      const isPlayed = result && result !== "..." && result !== "uitgesteld" && result !== null
      
      if (isPlayed) {
        gamesPlayed[p1]++
        if (p2) gamesPlayed[p2]++

        if (result?.startsWith("1-0")) {
          scoreMap[p1] += 1
        } else if (result?.startsWith("0-1") && p2) {
          scoreMap[p2] += 1
        } else if (["½-½", "1/2-1/2", "-"].includes(result)) {
          scoreMap[p1] += 0.5
          if (p2) scoreMap[p2] += 0.5
        } else if (result === "0.5-0") {
          scoreMap[p1] += 0.5
        } else if (result?.startsWith("ABS-")) {
          const absScore = parseFloat(result.substring(4)) || 0
          scoreMap[p1] += absScore
        }
      }
    })
  })

  // 3) return standings
  return tournament.participations
    .map(({ user }: any) => ({
      user_id: user.user_id,
      voornaam: user.voornaam,
      achternaam: user.achternaam,
      score: scoreMap[user.user_id] || 0,
      gamesPlayed: gamesPlayed[user.user_id] || 0,
      tieBreak: 0, // Not needed for pairing display
    }))
}

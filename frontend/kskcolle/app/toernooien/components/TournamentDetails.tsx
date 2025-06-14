"use client"
import { useParams } from "next/navigation"
import useSWR from "swr"
import RoundPairings from "./RoundPairings"
import Standings from "./Standings"
import { getById, getAll } from "../../api/index"
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

type MakeupDay = {
  id: number
  tournament_id: number
  round_after: number
  date: string
  label: string | null
}

export default function TournamentDetails() {
  const { id } = useParams()
  const tournamentId = Number(id)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeline, setTimeline] = useState<
    ({ kind: "round"; round: Round } | { kind: "makeup"; day: MakeupDay; games: Game[] })[]
  >([])

  // 1) toernooi ophalen (inclusief rounds + games)
  const { data: tournament, error: tournamentError } = useSWR(`tournament/${tournamentId}`, () =>
    getById(`tournament/${tournamentId}`),
  )

  // 2) inhaaldagen ophalen
  const { data: makeupDays = [] } = useSWR<MakeupDay[]>(`makeupDay?tournament_id=${tournamentId}`, () =>
    getAll(`makeupDay?tournament_id=${tournamentId}`),
  )

  useEffect(() => {
    if (tournament && makeupDays) {
      const rounds: Round[] = tournament.rounds

      // 3) timeline bouwen: voor elke officiële ronde + inhaaldagen ná die ronde
      type Entry = { kind: "round"; round: Round } | { kind: "makeup"; day: MakeupDay; games: Game[] }

      const newTimeline: Entry[] = []
      for (let r = 1; r <= tournament.rondes; r++) {
        // officiële ronde (stub indien nog niet gegenereerd)
        const found = rounds.find((x) => x.ronde_nummer === r)
        newTimeline.push({
          kind: "round",
          round: found ?? { round_id: 0, ronde_nummer: r, games: [] },
        })

        // inhaaldagen ná ronde r
        makeupDays
          .filter((md) => md.round_after === r)
          .forEach((md) => {
            // alle games die precies op deze inhaaldag zijn uitgesteld
            const games: Game[] = rounds
              .flatMap((x) => x.games)
              .filter((g) => g.uitgestelde_datum && isSameDay(parseISO(g.uitgestelde_datum), parseISO(md.date)))
            newTimeline.push({ kind: "makeup", day: md, games })
          })
      }
      setTimeline(newTimeline)
    }
  }, [tournament, makeupDays])

  useEffect(() => {
    if (!tournament) {
      return
    }
  }, [tournament])

  // Bepaal de standaard ronde (laatste ronde met resultaten + 1)
  useEffect(() => {
    if (timeline.length > 0) {
      let defaultIndex = 0

      // Zoek de laatste ronde met resultaten
      for (let i = timeline.length - 1; i >= 0; i--) {
        const entry = timeline[i]
        if (entry.kind === "round" && entry.round.games && entry.round.games.length > 0) {
          const hasResults = entry.round.games.some((game) => game.result !== null)
          if (hasResults) {
            // Neem de volgende ronde als die bestaat
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      {tournament && (
        <div className="bg-white shadow-sm border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-mainAccent/10 p-3 rounded-xl">
                <Trophy className="h-8 w-8 text-mainAccent" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-textColor">{tournament.naam}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{tournament.participations?.length || 0} spelers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{tournament.rondes} rondes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Rounds & Makeup Days with Navigation */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Calendar className="h-6 w-6" />
                    Rondes & Inhaaldagen
                  </h2>

                  {/* Navigation Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToPrevious}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                      disabled={timeline.length <= 1}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="px-4 py-2 bg-white/20 rounded-lg text-white font-medium min-w-[120px] text-center">
                      {currentEntry?.kind === "round"
                        ? `Ronde ${currentEntry.round.ronde_nummer}`
                        : `Inhaaldag ${currentEntry?.day.label}`}
                    </div>

                    <button
                      onClick={goToNext}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
                      disabled={timeline.length <= 1}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Round Indicators */}
                <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
                  {timeline.map((entry, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        index === currentIndex ? "bg-white text-mainAccent" : "bg-white/20 text-white hover:bg-white/30"
                      }`}
                    >
                      {entry.kind === "round" ? `R${entry.round.ronde_nummer}` : `I${entry.day.id}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Round/Makeup Day Content */}
              <div className="p-8 min-h-[500px]">
                {currentEntry ? (
                  currentEntry.kind === "round" ? (
                    <RoundPairings round={currentEntry.round} />
                  ) : (
                    <MakeupPairings day={currentEntry.day} games={currentEntry.games} />
                  )
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Geen rondes beschikbaar</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Standings */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-8">
              <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Trophy className="h-6 w-6" />
                  Stand
                </h2>
              </div>
              <div className="p-6">{tournament && <Standings tournament={tournament} rounds={rounds} />}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Component om een inhaaldag + bijbehorende partijen te tonen
function MakeupPairings({ day, games }: { day: MakeupDay; games: Game[] }) {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-textColor mb-2 flex items-center gap-2">
          <div className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
            I
          </div>
          Inhaaldag {day.label}
        </h3>
        <p className="text-gray-600 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {format(parseISO(day.date), "dd-MM-yyyy")}
        </p>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-amber-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-10 w-10 text-amber-500" />
          </div>
          <h4 className="text-lg font-semibold text-gray-700 mb-2">Geen uitgestelde partijen</h4>
          <p className="text-gray-500">Er zijn geen partijen uitgesteld naar deze inhaaldag.</p>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-amber-200 to-orange-200">
                <th className="p-4 text-left font-semibold text-amber-800">Wit</th>
                <th className="p-4 text-center font-semibold text-amber-800 w-12"></th>
                <th className="p-4 text-left font-semibold text-amber-800">Zwart</th>
                <th className="p-4 text-center font-semibold text-amber-800">Uitslag</th>
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
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white border-2 border-amber-300 rounded-full flex items-center justify-center text-xs font-bold">
                        W
                      </div>
                      <span className="font-medium text-gray-800">
                        {g.speler1.voornaam} {g.speler1.achternaam}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="text-amber-400">vs</div>
                  </td>
                  <td className="p-4">
                    {g.speler2 ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          Z
                        </div>
                        <span className="font-medium text-gray-800">
                          {g.speler2.voornaam} {g.speler2.achternaam}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-amber-600 italic">
                        <div className="w-8 h-8 bg-amber-200 border-2 border-amber-300 rounded-full flex items-center justify-center text-xs">
                          -
                        </div>
                        Bye
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
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

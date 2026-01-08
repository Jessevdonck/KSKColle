"use client"

import { useAuth } from "../../contexts/auth"
import PrivateRoute from "../components/PrivateRoute"
import useSWR from "swr"
import { getAllPuzzles } from "../api/index"
import { Puzzle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { useState, useEffect } from "react"

interface PuzzleData {
  puzzle_id: number
  name: string
  start_position: string
  active_color: string
  solution: Array<{ from: string; to: string }>
  created_by: number
  created_at: string
  updated_at: string
}

export default function PuzzlesPage() {
  const [isMounted, setIsMounted] = useState(false)
  const { data: puzzles, error, isLoading } = useSWR<PuzzleData[]>(
    "puzzles",
    getAllPuzzles
  )

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-mainAccent/10 rounded-full p-3">
                <Puzzle className="h-8 w-8 text-mainAccent" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Schaakpuzzels</h1>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent"></div>
              <p className="mt-4 text-gray-600">Puzzels laden...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">Er is een fout opgetreden bij het laden van de puzzels.</p>
            </div>
          )}

          {!isLoading && !error && puzzles && puzzles.length === 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <Puzzle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Er zijn nog geen puzzels beschikbaar.</p>
            </div>
          )}

          {!isLoading && !error && puzzles && puzzles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {puzzles.map((puzzle) => (
                <Link
                  key={puzzle.puzzle_id}
                  href={`/puzzels/${puzzle.puzzle_id}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex-1">
                      {puzzle.name}
                    </h2>
                    <div className="ml-2">
                      <Puzzle className="h-5 w-5 text-mainAccent" />
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Zetten:</span>
                      <span>{puzzle.solution.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Aan zet:</span>
                      <span className="capitalize">
                        {puzzle.active_color === "white" ? "Wit" : "Zwart"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Gemaakt op:</span>
                      <span>
                        {isMounted ? format(new Date(puzzle.created_at), "d MMM yyyy", { locale: nl }) : "..."}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-mainAccent font-semibold hover:text-mainAccentDark transition-colors">
                      Puzzel oplossen →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PrivateRoute>
  )
}


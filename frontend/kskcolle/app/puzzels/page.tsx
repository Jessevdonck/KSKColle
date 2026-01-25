"use client"

import PrivateRoute from "../components/PrivateRoute"
import useSWR from "swr"
import { getAllPuzzles, deletePuzzle, getPuzzleById, savePuzzleAttempt, getPuzzleLeaderboard, getUserPuzzleAttempt } from "../api/index"
import { Puzzle, Trash2, ChevronLeft, ChevronRight, Trophy, CheckCircle } from "lucide-react"
import { format, parseISO } from "date-fns"
import { nl } from "date-fns/locale"
import { useState, useEffect, useMemo } from "react"
import { useAuth } from "../contexts/auth"
import { isPuzzleMaster } from "@/lib/roleUtils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Chess } from "chess.js"
import ChessBoard from "../admin/puzzles/components/ChessBoard"
import Link from "next/link"

// Analog Clock Component
function AnalogClock({ solveTimeMs }: { solveTimeMs: number }) {
  const totalSeconds = Math.floor(solveTimeMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  
  // Calculate angles for clock hands
  // Minute hand: 360 degrees / 60 minutes = 6 degrees per minute
  const minuteAngle = (minutes % 60) * 6
  // Second hand: 360 degrees / 60 seconds = 6 degrees per second
  const secondAngle = seconds * 6

  // Use CSS variables for mainAccent colors
  const mainAccentColor = '#deb71d'
  const mainAccentDarkColor = '#d4ae17'

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Outer circle with gradient */}
        <defs>
          <linearGradient id="clockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={mainAccentColor} stopOpacity="0.1" />
            <stop offset="100%" stopColor={mainAccentDarkColor} stopOpacity="0.2" />
          </linearGradient>
        </defs>
        
        {/* Clock face */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#clockGradient)"
          stroke={mainAccentColor}
          strokeWidth="1.5"
        />
        
        {/* Inner circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="white"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
        
        {/* Hour markers (12, 3, 6, 9) */}
        {[0, 15, 30, 45].map((minute) => {
          const angle = (minute * 6 - 90) * (Math.PI / 180)
          const x1 = 50 + 38 * Math.cos(angle)
          const y1 = 50 + 38 * Math.sin(angle)
          const x2 = 50 + 43 * Math.cos(angle)
          const y2 = 50 + 43 * Math.sin(angle)
          return (
            <line
              key={minute}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={mainAccentColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )
        })}
        
        {/* Minute hand (shows minutes) - mainAccent */}
        <g transform={`rotate(${minuteAngle} 50 50)`}>
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="25"
            stroke={mainAccentColor}
            strokeWidth="4"
            strokeLinecap="round"
            style={{
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </g>
        
        {/* Second hand (shows seconds) - mainAccentDark */}
        <g transform={`rotate(${secondAngle} 50 50)`}>
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="20"
            stroke={mainAccentDarkColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </g>
        
        {/* Center dot */}
        <circle
          cx="50"
          cy="50"
          r="4"
          fill={mainAccentColor}
        />
        <circle
          cx="50"
          cy="50"
          r="2"
          fill="white"
        />
      </svg>
    </div>
  )
}

interface PuzzleData {
  puzzle_id: number
  name: string
  start_position: string
  active_color: string
  solution: Array<{ from: string; to: string }>
  created_by: number
  created_at: string
  updated_at: string
  creator?: {
    user_id: number
    voornaam: string
    achternaam: string
  }
}

export default function PuzzlesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<number | null>(null)

  const { data: puzzles, error, isLoading, mutate } = useSWR<PuzzleData[]>(
    "puzzles",
    getAllPuzzles,
    { revalidateOnFocus: false }
  )

  // Sort puzzles by created_at DESC (newest first)
  const sortedPuzzles = useMemo(() => {
    if (!puzzles) return []
    return [...puzzles].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [puzzles])

  // Get current puzzle (selected or latest)
  const currentPuzzleId = selectedPuzzleId || (sortedPuzzles.length > 0 ? sortedPuzzles[0].puzzle_id : null)
  
  const { data: currentPuzzle } = useSWR<PuzzleData>(
    currentPuzzleId ? `puzzle-${currentPuzzleId}` : null,
    () => getPuzzleById(currentPuzzleId!),
    { revalidateOnFocus: false }
  )

  // Find current puzzle index
  const currentIndex = useMemo(() => {
    if (!currentPuzzleId || !sortedPuzzles.length) return -1
    return sortedPuzzles.findIndex(p => p.puzzle_id === currentPuzzleId)
  }, [currentPuzzleId, sortedPuzzles])

  const canDelete = isPuzzleMaster(user)
  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex >= 0 && currentIndex < sortedPuzzles.length - 1

  // Puzzle solving state
  const [currentGame, setCurrentGame] = useState<Chess | null>(null)
  const [allMoves, setAllMoves] = useState<Array<{ from: string; to: string }>>([])
  const [isSolved, setIsSolved] = useState(false)
  const [resetCounter, setResetCounter] = useState(0)
  const [errorSquare, setErrorSquare] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [userAttempt, setUserAttempt] = useState<any | null>(null)
  const [solvedTime, setSolvedTime] = useState<number | null>(null)


  // Format time helper
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    const remainingMs = ms % 1000
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${Math.floor(remainingMs / 100).toString().padStart(1, '0')}`
    }
    return `${remainingSeconds}.${Math.floor(remainingMs / 100).toString().padStart(1, '0')}s`
  }

  // Check if it's user's turn
  const isUserTurn = (moveIndex: number): boolean => {
    if (!currentPuzzle || !currentGame) return false
    const isEvenIndex = moveIndex % 2 === 0
    const currentTurn = currentGame.turn()
    const userColor = currentPuzzle.active_color === "white" ? "w" : "b"
    return isEvenIndex && currentTurn === userColor
  }

  // Load leaderboard and user attempt when puzzle changes
  useEffect(() => {
    if (currentPuzzleId) {
      getPuzzleLeaderboard(currentPuzzleId)
        .then((data) => {
          setLeaderboard(data)
        })
        .catch((error) => {
          console.error("Error loading leaderboard:", error)
        })
      
      getUserPuzzleAttempt(currentPuzzleId)
        .then((attempt) => {
          if (attempt) {
            setUserAttempt(attempt)
            setIsSolved(true)
          } else {
            setUserAttempt(null)
            setIsSolved(false)
          }
        })
        .catch((error) => {
          console.error("Error checking user attempt:", error)
        })
    }
  }, [currentPuzzleId])

  // Initialize game when puzzle loads
  useEffect(() => {
    if (currentPuzzle && !userAttempt) {
      try {
        const game = new Chess(currentPuzzle.start_position)
        setCurrentGame(game)
        setAllMoves([])
        setIsSolved(false)
        setResetCounter(0)
        setErrorSquare(null)
        setSolvedTime(null)
        const now = Date.now()
        setStartTime(now)
        setCurrentTime(0)
      } catch (error) {
        console.error("Error initializing puzzle:", error)
        toast({
          title: "Fout",
          description: "Kon de puzzel niet laden. Ongeldige startpositie.",
          variant: "destructive",
        })
      }
    } else if (currentPuzzle && userAttempt) {
      try {
        const game = new Chess(currentPuzzle.start_position)
        for (const move of currentPuzzle.solution) {
          game.move({ from: move.from, to: move.to })
        }
        setCurrentGame(game)
        setAllMoves(currentPuzzle.solution)
      } catch (error) {
        console.error("Error loading solved puzzle:", error)
      }
    }
  }, [currentPuzzle, userAttempt, toast])

  // Update timer
  useEffect(() => {
    if (!startTime || isSolved) return
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      setCurrentTime(elapsed)
    }, 100)
    return () => clearInterval(interval)
  }, [startTime, isSolved])

  const resetToLastCorrectPosition = () => {
    if (!currentPuzzle) return
    try {
      const game = new Chess(currentPuzzle.start_position)
      for (let i = 0; i < allMoves.length; i++) {
        game.move({ from: allMoves[i].from, to: allMoves[i].to })
      }
      setCurrentGame(game)
      setResetCounter(prev => prev + 1)
    } catch (error) {
      console.error("Error resetting puzzle:", error)
    }
  }

  const handleMove = (from: string, to: string) => {
    if (!currentGame || isSolved || userAttempt || !currentPuzzle) return

    if (!isUserTurn(allMoves.length)) {
      toast({
        title: "Niet jouw beurt",
        description: "Wacht op de tegenstander.",
        variant: "destructive",
      })
      return
    }

    try {
      const moveIndex = allMoves.length
      const expectedMove = currentPuzzle.solution[moveIndex]
      if (!expectedMove) {
        setErrorSquare(to)
        setTimeout(() => {
          resetToLastCorrectPosition()
          setErrorSquare(null)
        }, 800)
        return
      }

      if (expectedMove.from !== from || expectedMove.to !== to) {
        setErrorSquare(to)
        setTimeout(() => {
          resetToLastCorrectPosition()
          setErrorSquare(null)
        }, 800)
        return
      }

      const move = currentGame.move({ from, to })
      if (!move) {
        toast({
          title: "Ongeldige zet",
          description: "Deze zet is niet toegestaan.",
          variant: "destructive",
        })
        return
      }

      const newAllMoves = [...allMoves, { from, to }]
      setAllMoves(newAllMoves)

      // Check if puzzle is solved
      if (newAllMoves.length === currentPuzzle.solution.length) {
        setIsSolved(true)
        const solveTime = Date.now() - (startTime || Date.now())
        setSolvedTime(solveTime) // Store solved time immediately
        setStartTime(null) // Stop the live timer
        
        savePuzzleAttempt(currentPuzzle.puzzle_id, solveTime)
          .then(() => {
            toast({
              title: "Gefeliciteerd!",
              description: "Je hebt de puzzel correct opgelost!",
            })
            // Reload leaderboard
            getPuzzleLeaderboard(currentPuzzle.puzzle_id).then(setLeaderboard)
            getUserPuzzleAttempt(currentPuzzle.puzzle_id).then((attempt) => {
              setUserAttempt(attempt)
              setSolvedTime(null) // Clear solvedTime once userAttempt is loaded
            })
          })
          .catch((error) => {
            console.error("Error saving attempt:", error)
          })
      } else {
        // Auto-play opponent's move
        setTimeout(() => {
          const nextMoveIndex = newAllMoves.length
          const nextMove = currentPuzzle.solution[nextMoveIndex]
          if (nextMove && currentGame) {
            try {
              currentGame.move({ from: nextMove.from, to: nextMove.to })
              setAllMoves([...newAllMoves, nextMove])
              setCurrentGame(new Chess(currentGame.fen()))
              setResetCounter(prev => prev + 1)
            } catch (error) {
              console.error("Error playing opponent move:", error)
            }
          }
        }, 300)
      }
    } catch (error) {
      console.error("Error handling move:", error)
    }
  }

  const handleDelete = async (puzzleId: number, puzzleName: string) => {
    if (!confirm(`Weet je zeker dat je de puzzel "${puzzleName}" wilt verwijderen?`)) {
      return
    }

    try {
      await deletePuzzle(puzzleId)
      toast({
        title: "Succes!",
        description: "Puzzel verwijderd",
      })
      mutate()
      // If deleted puzzle was current, go to next or previous
      if (puzzleId === currentPuzzleId) {
        if (canGoNext) {
          setSelectedPuzzleId(sortedPuzzles[currentIndex + 1].puzzle_id)
        } else if (canGoPrevious) {
          setSelectedPuzzleId(sortedPuzzles[currentIndex - 1].puzzle_id)
        } else {
          setSelectedPuzzleId(null)
        }
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Kon puzzel niet verwijderen"
      toast({
        title: "Fout",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const goToPrevious = () => {
    if (canGoPrevious && currentIndex > 0) {
      setSelectedPuzzleId(sortedPuzzles[currentIndex - 1].puzzle_id)
    }
  }

  const goToNext = () => {
    if (canGoNext && currentIndex < sortedPuzzles.length - 1) {
      setSelectedPuzzleId(sortedPuzzles[currentIndex + 1].puzzle_id)
    }
  }


  if (isLoading) {
    return (
      <PrivateRoute>
        <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent"></div>
            <p className="mt-4 text-gray-600">Puzzels laden...</p>
          </div>
        </div>
      </PrivateRoute>
    )
  }

  if (error) {
    return (
      <PrivateRoute>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Er is een fout opgetreden bij het laden van de puzzels.</p>
            </div>
          </div>
        </div>
      </PrivateRoute>
    )
  }

  if (!puzzles || puzzles.length === 0) {
    return (
      <PrivateRoute>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <Puzzle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Er zijn nog geen puzzels beschikbaar.</p>
            </div>
          </div>
        </div>
      </PrivateRoute>
    )
  }

  if (!currentPuzzle) {
    return (
      <PrivateRoute>
        <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent"></div>
            <p className="mt-4 text-gray-600">Puzzel laden...</p>
          </div>
        </div>
      </PrivateRoute>
    )
  }

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with navigation */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevious}
                    disabled={!canGoPrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNext}
                    disabled={!canGoNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{currentPuzzle.name}</h1>
                  <p className="text-gray-600 mt-1 flex items-center gap-2 flex-wrap">
                    <span>Aan zet: <span className="capitalize font-medium">
                      {currentPuzzle.active_color === "white" ? "Wit" : "Zwart"}
                    </span></span>
                    {currentPuzzle.creator && (
                      <> • Door: <span className="font-medium">{currentPuzzle.creator.voornaam} {currentPuzzle.creator.achternaam}</span></>
                    )}
                    {currentPuzzle.created_at && (
                      <> • {format(parseISO(currentPuzzle.created_at), "d MMM yyyy", { locale: nl })}</>
                    )}
                    {isSolved || userAttempt ? (
                      <Link href={`/puzzels/${currentPuzzle.puzzle_id}`}>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer transition-colors">
                          Voltooid
                        </span>
                      </Link>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Niet Voltooid
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(currentPuzzle.puzzle_id, currentPuzzle.name)}
                    className="hover:bg-red-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chess board */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-center mb-4">
                  {currentGame && (
                    <ChessBoard
                      key={`${currentGame.fen()}-${resetCounter}-${allMoves.length}`}
                      fen={currentGame.fen()}
                      onMove={handleMove}
                      draggable={!isSolved && !userAttempt && isUserTurn(allMoves.length)}
                      orientation={currentPuzzle.active_color === "white" ? "white" : "black"}
                      highlightedSquares={[]}
                      errorSquare={errorSquare}
                      freePlacement={false}
                      showPiecePalette={false}
                    />
                  )}
                </div>

                {isSolved && !userAttempt && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-green-800 font-medium">Gefeliciteerd! Je hebt de puzzel correct opgelost!</p>
                  </div>
                )}
                {userAttempt && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <p className="text-blue-800 font-medium">Je hebt deze puzzel al opgelost! Bekijk het leaderboard om te zien hoe je het doet.</p>
                  </div>
                )}

              </div>
            </div>

            {/* Leaderboard */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6">
                {/* Analog Clock Display (always visible) */}
                <div className="mb-6 flex flex-col items-center">
                  <AnalogClock 
                    solveTimeMs={
                      userAttempt?.solve_time_ms || 
                      solvedTime || 
                      currentTime || 
                      0
                    } 
                  />
                  <div className="mt-4 text-center">
                    <div className={`text-2xl font-bold font-mono ${
                      userAttempt || solvedTime 
                        ? 'text-green-600' 
                        : 'text-mainAccent'
                    }`}>
                      {formatTime(
                        userAttempt?.solve_time_ms || 
                        solvedTime || 
                        currentTime || 
                        0
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {userAttempt || solvedTime ? 'Jouw tijd' : 'Live timer'}
                    </div>
                  </div>
                </div>
                
                <div className="mb-4 pb-3 border-b border-gray-200">
                  <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-mainAccent" />
                    Leaderboard
                  </h2>
                </div>
                
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {leaderboard.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nog geen oplossingen
                    </p>
                  ) : (
                    leaderboard.map((entry, index) => (
                      <div
                        key={entry.user_id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
                          index < 3 
                            ? 'bg-gradient-to-r from-mainAccent/5 to-mainAccentDark/5 border-mainAccent/20' 
                            : 'bg-white border-gray-200 hover:border-mainAccent/30'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-7 text-center text-xs font-semibold ${
                          index < 3 ? 'text-mainAccent' : 'text-gray-400'
                        }`}>
                          {index === 0 ? '1' : index === 1 ? '2' : index === 2 ? '3' : entry.rank}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {entry.voornaam} {entry.achternaam}
                          </div>
                          <div className={`text-sm font-mono flex-shrink-0 ${
                            index < 3 ? 'text-mainAccent font-semibold' : 'text-gray-500'
                          }`}>
                            {formatTime(entry.solve_time_ms)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PrivateRoute>
  )
}

"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { getAllPuzzles, getPuzzleLeaderboard, savePuzzleAttempt, getUserPuzzleAttempt } from "../api/index"
import { Puzzle, Trophy, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import ChessBoard from "../admin/puzzles/components/ChessBoard"
import { Chess } from "chess.js"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "../contexts/auth"

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

export default function LatestPuzzle() {
  const { toast } = useToast()
  const { isAuthed } = useAuth()
  const { data: puzzles, isLoading: puzzlesLoading } = useSWR<PuzzleData[]>(
    "puzzles",
    getAllPuzzles
  )

  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [currentGame, setCurrentGame] = useState<Chess | null>(null)
  const [userMoves, setUserMoves] = useState<Array<{ from: string; to: string }>>([])
  const [allMoves, setAllMoves] = useState<Array<{ from: string; to: string }>>([])
  const [isSolved, setIsSolved] = useState(false)
  const [resetCounter, setResetCounter] = useState(0)
  const [errorSquare, setErrorSquare] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [userAttempt, setUserAttempt] = useState<any | null>(null)

  // Get the latest puzzle (first in array since getAllPuzzles sorts by created_at desc)
  const latestPuzzle = puzzles && puzzles.length > 0 ? puzzles[0] : null

  // Helper function to check if it's the user's turn
  const isUserTurn = (moveIndex: number): boolean => {
    if (!latestPuzzle) return false
    // If puzzle starts with white, user moves on even indices (0, 2, 4...)
    // If puzzle starts with black, user moves on odd indices (1, 3, 5...)
    if (latestPuzzle.active_color === "white") {
      return moveIndex % 2 === 0
    } else {
      return moveIndex % 2 === 1
    }
  }

  // Reset to last correct position
  const resetToLastCorrectPosition = () => {
    if (!latestPuzzle) return

    try {
      const game = new Chess(latestPuzzle.start_position)
      
      for (const move of allMoves) {
        const moveResult = game.move({ from: move.from, to: move.to })
        if (!moveResult) {
          throw new Error(`Failed to replay move: ${move.from}-${move.to}`)
        }
      }
      
      setCurrentGame(new Chess(game.fen()))
      setResetCounter(prev => prev + 1)
      setErrorSquare(null)
    } catch (error) {
      console.error("Error resetting to last correct position:", error)
      try {
        const game = new Chess(latestPuzzle.start_position)
        setCurrentGame(new Chess(game.fen()))
        setUserMoves([])
        setAllMoves([])
        setResetCounter(prev => prev + 1)
        setErrorSquare(null)
      } catch (fallbackError) {
        console.error("Error in fallback reset:", fallbackError)
      }
    }
  }

  // Initialize chess game when puzzle loads (only if not already solved)
  useEffect(() => {
    if (latestPuzzle && !userAttempt) {
      try {
        const game = new Chess(latestPuzzle.start_position)
        setCurrentGame(game)
        setUserMoves([])
        setAllMoves([])
        setIsSolved(false)
        setResetCounter(0)
        setErrorSquare(null)
        const now = Date.now()
        setStartTime(now)
        setCurrentTime(0)
      } catch (error) {
        console.error("Error initializing puzzle:", error)
      }
    } else if (latestPuzzle && userAttempt) {
      try {
        const game = new Chess(latestPuzzle.start_position)
        for (const move of latestPuzzle.solution) {
          game.move({ from: move.from, to: move.to })
        }
        setCurrentGame(game)
        setAllMoves(latestPuzzle.solution)
        setUserMoves(latestPuzzle.solution.filter((_, index) => index % 2 === 0))
      } catch (error) {
        console.error("Error loading solved puzzle:", error)
      }
    }
  }, [latestPuzzle, userAttempt])

  // Update timer every 100ms
  useEffect(() => {
    if (!startTime || isSolved || userAttempt) {
      return
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      setCurrentTime(elapsed)
    }, 100)

    return () => clearInterval(interval)
  }, [startTime, isSolved, userAttempt])

  // Load leaderboard and check if user already solved
  useEffect(() => {
    if (latestPuzzle && isAuthed) {
      setLeaderboardLoading(true)
      getPuzzleLeaderboard(latestPuzzle.puzzle_id)
        .then((data) => {
          setLeaderboard(data)
          setLeaderboardLoading(false)
        })
        .catch((error) => {
          console.error("Error loading leaderboard:", error)
          setLeaderboardLoading(false)
        })
      
      getUserPuzzleAttempt(latestPuzzle.puzzle_id)
        .then((attempt) => {
          if (attempt) {
            setUserAttempt(attempt)
            setIsSolved(true)
          }
        })
        .catch((error) => {
          console.error("Error checking user attempt:", error)
        })
    } else if (latestPuzzle && !isAuthed) {
      // Load leaderboard even if not logged in
      setLeaderboardLoading(true)
      getPuzzleLeaderboard(latestPuzzle.puzzle_id)
        .then((data) => {
          setLeaderboard(data)
          setLeaderboardLoading(false)
        })
        .catch((error) => {
          console.error("Error loading leaderboard:", error)
          setLeaderboardLoading(false)
        })
    }
  }, [latestPuzzle, isAuthed, isSolved])

  const handleMove = (from: string, to: string) => {
    if (!isAuthed) {
      toast({
        title: "Login vereist",
        description: "Je moet ingelogd zijn om puzzels op te lossen.",
        variant: "destructive",
      })
      return
    }

    if (!currentGame || isSolved || userAttempt) return

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
      const expectedMove = latestPuzzle!.solution[moveIndex]
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

      const newUserMoves = [...userMoves, { from, to }]
      const newAllMoves = [...allMoves, { from, to }]
      setUserMoves(newUserMoves)
      setAllMoves(newAllMoves)

      if (newAllMoves.length === latestPuzzle!.solution.length) {
        if (startTime) {
          const solveTimeMs = Date.now() - startTime
          setIsSolved(true)
          
          savePuzzleAttempt(latestPuzzle!.puzzle_id, solveTimeMs)
            .then(() => getPuzzleLeaderboard(latestPuzzle!.puzzle_id))
            .then((updatedLeaderboard) => {
              setLeaderboard(updatedLeaderboard)
            })
            .catch((error) => {
              console.error("Error saving puzzle attempt:", error)
              toast({
                title: "Fout",
                description: error.response?.data?.message || "Kon de oplossing niet opslaan.",
                variant: "destructive",
              })
            })
          
          toast({
            title: "Gefeliciteerd!",
            description: `Je hebt de puzzel opgelost in ${formatTime(solveTimeMs)}!`,
            variant: "default",
          })
        } else {
          setIsSolved(true)
          toast({
            title: "Gefeliciteerd!",
            description: "Je hebt de puzzel correct opgelost!",
            variant: "default",
          })
        }
        return
      }

      const nextMoveIndex = newAllMoves.length
      if (nextMoveIndex < latestPuzzle!.solution.length && !isUserTurn(nextMoveIndex)) {
        const opponentMove = latestPuzzle!.solution[nextMoveIndex]
        setTimeout(() => {
          try {
            const opponentMoveResult = currentGame.move({
              from: opponentMove.from,
              to: opponentMove.to,
            })
            if (opponentMoveResult) {
              setAllMoves([...newAllMoves, opponentMove])
              if (newAllMoves.length + 1 === latestPuzzle!.solution.length) {
                if (startTime) {
                  const solveTimeMs = Date.now() - startTime
                  setIsSolved(true)
                  
                  savePuzzleAttempt(latestPuzzle!.puzzle_id, solveTimeMs)
                    .then(() => getPuzzleLeaderboard(latestPuzzle!.puzzle_id))
                    .then((updatedLeaderboard) => {
                      setLeaderboard(updatedLeaderboard)
                    })
                    .catch((error) => {
                      console.error("Error saving puzzle attempt:", error)
                      toast({
                        title: "Fout",
                        description: error.response?.data?.message || "Kon de oplossing niet opslaan.",
                        variant: "destructive",
                      })
                    })
                  
                  toast({
                    title: "Gefeliciteerd!",
                    description: `Je hebt de puzzel opgelost in ${formatTime(solveTimeMs)}!`,
                    variant: "default",
                  })
                } else {
                  setIsSolved(true)
                  toast({
                    title: "Gefeliciteerd!",
                    description: "Je hebt de puzzel correct opgelost!",
                    variant: "default",
                  })
                }
              }
            }
          } catch (error) {
            console.error("Error making opponent move:", error)
          }
        }, 300)
      }
    } catch (error) {
      console.error("Error making move:", error)
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het uitvoeren van de zet.",
        variant: "destructive",
      })
    }
  }

  // Don't render if no puzzles exist
  if (puzzlesLoading || !latestPuzzle) {
    return null
  }

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="bg-mainAccent/10 p-4 rounded-xl inline-flex mb-6">
              <Puzzle className="h-12 w-12 text-mainAccent" />
            </div>
            <h2 className="text-4xl font-bold text-textColor mb-4">Laatste Schaakpuzzel</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Probeer de nieuwste puzzel op te lossen en zie hoe je het doet op de leaderboard!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Puzzle Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg p-8 border border-gray-200">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {latestPuzzle.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Zetten:</span>
                      <span>{latestPuzzle.solution.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Aan zet:</span>
                      <span className="capitalize">
                        {latestPuzzle.active_color === "white" ? "Wit" : "Zwart"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <Puzzle className="h-8 w-8 text-mainAccent" />
                </div>
              </div>

              {/* Chess Board */}
              <div className="mb-6 flex justify-center">
                {currentGame && (
                  <ChessBoard
                    key={`${currentGame.fen()}-${resetCounter}-${allMoves.length}`}
                    fen={currentGame.fen()}
                    onMove={handleMove}
                    draggable={!isSolved && !userAttempt && isAuthed && isUserTurn(allMoves.length)}
                    orientation={latestPuzzle.active_color === "white" ? "white" : "black"}
                    highlightedSquares={[]}
                    errorSquare={errorSquare}
                    freePlacement={false}
                    showPiecePalette={false}
                  />
                )}
              </div>

              {/* Status info */}
              <div className="space-y-2 text-sm mb-4">
                {startTime && !isSolved && !userAttempt && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Tijd: {formatTime(currentTime)}</span>
                  </div>
                )}
                {userAttempt && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Jouw tijd: {formatTime(userAttempt.solve_time_ms)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Status:</span>
                  <span className={isSolved || userAttempt ? "text-green-600 font-medium" : "text-gray-600"}>
                    {isSolved || userAttempt ? "Opgelost" : "Bezig..."}
                  </span>
                </div>
              </div>

              {!isAuthed && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800 text-center">
                    Log in om deze puzzel op te lossen
                  </p>
                </div>
              )}
            </div>

            {/* Leaderboard Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Leaderboard
                </h3>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {leaderboardLoading ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-mainAccent"></div>
                    <p className="mt-2 text-sm text-gray-500">Leaderboard laden...</p>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nog geen oplossingen
                  </p>
                ) : (
                  leaderboard.map((entry, index) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                        index === 1 ? 'bg-gray-50 border border-gray-200' :
                        index === 2 ? 'bg-orange-50 border border-orange-200' :
                        'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-8 text-center font-bold ${
                        index === 0 ? 'text-yellow-600' :
                        index === 1 ? 'text-gray-600' :
                        index === 2 ? 'text-orange-600' :
                        'text-gray-500'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${entry.rank}`}
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <div className="font-medium text-gray-900 truncate">
                          {entry.voornaam} {entry.achternaam}
                        </div>
                        <div className="text-sm text-gray-500 font-mono flex-shrink-0">
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
    </section>
  )
}


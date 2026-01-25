"use client"

import { useParams, useRouter } from "next/navigation"
import PrivateRoute from "../../components/PrivateRoute"
import useSWR from "swr"
import { getPuzzleById, savePuzzleAttempt, getPuzzleLeaderboard, getUserPuzzleAttempt } from "../../api/index"
import { useState, useEffect } from "react"
import { Chess } from "chess.js"
import ChessBoard from "../../admin/puzzles/components/ChessBoard"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, CheckCircle, AlertCircle, Trophy, Clock } from "lucide-react"
import Link from "next/link"

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

export default function PuzzleSolvePage() {
  const params = useParams()
  const { toast } = useToast()
  const puzzleId = Number(params.id)

  const { data: puzzle, error, isLoading } = useSWR<PuzzleData>(
    puzzleId ? `puzzle-${puzzleId}` : null,
    () => getPuzzleById(puzzleId),
    { revalidateOnFocus: false }
  )

  const [currentGame, setCurrentGame] = useState<Chess | null>(null)
  const [userMoves, setUserMoves] = useState<Array<{ from: string; to: string }>>([])
  const [allMoves, setAllMoves] = useState<Array<{ from: string; to: string }>>([]) // All moves including opponent's
  const [isSolved, setIsSolved] = useState(false)
  const [resetCounter, setResetCounter] = useState(0) // Force re-render of ChessBoard on reset
  const [errorSquare, setErrorSquare] = useState<string | null>(null) // Square with error indicator
  const [startTime, setStartTime] = useState<number | null>(null) // Start time in milliseconds
  const [currentTime, setCurrentTime] = useState<number>(0) // Current elapsed time in milliseconds
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [userAttempt, setUserAttempt] = useState<any | null>(null) // User's previous attempt if exists

  // Format time in milliseconds to readable format
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

  // Helper function to check if it's the user's turn
  const isUserTurn = (moveIndex: number): boolean => {
    if (!puzzle || !currentGame) return false
    // The user plays the color that matches active_color
    // Move 0 is always by active_color (user)
    // Move 1 is by the opponent (auto)
    // Move 2 is by active_color again (user)
    // So user always plays on even indices (0, 2, 4, ...)
    // But we should also check if the current turn matches
    const isEvenIndex = moveIndex % 2 === 0
    const currentTurn = currentGame.turn() // 'w' or 'b'
    const userColor = puzzle.active_color === "white" ? "w" : "b"
    return isEvenIndex && currentTurn === userColor
  }

  // Initialize game when puzzle loads (only if not already solved)
  useEffect(() => {
    if (puzzle && !userAttempt) {
      try {
        const game = new Chess(puzzle.start_position)
        setCurrentGame(game)
        setUserMoves([])
        setAllMoves([])
        setIsSolved(false)
        setResetCounter(0)
        setErrorSquare(null)
        const now = Date.now()
        setStartTime(now) // Start timer when puzzle loads
        setCurrentTime(0) // Reset current time display
      } catch (error) {
        console.error("Error initializing puzzle:", error)
        toast({
          title: "Fout",
          description: "Kon de puzzel niet laden. Ongeldige startpositie.",
          variant: "destructive",
        })
      }
    } else if (puzzle && userAttempt) {
      // User already solved, just load the position
      try {
        const game = new Chess(puzzle.start_position)
        // Replay all moves to show final position
        for (const move of puzzle.solution) {
          game.move({ from: move.from, to: move.to })
        }
        setCurrentGame(game)
        setAllMoves(puzzle.solution)
        setUserMoves(puzzle.solution.filter((_, index) => index % 2 === 0))
      } catch (error) {
        console.error("Error loading solved puzzle:", error)
      }
    }
  }, [puzzle, userAttempt, toast])

  // Update timer every 100ms for smooth display
  useEffect(() => {
    if (!startTime || isSolved) {
      return // Don't run timer if puzzle not started or already solved
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      setCurrentTime(elapsed)
    }, 100) // Update every 100ms for smooth display

    return () => clearInterval(interval)
  }, [startTime, isSolved])

  // Load leaderboard and check if user already solved
  useEffect(() => {
    if (puzzleId) {
      // Load leaderboard
      getPuzzleLeaderboard(puzzleId)
        .then((data) => {
          setLeaderboard(data)
        })
        .catch((error) => {
          console.error("Error loading leaderboard:", error)
        })
      
      // Check if user already solved this puzzle
      getUserPuzzleAttempt(puzzleId)
        .then((attempt) => {
          if (attempt) {
            setUserAttempt(attempt)
            setIsSolved(true) // Mark as solved if user already completed it
          }
        })
        .catch((error) => {
          console.error("Error checking user attempt:", error)
        })
    }
  }, [puzzleId]) // Only reload when puzzleId changes - removed isSolved to prevent infinite loop

  const handleMove = (from: string, to: string) => {
    if (!currentGame || isSolved || userAttempt) return // Don't allow moves if already solved

    // Check if it's the user's turn
    if (!isUserTurn(allMoves.length)) {
      toast({
        title: "Niet jouw beurt",
        description: "Wacht op de tegenstander.",
        variant: "destructive",
      })
      return
    }

    try {
      // Get the expected move for this index
      const moveIndex = allMoves.length
      const expectedMove = puzzle!.solution[moveIndex]
      if (!expectedMove) {
        // User has made more moves than the solution - show error and reset
        setErrorSquare(to)
        setTimeout(() => {
          resetToLastCorrectPosition()
          setErrorSquare(null)
        }, 800)
        return
      }

      // Check if the move matches the expected solution
      if (expectedMove.from !== from || expectedMove.to !== to) {
        // Wrong move - show error indicator on the destination square
        setErrorSquare(to)
        
        // Reset after a short delay to show the error
        setTimeout(() => {
          resetToLastCorrectPosition()
          setErrorSquare(null)
        }, 800) // Show error for 800ms before resetting
        return
      }

      // Move matches solution, now check if it's valid in chess.js
      const move = currentGame.move({ from, to })
      if (!move) {
        // This shouldn't happen if the puzzle is valid, but check anyway
        toast({
          title: "Ongeldige zet",
          description: "Deze zet is niet toegestaan.",
          variant: "destructive",
        })
        return
      }

      // Correct move - add to both user moves and all moves
      const newUserMoves = [...userMoves, { from, to }]
      const newAllMoves = [...allMoves, { from, to }]
      setUserMoves(newUserMoves)
      setAllMoves(newAllMoves)

      // Check if puzzle is solved (all moves completed)
      if (newAllMoves.length === puzzle!.solution.length) {
        // Puzzle solved! Calculate time and save attempt
        if (startTime) {
          const solveTimeMs = Date.now() - startTime
          setIsSolved(true)
          
          // Save attempt to leaderboard
          savePuzzleAttempt(puzzleId, solveTimeMs)
            .then((result) => {
              // Reload leaderboard
              return getPuzzleLeaderboard(puzzleId)
            })
            .then((updatedLeaderboard) => {
              setLeaderboard(updatedLeaderboard)
            })
            .catch((error) => {
              console.error("Error saving puzzle attempt:", error)
              console.error("Error details:", error.response?.data || error.message)
              toast({
                title: "Fout",
                description: error.response?.data?.message || "Kon de oplossing niet opslaan. Probeer opnieuw.",
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

      // If there's a next move and it's the opponent's turn, make it automatically
      const nextMoveIndex = newAllMoves.length
      if (nextMoveIndex < puzzle!.solution.length && !isUserTurn(nextMoveIndex)) {
        const opponentMove = puzzle!.solution[nextMoveIndex]
        setTimeout(() => {
          try {
            const opponentMoveResult = currentGame.move({
              from: opponentMove.from,
              to: opponentMove.to,
            })
            if (opponentMoveResult) {
              setAllMoves([...newAllMoves, opponentMove])
              // Check if puzzle is solved after opponent move
              if (newAllMoves.length + 1 === puzzle!.solution.length) {
                // Puzzle solved! Calculate time and save attempt
                if (startTime) {
                  const solveTimeMs = Date.now() - startTime
                  setIsSolved(true)
                  
                  // Save attempt to leaderboard
                  savePuzzleAttempt(puzzleId, solveTimeMs)
                    .then((result) => {
                      // Reload leaderboard
                      return getPuzzleLeaderboard(puzzleId)
                    })
                    .then((updatedLeaderboard) => {
                      setLeaderboard(updatedLeaderboard)
                    })
                    .catch((error) => {
                      console.error("Error saving puzzle attempt:", error)
                      console.error("Error details:", error.response?.data || error.message)
                      toast({
                        title: "Fout",
                        description: error.response?.data?.message || "Kon de oplossing niet opslaan. Probeer opnieuw.",
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
        }, 300) // Small delay for visual feedback
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

  // Reset to last correct position (reconstruct game from start with all correct moves)
  const resetToLastCorrectPosition = () => {
    if (!puzzle) return

    try {
      // Reconstruct game from start position
      const game = new Chess(puzzle.start_position)
      
      // Replay all correct moves
      for (const move of allMoves) {
        const moveResult = game.move({ from: move.from, to: move.to })
        if (!moveResult) {
          // If a move fails, reset to start as fallback
          throw new Error(`Failed to replay move: ${move.from}-${move.to}`)
        }
      }
      
      // Force update by creating a new game instance and incrementing reset counter
      // This ensures the ChessBoard component re-renders with the correct FEN
      setCurrentGame(new Chess(game.fen()))
      setResetCounter(prev => prev + 1)
      setErrorSquare(null) // Clear error indicator
    } catch (error) {
      console.error("Error resetting to last correct position:", error)
      // Fallback: reset to start
      try {
        const game = new Chess(puzzle.start_position)
        setCurrentGame(new Chess(game.fen()))
        setUserMoves([])
        setAllMoves([])
        setResetCounter(prev => prev + 1)
        setErrorSquare(null) // Clear error indicator
      } catch (fallbackError) {
        console.error("Error in fallback reset:", fallbackError)
      }
    }
  }

  if (isLoading) {
    return (
      <PrivateRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent"></div>
            <p className="mt-4 text-gray-600">Puzzel laden...</p>
          </div>
        </div>
      </PrivateRoute>
    )
  }

  if (error || !puzzle) {
    return (
      <PrivateRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Puzzel niet gevonden</h2>
            <p className="text-gray-600 mb-4">De puzzel die je zoekt bestaat niet of is verwijderd.</p>
            <Link href="/puzzels">
              <Button>Terug naar puzzels</Button>
            </Link>
          </div>
        </div>
      </PrivateRoute>
    )
  }

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/puzzels">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Terug
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{puzzle.name}</h1>
                  <p className="text-gray-600 mt-1">
                    Aan zet: <span className="capitalize font-medium">
                      {puzzle.active_color === "white" ? "Wit" : "Zwart"}
                    </span> • {puzzle.solution.length} {puzzle.solution.length === 1 ? "zet" : "zetten"}
                    {puzzle.creator && (
                      <span> • Door: <span className="font-medium">{puzzle.creator.voornaam} {puzzle.creator.achternaam}</span></span>
                    )}
                  </p>
                </div>
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
                      orientation={puzzle.active_color === "white" ? "white" : "black"}
                      highlightedSquares={[]}
                      errorSquare={errorSquare}
                      freePlacement={false}
                      showPiecePalette={false}
                    />
                  )}
                </div>

                {/* Status message */}
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

            {/* Info panel */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Puzzel informatie</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Jouw zetten:</span>
                    <span className="ml-2 text-gray-900">{userMoves.length} / {Math.ceil(puzzle.solution.length / 2)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Totaal zetten:</span>
                    <span className="ml-2 text-gray-900">{allMoves.length} / {puzzle.solution.length}</span>
                  </div>
                  {startTime && !isSolved && !userAttempt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Tijd:</span>
                      <span className="text-gray-900 font-mono">{formatTime(currentTime)}</span>
                    </div>
                  )}
                  {userAttempt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-gray-700">Jouw tijd:</span>
                      <span className="text-green-600 font-mono font-semibold">{formatTime(userAttempt.solve_time_ms)}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className="ml-2">
                      {isSolved || userAttempt ? (
                        <span className="text-green-600 font-medium">Opgelost</span>
                      ) : (
                        <span className="text-gray-600">Bezig...</span>
                      )}
                    </span>
                  </div>
                </div>

                {(isSolved || userAttempt) && (
                  <div className="mt-6">
                    <Link href="/puzzels">
                      <Button className="w-full">
                        Terug naar puzzels
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Leaderboard */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Leaderboard
                  </h2>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {leaderboard.length === 0 ? (
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
      </div>
    </PrivateRoute>
  )
}


"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../contexts/auth"
import { isPuzzleMaster } from "@/lib/roleUtils"
import PrivateRoute from "../../components/PrivateRoute"
import ChessBoard from "./components/ChessBoard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPuzzle } from "../../api/index"
import { useToast } from "@/hooks/use-toast"
import { Chess } from "chess.js"
import { ArrowRight, ArrowLeft, Check, Loader2, RotateCcw } from "lucide-react"

type Step = 1 | 2 | 3

export default function PuzzleCreationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  
  // Step 1: Start position
  const [startFen, setStartFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
  const [activeColor, setActiveColor] = useState<"white" | "black">("white")
  
  // Step 2: Solution
  const [solution, setSolution] = useState<Array<{ from: string; to: string }>>([])
  const [currentGame, setCurrentGame] = useState<Chess | null>(null)
  
  // Step 3: Name
  const [puzzleName, setPuzzleName] = useState("")
  
  // Board orientation for step 1 and 2
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white")

  // Check access
  if (!isPuzzleMaster(user)) {
    return (
      <PrivateRoute>
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">Toegang Geweigerd</h2>
            <p className="text-gray-600">Je hebt geen toegang tot deze pagina. Je moet Puzzlemaster of Admin zijn.</p>
          </div>
        </div>
      </PrivateRoute>
    )
  }

  // Normalize FEN string to ensure it's valid (must have 6 space-delimited fields)
  const normalizeFen = (fenString: string): string => {
    if (!fenString || fenString.trim() === '') {
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    }
    
    const parts = fenString.trim().split(/\s+/)
    
    // FEN must have exactly 6 fields
    if (parts.length === 0 || !parts[0]) {
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    }
    
    // Fill in missing fields with defaults
    const piecePlacement = parts[0] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'
    const activeColor = parts[1] || 'w'
    const castling = parts[2] || '-'
    const enPassant = parts[3] || '-'
    const halfmoveClock = parts[4] || '0'
    const fullmoveNumber = parts[5] || '1'
    
    // Validate and fix move numbers
    let halfmove = parseInt(halfmoveClock, 10)
    if (isNaN(halfmove) || halfmove < 0) {
      halfmove = 0
    }
    
    let fullmove = parseInt(fullmoveNumber, 10)
    if (isNaN(fullmove) || fullmove < 1) {
      fullmove = 1
    }
    
    // Return normalized FEN with all 6 fields
    return `${piecePlacement} ${activeColor} ${castling} ${enPassant} ${halfmove} ${fullmove}`
  }

  const handleStartPositionChange = (newFen: string) => {
    const normalizedFen = normalizeFen(newFen)
    setStartFen(normalizedFen)
    try {
      const game = new Chess(normalizedFen)
      setCurrentGame(game)
      setSolution([]) // Reset solution when position changes
    } catch (e) {
      // Invalid FEN (e.g., missing kings) - that's okay during setup
      // We'll validate when user clicks "Next"
      setCurrentGame(null)
      setSolution([])
    }
  }

  const handleResetBoard = () => {
    const defaultFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    setStartFen(defaultFen)
    try {
      const game = new Chess(defaultFen)
      setCurrentGame(game)
      setSolution([])
    } catch (e) {
      console.error("Error resetting board:", e)
      setCurrentGame(null)
      setSolution([])
    }
  }

  const handleMove = (from: string, to: string) => {
    if (!currentGame) return
    try {
      const newGame = new Chess(currentGame.fen())
      const move = newGame.move({ from: from as any, to: to as any, promotion: 'q' })
      
      if (move) {
        setCurrentGame(newGame)
        setSolution([...solution, { from, to }])
      }
    } catch (e) {
      console.error("Invalid move:", e)
    }
  }

  const handleUndoLastMove = () => {
    if (solution.length === 0) return
    
    try {
      // Start from the original start position - normalize FEN first
      const normalizedFen = normalizeFen(startFen)
      const game = new Chess(normalizedFen)
      // Replay all moves except the last one
      for (let i = 0; i < solution.length - 1; i++) {
        const move = game.move({ from: solution[i].from as any, to: solution[i].to as any, promotion: 'q' })
        if (!move) {
          throw new Error(`Invalid move at index ${i}`)
        }
      }
      // Update both state variables together
      const newSolution = solution.slice(0, -1)
      const newGame = new Chess(game.fen())
      setSolution(newSolution)
      setCurrentGame(newGame)
    } catch (e) {
      console.error("Error undoing move:", e)
      // If startFen is invalid, reset to null
      try {
        const normalizedFen = normalizeFen(startFen)
        const game = new Chess(normalizedFen)
        setCurrentGame(game)
        setSolution([])
      } catch (e2) {
        setCurrentGame(null)
        setSolution([])
      }
    }
  }

  const handleResetSolution = () => {
    try {
      // Reset to the original start position - normalize FEN first
      const normalizedFen = normalizeFen(startFen)
      const game = new Chess(normalizedFen)
      setCurrentGame(game)
      setSolution([])
    } catch (e) {
      // If startFen is invalid, that's okay - we'll validate on "Next"
      setCurrentGame(null)
      setSolution([])
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate start position - normalize FEN first
      try {
        const normalizedFen = normalizeFen(startFen)
        const game = new Chess(normalizedFen)
        // Update startFen to the normalized version
        setStartFen(normalizedFen)
        setCurrentGame(game)
        setCurrentStep(2)
      } catch (e: any) {
        toast({
          title: "Ongeldige positie",
          description: e.message || "De startpositie is niet geldig. Zorg ervoor dat er minstens één witte en één zwarte koning is.",
          variant: "destructive"
        })
        return
      }
    } else if (currentStep === 2) {
      // Validate solution
      if (solution.length === 0) {
        toast({
          title: "Geen oplossing",
          description: "Voeg minstens één zet toe aan de oplossing.",
          variant: "destructive"
        })
        return
      }
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    }
  }

  const handleComplete = async () => {
    if (!puzzleName.trim()) {
      toast({
        title: "Naam vereist",
        description: "Geef de puzzel een naam.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      await createPuzzle({
        name: puzzleName,
        start_position: startFen,
        active_color: activeColor,
        solution: solution
      })

      toast({
        title: "Succes",
        description: "Puzzel succesvol aangemaakt!",
      })

      router.push("/admin/puzzles")
    } catch (error: any) {
      console.error("Error creating puzzle:", error)
      toast({
        title: "Fout",
        description: error.response?.data?.message || "Kon puzzel niet aanmaken.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-textColor mb-2">Nieuwe Puzzel Aanmaken</h1>
            <p className="text-gray-600">Stap {currentStep} van 3</p>
            
            {/* Progress indicator */}
            <div className="mt-4 flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex-1 h-2 rounded ${
                    step <= currentStep ? "bg-mainAccent" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step 1: Start Position */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Stap 1: Start Positie</h2>
              <p className="text-gray-600 mb-4">
                Stel de startpositie in en duid aan wie aan zet is.
              </p>

              <div className="mb-6">
                <div className="flex justify-center">
                  <ChessBoard
                    key={`start-board-${startFen}`}
                    fen={startFen}
                    onFenChange={handleStartPositionChange}
                    draggable={true}
                    freePlacement={true}
                    showPiecePalette={true}
                    orientation={boardOrientation}
                    customContentBeforePalette={
                      <div className="flex justify-end gap-2 mb-6 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBoardOrientation(boardOrientation === "white" ? "black" : "white")}
                          title="Draai bord"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Draai bord
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetBoard}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                        >
                          Reset Bord
                        </Button>
                      </div>
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="fen">FEN Notatie</Label>
                  <Input
                    id="fen"
                    value={startFen}
                    onChange={(e) => {
                      const newFen = e.target.value
                      setStartFen(newFen)
                      // Update the board immediately by calling handleStartPositionChange
                      handleStartPositionChange(newFen)
                    }}
                    onPaste={(e) => {
                      // Get pasted text from clipboard
                      const pastedText = e.clipboardData.getData('text')
                      if (pastedText) {
                        // Use setTimeout to ensure the paste is processed by the browser first
                        setTimeout(() => {
                          // Get the value from the input element directly using the ID
                          const inputElement = document.getElementById('fen') as HTMLInputElement
                          if (inputElement && inputElement.value) {
                            const newFen = inputElement.value
                            setStartFen(newFen)
                            handleStartPositionChange(newFen)
                          }
                        }, 10)
                      }
                    }}
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                <div>
                  <Label>Aan zet</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="activeColor"
                        value="white"
                        checked={activeColor === "white"}
                        onChange={() => setActiveColor("white")}
                        className="w-4 h-4"
                      />
                      <span>Wit</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="activeColor"
                        value="black"
                        checked={activeColor === "black"}
                        onChange={() => setActiveColor("black")}
                        className="w-4 h-4"
                      />
                      <span>Zwart</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleNext} className="bg-mainAccent hover:bg-mainAccentDark">
                  Volgende
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Solution */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Stap 2: Oplossing</h2>
              <p className="text-gray-600 mb-4">
                Sleep stukken om de oplossing te creëren. Zetten worden in volgorde toegevoegd.
              </p>

              <div className="mb-6 relative">
                {currentGame ? (
                  <>
                    <div className="absolute top-2 right-2 z-10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBoardOrientation(boardOrientation === "white" ? "black" : "white")}
                        className="bg-white/90 hover:bg-white shadow-sm"
                        title="Draai bord"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <ChessBoard
                        key={`solution-board-${solution.length}-${currentGame.fen()}`}
                        fen={currentGame.fen()}
                        onFenChange={(newFen) => {
                          try {
                            const game = new Chess(newFen)
                            setCurrentGame(game)
                          } catch (e) {
                            // Invalid FEN during solution building
                            console.error("Invalid FEN:", newFen)
                          }
                        }}
                        onMove={handleMove}
                        draggable={true}
                        orientation={boardOrientation}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <p className="font-medium">Ongeldige startpositie</p>
                    <p className="text-sm mt-2">Ga terug naar stap 1 en zorg voor een geldige positie (minstens één witte en één zwarte koning).</p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <Label>Oplossing ({solution.length} zetten)</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBoardOrientation(boardOrientation === "white" ? "black" : "white")}
                      title="Draai bord"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUndoLastMove}
                      disabled={solution.length === 0}
                    >
                      Ongedaan maken
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetSolution}
                      disabled={solution.length === 0}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded p-3 min-h-[60px]">
                  {solution.length === 0 ? (
                    <p className="text-gray-400 text-sm">Nog geen zetten toegevoegd</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {solution.map((move, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-mainAccent/10 text-mainAccent rounded text-sm font-medium"
                        >
                          {index + 1}. {move.from}-{move.to}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Terug
                </Button>
                <Button onClick={handleNext} className="bg-mainAccent hover:bg-mainAccentDark">
                  Volgende
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Name */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Stap 3: Puzzel Naam</h2>
              <p className="text-gray-600 mb-4">
                Geef de puzzel een naam.
              </p>

              <div className="mb-6">
                <Label htmlFor="puzzleName">Puzzel Naam</Label>
                <Input
                  id="puzzleName"
                  value={puzzleName}
                  onChange={(e) => setPuzzleName(e.target.value)}
                  placeholder="Bijv. Mat in 2"
                  className="mt-1"
                />
              </div>

              {/* Preview */}
              <div className="mb-6 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Preview</h3>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Naam:</strong> {puzzleName || "(geen naam)"}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Aan zet:</strong> {activeColor === "white" ? "Wit" : "Zwart"}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Oplossing:</strong> {solution.length} zetten
                </p>
                <div className="mt-2">
                  <ChessBoard
                    fen={startFen}
                    draggable={false}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Terug
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={loading || !puzzleName.trim()}
                  className="bg-mainAccent hover:bg-mainAccentDark"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Aanmaken...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Voltooien
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PrivateRoute>
  )
}


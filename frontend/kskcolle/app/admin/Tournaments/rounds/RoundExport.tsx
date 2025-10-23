"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileText, Loader2 } from "lucide-react"
import { getRoundForExport } from "../../../api/index"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import jsPDF from "jspdf"
import { sortSevillaGamesWithPostponed, sortGamesByPairingOrder, GameWithScore } from "@/lib/gameSorting"

interface GameWithScoreAndOriginal extends GameWithScore {
  originalGame: any;
}

interface RoundExportProps {
  tournamentId: number
  roundId: number
  roundNumber: number
  tournamentName: string
  isSevillaImported?: boolean
  className?: string
}

export default function RoundExport({ 
  tournamentId, 
  roundId, 
  roundNumber, 
  tournamentName,
  isSevillaImported = false,
  className = ""
}: RoundExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      // Fetch round data
      const roundData = await getRoundForExport(tournamentId, roundId)
      
      // Sort games: move postponed games to bottom (above "Abs with msg" games)
      const sortedGames = (() => {
        if (isSevillaImported) {
          // For Sevilla tournaments, use the special sorting
          const gamesWithScore: GameWithScoreAndOriginal[] = roundData.games.map(game => ({
            game_id: game.game_id,
            speler1: {
              user_id: game.speler1?.user_id || 0,
              schaakrating_elo: game.speler1?.schaakrating_elo || 0
            },
            speler2: game.speler2 ? {
              user_id: game.speler2.user_id,
              schaakrating_elo: game.speler2.schaakrating_elo || 0
            } : null,
            uitgestelde_datum: game.uitgestelde_datum ? new Date(game.uitgestelde_datum) : null,
            board_position: game.board_position || null,
            originalGame: game
          }));
          
          const sortedGamesWithScore = sortSevillaGamesWithPostponed(gamesWithScore);
          return sortedGamesWithScore.map(g => g.originalGame);
        } else {
          // For regular tournaments, separate games by type
          const regularGames = roundData.games.filter(game => 
            !game.uitgestelde_datum && 
            (!game.result || !game.result.startsWith("ABS-"))
          );
          const postponedGames = roundData.games.filter(game => game.uitgestelde_datum);
          const absGames = roundData.games.filter(game => 
            !game.uitgestelde_datum && 
            game.result && 
            game.result.startsWith("ABS-")
          );
          
          // Sort each group by game_id to maintain their relative order
          const sortedRegularGames = regularGames.sort((a, b) => a.game_id - b.game_id);
          const sortedPostponedGames = postponedGames.sort((a, b) => a.game_id - b.game_id);
          const sortedAbsGames = absGames.sort((a, b) => a.game_id - b.game_id);
          
          return [...sortedRegularGames, ...sortedPostponedGames, ...sortedAbsGames];
        }
      })();
      
      // Check if this is a makeup round
      const isMakeupRound = roundData.round.type === 'MAKEUP'
      
      // Create PDF with smaller margins
      const pdf = new jsPDF()
      
      // Set font
      pdf.setFont("helvetica")
      
      // Title - different for makeup rounds
      pdf.setFontSize(16)
      const roundTitle = isMakeupRound 
        ? `${tournamentName} - ${roundData.round.label || 'Inhaaldag'}`
        : `${tournamentName} - Ronde ${roundNumber}`
      pdf.text(roundTitle, 15, 20)
      
      // Round info
      pdf.setFontSize(10)
      const roundDate = format(new Date(roundData.round.ronde_datum), "EEEE dd MMMM yyyy", { locale: nl })
      pdf.text(`Datum: ${roundDate}`, 15, 30)
      pdf.text(`Startuur: ${roundData.round.startuur}`, 15, 36)
      
      // Games table 
      let yPosition = 50
      
      if (sortedGames.length > 0) {
        // Table header
        pdf.setFontSize(12)
        pdf.text("Partijen", 15, yPosition)
        yPosition += 8
        
        // Table headers
        pdf.setFontSize(9)
        pdf.text("Bord", 15, yPosition)
        pdf.text("Wit", 35, yPosition)
        pdf.text("Zwart", 95, yPosition)
        pdf.text("Resultaat", 155, yPosition)
        yPosition += 6
        
        // Draw line under headers
        pdf.line(15, yPosition, 195, yPosition)
        yPosition += 4
        
        // Games 
        sortedGames.forEach((game, index) => {
          // Check if we need a new page 
          if (yPosition > 280) {
            pdf.addPage()
            yPosition = 15
          }
          
          const boardNumber = index + 1
          const whitePlayer = game.speler1 ? `${game.speler1.voornaam} ${game.speler1.achternaam}` : "BYE"
          const blackPlayer = game.speler2 ? `${game.speler2.voornaam} ${game.speler2.achternaam}` : "BYE"
          
          // Handle different result types
          let result = ""
          if (game.uitgestelde_datum) {
            result = "..."
          } else if (game.result) {
            if (game.result.startsWith("ABS-")) {
              result = "Abs with msg"
            } else if (game.result === "1-0" || game.result === "0-1" || game.result === "1/2-1/2") {
              result = game.result
            } else {
              result = game.result
            }
          } else {
            result = "..."
          }
          
          pdf.text(boardNumber.toString(), 15, yPosition)
          pdf.text(whitePlayer, 35, yPosition)
          pdf.text(blackPlayer, 95, yPosition)
          pdf.text(result, 155, yPosition)
          
          yPosition += 6 // Reduced from 8 to 6
        })
      } else {
        pdf.setFontSize(10)
        pdf.text("Nog geen partijen gegenereerd voor deze ronde.", 15, yPosition)
      }
      
      // Footer 
      const pageCount = pdf.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        pdf.setFontSize(7)
        pdf.text(`Pagina ${i} van ${pageCount}`, 15, 290)
        pdf.text(`Gegenereerd op ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 110, 290)
      }
      
      // Save PDF - different filename for makeup rounds
      const fileName = isMakeupRound
        ? `${tournamentName.replace(/[^a-zA-Z0-9]/g, '_')}_${(roundData.round.label || 'Inhaaldag').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        : `${tournamentName.replace(/[^a-zA-Z0-9]/g, '_')}_Ronde_${roundNumber}.pdf`
      pdf.save(fileName)
      
    } catch (error) {
      console.error("Error exporting round:", error)
      alert("Er is een fout opgetreden bij het exporteren van de ronde.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      size="sm"
      className={`flex items-center gap-2 ${className}`}
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exporteren...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          <FileText className="h-4 w-4" />
          Exporteer PDF
        </>
      )}
    </Button>
  )
}

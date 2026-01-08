"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2, Calendar } from "lucide-react"
import { axios } from "../../../api/index"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import jsPDF from "jspdf"
import { sortSevillaGamesWithPostponed, GameWithScore } from "@/lib/gameSorting"

const baseUrl = process.env.NEXT_PUBLIC_API_URL

// Get the next upcoming rounds with games for export
const getNextRoundsForExport = async (tournamentId: number) => {
  const { data } = await axios.get(`${baseUrl}/rondes/${tournamentId}/next-rounds/export`)
  return data
}

interface GameWithScoreAndOriginal extends GameWithScore {
  originalGame: {
    game_id: number;
    speler1?: { user_id: number; voornaam: string; achternaam: string; schaakrating_elo: number } | null;
    speler2?: { user_id: number; voornaam: string; achternaam: string; schaakrating_elo: number } | null;
    result?: string | null;
    uitgestelde_datum?: string | null;
    board_position?: number | null;
  };
}

interface TournamentDayExportProps {
  tournamentId: number
  tournamentName: string
  className?: string
}

export default function TournamentDayExport({ 
  tournamentId,
  tournamentName,
  className = ""
}: TournamentDayExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      // Get the next upcoming rounds with games
      const roundsData = await getNextRoundsForExport(tournamentId)
      
      if (!roundsData.rounds || roundsData.rounds.length === 0) {
        alert("Geen rondes gevonden voor dit toernooi")
        setIsExporting(false)
        return
      }

      const nextDate = roundsData.date ? new Date(roundsData.date) : new Date()

      // Create PDF
      const pdf = new jsPDF()
      pdf.setFont("helvetica")
      
      // Title
      pdf.setFontSize(16)
      const dateFormatted = format(nextDate, "EEEE dd MMMM yyyy", { locale: nl })
      pdf.text(`${tournamentName} - ${dateFormatted}`, 15, 20)
      
      let yPosition = 35
      let totalGames = 0
      
      // Process each round (class)
      for (const roundData of roundsData.rounds) {
        // Check if we need a new page
        if (yPosition > 250) {
          pdf.addPage()
          yPosition = 15
        }
        
        // Class header
        pdf.setFontSize(12)
        const className = roundData.tournament.class_name || 'Hoofdtoernooi'
        const roundTitle = roundData.round.type === 'MAKEUP'
          ? `${className} - ${roundData.round.label || 'Inhaaldag'}`
          : `${className} - Ronde ${roundData.round.ronde_nummer}`
        pdf.text(roundTitle, 15, yPosition)
        yPosition += 6
        
        // Sort games
        const sortedGames = (() => {
          // Check if this is a Sevilla tournament (no label on regular rounds)
          const isSevillaImported = roundData.round.type === 'REGULAR' && !roundData.round.label
          
          if (isSevillaImported) {
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
            
            const sortedRegularGames = regularGames.sort((a, b) => a.game_id - b.game_id);
            const sortedPostponedGames = postponedGames.sort((a, b) => a.game_id - b.game_id);
            const sortedAbsGames = absGames.sort((a, b) => a.game_id - b.game_id);
            
            return [...sortedRegularGames, ...sortedPostponedGames, ...sortedAbsGames];
          }
        })();
        
        if (sortedGames.length > 0) {
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
          pdf.setFontSize(8)
          let boardNumber = 1
          sortedGames.forEach((game) => {
            // Check if we need a new page
            if (yPosition > 280) {
              pdf.addPage()
              yPosition = 15
              // Redraw headers
              pdf.setFontSize(9)
              pdf.text("Bord", 15, yPosition)
              pdf.text("Wit", 35, yPosition)
              pdf.text("Zwart", 95, yPosition)
              pdf.text("Resultaat", 155, yPosition)
              yPosition += 6
              pdf.line(15, yPosition, 195, yPosition)
              yPosition += 4
              pdf.setFontSize(8)
            }
            
            const whitePlayer = game.speler1 ? `${game.speler1.voornaam} ${game.speler1.achternaam}` : "BYE"
            const blackPlayer = game.speler2 ? `${game.speler2.voornaam} ${game.speler2.achternaam}` : "BYE"
            
            let result = ""
            const isMakeupRound = roundData.round.type === 'MAKEUP'
            if (game.uitgestelde_datum) {
              result = isMakeupRound ? "..." : "uitgesteld"
            } else if (game.result) {
              if (game.result.startsWith("ABS-")) {
                result = "Abs with msg"
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
            
            yPosition += 6
            boardNumber++
            totalGames++
          })
        } else {
          pdf.setFontSize(9)
          pdf.text("Nog geen partijen gegenereerd voor deze ronde.", 15, yPosition)
          yPosition += 6
        }
        
        // Add spacing between classes
        yPosition += 4
      }
      
      // Footer
      const pageCount = pdf.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        pdf.setFontSize(7)
        pdf.text(`Pagina ${i} van ${pageCount}`, 15, 290)
        pdf.text(`Gegenereerd op ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 110, 290)
        if (i === 1) {
          pdf.text(`Totaal: ${totalGames} partijen`, 15, 285)
        }
      }
      
      // Save PDF
      const fileName = `${tournamentName.replace(/[^a-zA-Z0-9]/g, '_')}_${format(nextDate, "yyyy-MM-dd")}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error("Error exporting rounds:", error)
      alert("Er is een fout opgetreden bij het exporteren van de partijen.")
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
          <Calendar className="h-4 w-4" />
          <FileText className="h-4 w-4" />
          Exporteer Dag
        </>
      )}
    </Button>
  )
}


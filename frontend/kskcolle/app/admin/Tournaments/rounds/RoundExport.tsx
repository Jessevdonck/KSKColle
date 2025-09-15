"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileText, Loader2 } from "lucide-react"
import { getRoundForExport } from "../../../api/index"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import jsPDF from "jspdf"

interface RoundExportProps {
  tournamentId: number
  roundId: number
  roundNumber: number
  tournamentName: string
  className?: string
}

export default function RoundExport({ 
  tournamentId, 
  roundId, 
  roundNumber, 
  tournamentName,
  className = ""
}: RoundExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      // Fetch round data
      const roundData = await getRoundForExport(tournamentId, roundId)
      
      // Create PDF with smaller margins
      const pdf = new jsPDF()
      
      // Set font
      pdf.setFont("helvetica")
      
      // Title 
      pdf.setFontSize(16)
      pdf.text(`${tournamentName} - Ronde ${roundNumber}`, 15, 20)
      
      // Round info
      pdf.setFontSize(10)
      const roundDate = format(new Date(roundData.round.ronde_datum), "EEEE dd MMMM yyyy", { locale: nl })
      pdf.text(`Datum: ${roundDate}`, 15, 30)
      pdf.text(`Startuur: ${roundData.round.startuur}`, 15, 36)
      
      if (roundData.round.label) {
        pdf.text(`Type: ${roundData.round.label}`, 15, 42)
      }
      
      // Games table 
      let yPosition = 50
      
      if (roundData.games.length > 0) {
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
        roundData.games.forEach((game, index) => {
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
          if (game.result) {
            if (game.result.startsWith("ABS-")) {
              result = "Abs with msg"
            } else if (game.result === "1-0" || game.result === "0-1" || game.result === "1/2-1/2") {
              result = game.result
            } else {
              result = game.result
            }
          } else {
            result = "Nog niet gespeeld"
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
      
      // Save PDF
      const fileName = `${tournamentName.replace(/[^a-zA-Z0-9]/g, '_')}_Ronde_${roundNumber}.pdf`
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

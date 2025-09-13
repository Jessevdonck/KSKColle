"use client"

import { useState } from "react"
import { ExternalLink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NationaleELOPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = () => {
    setIsLoading(true)
    // Force iframe reload
    const iframe = document.getElementById('frbe-iframe') as HTMLIFrameElement
    if (iframe) {
      iframe.src = iframe.src
    }
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleOpenExternal = () => {
    window.open('https://www.frbe-kbsb.be/sites/manager/GestionFICHES/FRBE_Club.php?club=410', '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Nationale ELO - KSK Colle
              </h1>
              <p className="text-gray-600">
                Officiële ELO-ranglijst van onze clubleden volgens de Belgische Schaakfederatie (FRBE-KBSB)
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Laden...' : 'Ververs'}
              </Button>
              <Button
                onClick={handleOpenExternal}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open in nieuw venster
              </Button>
            </div>
          </div>
        </div>


        {/* Iframe Container */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-3 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              FRBE-KBSB Club 410: SINT-NIKLAAS KSK Edg. Colle
            </h2>
          </div>
          <div className="relative" style={{ height: '80vh' }}>
            <iframe
              id="frbe-iframe"
              src="https://www.frbe-kbsb.be/sites/manager/GestionFICHES/FRBE_Club.php?club=410"
              className="w-full h-full border-0"
              title="FRBE-KBSB Club 410 ELO Ranglijst"
              loading="lazy"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <div className="flex items-center gap-2 text-gray-600">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Gegevens laden...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Laatst bijgewerkt: {new Date().toLocaleDateString('nl-BE')} • 
            <a 
              href="https://www.frbe-kbsb.be" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-gray-700 ml-1"
            >
              Bron: FRBE-KBSB
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

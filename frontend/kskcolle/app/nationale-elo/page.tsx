"use client"

import { useState } from "react"
import { ExternalLink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

/** De nationale ELO-lijst is vervangen door het nationaal ELO-archief van de KBSB. */
const ARCHIEF_URL = 'https://blog.frbe-kbsb-ksb.be/nl/nationaal-elo-archief/'

/**
 * De KBSB-pagina hierboven is zelf enkel een omhulsel rond deze zoektool.
 * We tonen de tool rechtstreeks, anders staat er een iframe in een iframe met
 * de volledige KBSB-navigatie en -footer eromheen.
 */
const ARCHIEF_EMBED_URL = 'https://www.frbe-kbsb-ksb.be/tools/national_elo_archive?locale=nl'

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
    window.open(ARCHIEF_URL, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Nationaal ELO Archief
              </h1>
              <p className="text-gray-600">
                Het nationaal ELO-archief van de Belgische Schaakfederatie (FRBE-KBSB-KSB)
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
              Nationaal ELO-archief FRBE-KBSB-KSB
            </h2>
          </div>
          <div className="relative" style={{ height: '80vh' }}>
            <iframe
              id="frbe-iframe"
              src={ARCHIEF_EMBED_URL}
              className="w-full h-full border-0"
              title="Nationaal ELO-archief FRBE-KBSB-KSB"
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
              href={ARCHIEF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700 ml-1"
            >
              Bron: FRBE-KBSB-KSB
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

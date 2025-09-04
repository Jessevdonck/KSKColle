"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Eye, ChevronLeft } from "lucide-react"
import Link from "next/link"

interface Document {
  id: string
  name: string
  filename: string
  description: string
  year?: number
}

// Lijst van beschikbare documenten
const documents: Document[] = [
  {
    id: "historische-documenten",
    name: "Historische Documenten",
    filename: "HistorischeDocumenten.pdf",
    description: "Verzameling van historische documenten en archiefstukken van KSK Colle Sint-Niklaas"
  },
  {
    id: "jubileumboek-1994",
    name: "Jubileumboek 1994",
    filename: "Julileumboek1994.pdf",
    description: "Jubileumboek ter gelegenheid van het 25-jarig bestaan van KSK Colle Sint-Niklaas",
    year: 1994
  }
]

export default function HistorischeDocumentenPage() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(documents[0]) // Direct de eerste PDF laden

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document)
  }

  const handleDownload = (document: Document) => {
    const link = document.createElement('a')
    link.href = `/pdf/${document.filename}`
    link.download = document.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Link 
              href="/historiek" 
              className="text-mainAccent hover:text-mainAccentDark transition-colors"
            >
              <ChevronLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Historische Documenten</h1>
          </div>
          <p className="text-gray-600 max-w-3xl">
            Ontdek de rijke geschiedenis van KSK Colle Sint-Niklaas door onze verzameling 
            historische documenten, jubileumboeken en archiefstukken.
          </p>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* PDF Viewer - Takes up 2/3 of the space */}
          <div className="lg:col-span-2">
            <Card className="border-mainAccent/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-mainAccent">
                  <div className="flex items-center">
                    <FileText className="mr-2" size={24} />
                    {selectedDocument?.name || "Selecteer een document"}
                  </div>
                  {selectedDocument && (
                    <Button
                      onClick={() => handleDownload(selectedDocument)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="mr-2" size={16} />
                      Download
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[800px] border rounded-lg overflow-hidden">
                  {selectedDocument ? (
                    <iframe
                      src={`/pdf/${selectedDocument.filename}#toolbar=1&navpanes=1&scrollbar=1`}
                      width="100%"
                      height="100%"
                      className="border-0"
                      title={selectedDocument.name}
                    >
                      <p className="p-4 text-center text-gray-500">
                        Uw browser ondersteunt geen PDF weergave. 
                        <a 
                          href={`/pdf/${selectedDocument.filename}`} 
                          className="text-mainAccent hover:underline ml-1"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Klik hier om het document te downloaden.
                        </a>
                      </p>
                    </iframe>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Selecteer een document om te bekijken
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document List - Takes up 1/3 of the space */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Beschikbare Documenten</h3>
            {documents.map((document) => (
              <Card 
                key={document.id} 
                className={`border-mainAccent/20 shadow-lg hover:shadow-xl transition-shadow cursor-pointer ${
                  selectedDocument?.id === document.id ? 'ring-2 ring-mainAccent' : ''
                }`}
                onClick={() => handleViewDocument(document)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-mainAccent text-sm">
                    <FileText className="mr-2" size={16} />
                    {document.name}
                  </CardTitle>
                  {document.year && (
                    <div className="text-xs text-gray-500">
                      {document.year}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-700 text-xs mb-3">
                    {document.description}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewDocument(document)
                      }}
                      size="sm"
                      className="flex-1 bg-mainAccent hover:bg-mainAccentDark text-white"
                    >
                      <Eye className="mr-1" size={14} />
                      Bekijk
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(document)
                      }}
                      variant="outline"
                      size="sm"
                      className="border-mainAccent text-mainAccent hover:bg-mainAccent hover:text-white"
                    >
                      <Download className="mr-1" size={14} />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>


      </div>
    </div>
  )
}

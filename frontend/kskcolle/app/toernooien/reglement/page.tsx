"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { useState } from "react"
import InternReglement from "./components/InternReglement"
import HerfstcompetitieReglement from "./components/HerfstcompetitieReglement"
import LentecompetitieReglement from "./components/LentecompetitieReglement"
import BlitzkampioenschapReglement from "./components/BlitzkampioenschapReglement"
import ZomertoernooiReglement from "./components/ZomertoernooiReglement"
import FIDEReglement from "./components/FIDEReglement"

export default function ReglementPage() {
  const [activeTab, setActiveTab] = useState<'intern' | 'herfst' | 'lente' | 'blitz' | 'zomer' | 'fide'>('intern')

  const getReglementContent = () => {
    switch (activeTab) {
      case 'intern':
        return <InternReglement />
      case 'herfst':
        return <HerfstcompetitieReglement />
      case 'lente':
        return <LentecompetitieReglement />
      case 'blitz':
        return <BlitzkampioenschapReglement />
      case 'zomer':
        return <ZomertoernooiReglement />
      case 'fide':
        return <FIDEReglement />
      default:
        return <InternReglement />
    }
  }

  const getReglementTitle = () => {
    switch (activeTab) {
      case 'intern':
        return 'Intern Reglement'
      case 'herfst':
        return 'Herfstcompetitie Reglement'
      case 'lente':
        return 'Lentecompetitie Reglement'
      case 'blitz':
        return 'Blitzkampioenschap Reglement'
      case 'zomer':
        return 'Zomertoernooi Reglement'
      case 'fide':
        return 'FIDE Reglement 2025'
      default:
        return 'Intern Reglement'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reglementen</h1>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('intern')}
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'intern'
                  ? 'bg-white text-mainAccent shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Intern Reglement
            </button>
            <button
              onClick={() => setActiveTab('herfst')}
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'herfst'
                  ? 'bg-white text-mainAccent shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Herfstcompetitie
            </button>
            <button
              onClick={() => setActiveTab('lente')}
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'lente'
                  ? 'bg-white text-mainAccent shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Lentecompetitie
            </button>
            <button
              onClick={() => setActiveTab('blitz')}
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'blitz'
                  ? 'bg-white text-mainAccent shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Snelschaak
            </button>
            <button
              onClick={() => setActiveTab('zomer')}
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'zomer'
                  ? 'bg-white text-mainAccent shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Zomertoernooi
            </button>
            <button
              onClick={() => setActiveTab('fide')}
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'fide'
                  ? 'bg-white text-mainAccent shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              FIDE Reglement
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-mainAccent/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-mainAccent">
                <FileText className="mr-2" size={24} />
                {getReglementTitle()}
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              {getReglementContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

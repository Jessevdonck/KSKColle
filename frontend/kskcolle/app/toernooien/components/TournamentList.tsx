"use client"

import React, { useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import TournamentCard from './TournamentCard'
import { getAll } from '../../api/index'
import { Trophy, ChevronUp } from 'lucide-react'

interface Tournament {
  tournament_id: number
  naam: string
  rondes: number
  participations: Array<{
    user_id: number
    voornaam: string
    achternaam: string
  }>
}

interface CategorizedTournaments {
  herfstcompetitie: Tournament[]
  lentecompetitie: Tournament[]
  blitzkampioenschap: Tournament[]
  zomertoernooi: Tournament[]
  other: Tournament[]
}

export default function TournamentList() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string>('')
  const { data: tournaments, error } = useSWR('tournament?active=true&is_youth=false', getAll)

  // Refs for each section
  const sectionRefs = {
    herfstcompetitie: useRef<HTMLDivElement>(null),
    lentecompetitie: useRef<HTMLDivElement>(null),
    blitzkampioenschap: useRef<HTMLDivElement>(null),
    zomertoernooi: useRef<HTMLDivElement>(null),
    other: useRef<HTMLDivElement>(null)
  }

  useEffect(() => {
    if (tournaments || error) {
      setIsLoading(false)
    }
  }, [tournaments, error])

  // Intersection Observer to track active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id
            setActiveSection(sectionId)
          }
        })
      },
      {
        threshold: 0.3,
        rootMargin: '-100px 0px -50% 0px'
      }
    )

    Object.values(sectionRefs).forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current)
      }
    })

    return () => observer.disconnect()
  }, [tournaments])

  const scrollToSection = (sectionId: string) => {
    const sectionRef = sectionRefs[sectionId as keyof typeof sectionRefs]
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  const categorizeTournaments = (tournaments: Tournament[]): CategorizedTournaments => {
    const categorized: CategorizedTournaments = {
      herfstcompetitie: [],
      lentecompetitie: [],
      blitzkampioenschap: [],
      zomertoernooi: [],
      other: []
    }

    tournaments.forEach(tournament => {
      const name = tournament.naam.toLowerCase()
      
      if (name.includes('herfst') || name.includes('herfstcompetitie')) {
        categorized.herfstcompetitie.push(tournament)
      } else if (name.includes('lente') || name.includes('lentecompetitie')) {
        categorized.lentecompetitie.push(tournament)
      } else if (name.includes('blitz') || name.includes('snelschaak') || name.includes('blitzkampioenschap')) {
        categorized.blitzkampioenschap.push(tournament)
      } else if (name.includes('zomer') || name.includes('zomertoernooi')) {
        categorized.zomertoernooi.push(tournament)
      } else {
        categorized.other.push(tournament)
      }
    })

    return categorized
  }

  const renderTournamentSection = (title: string, tournaments: Tournament[], sectionId: string) => {
    if (tournaments.length === 0) return null

    const sectionRef = sectionRefs[sectionId as keyof typeof sectionRefs]

    return (
      <div ref={sectionRef} id={sectionId} className="mb-12 scroll-mt-24">
        <h2 className="text-2xl font-bold text-[#2e2c2c] mb-6 border-b-2 border-mainAccent pb-2">
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map(tournament => (
            <TournamentCard key={tournament.tournament_id} tournament={tournament} />
          ))}
        </div>
      </div>
    )
  }

  // Navigation component
  const renderNavigation = (categorized: CategorizedTournaments) => {
    const sections = [
      { id: 'herfstcompetitie', title: 'Herfstcompetitie', tournaments: categorized.herfstcompetitie },
      { id: 'lentecompetitie', title: 'Lentecompetitie', tournaments: categorized.lentecompetitie },
      { id: 'blitzkampioenschap', title: 'Blitzkampioenschap', tournaments: categorized.blitzkampioenschap },
      { id: 'zomertoernooi', title: 'Zomertoernooi', tournaments: categorized.zomertoernooi },
      { id: 'other', title: 'Andere Toernooien', tournaments: categorized.other }
    ].filter(section => section.tournaments.length > 0)

    if (sections.length <= 1) return null

    return (
      <div className="sticky top-4 z-10 mb-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-[#2e2c2c] mb-3 flex items-center">
            <ChevronUp className="mr-2 h-5 w-5 text-mainAccent" />
            Navigeer naar:
          </h3>
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-mainAccent text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-mainAccent hover:text-white hover:shadow-md'
                }`}
              >
                {section.title} ({section.tournaments.length})
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2e2c2c] mb-4 flex items-center justify-center">
            <Trophy className="mr-2 h-10 w-10 text-mainAccent" />
            KSK Colle Toernooien
          </h1>
          <p className="text-xl text-[#2e2c2c]">Ontdek en neem deel aan onze spannende schaaktoernooien</p>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#B17457]" data-cy="is_loading"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center">
            <div className="text-center text-red-500 bg-red-100 p-6 rounded-lg shadow-md" data-cy="axios_error_message">
              <h2 className="text-2xl font-bold mb-2">Error</h2>
              <p>Er is een fout opgetreden bij het laden van de toernooien</p>
            </div>
          </div>
        ) : tournaments && tournaments.length > 0 ? (
          (() => {
            const categorized = categorizeTournaments(tournaments)
            const hasAnyTournaments = Object.values(categorized).some(category => category.length > 0)
            
            if (!hasAnyTournaments) {
              return (
                <div className="text-center text-[#2e2c2c] mt-12" data-cy="no_tournaments_message">
                  <p className="text-2xl font-semibold">Geen toernooien gevonden</p>
                  <p className="mt-2">Er zijn momenteel geen actieve toernooien. Kom later terug voor updates!</p>
                </div>
              )
            }

            return (
              <div className="space-y-8">
                {renderNavigation(categorized)}
                {renderTournamentSection('Herfstcompetitie', categorized.herfstcompetitie, 'herfstcompetitie')}
                {renderTournamentSection('Lentecompetitie', categorized.lentecompetitie, 'lentecompetitie')}
                {renderTournamentSection('Blitzkampioenschap', categorized.blitzkampioenschap, 'blitzkampioenschap')}
                {renderTournamentSection('Zomertoernooi', categorized.zomertoernooi, 'zomertoernooi')}
                {renderTournamentSection('Andere Toernooien', categorized.other, 'other')}
              </div>
            )
          })()
        ) : (
          <div className="text-center text-[#2e2c2c] mt-12" data-cy="no_tournaments_message">
            <p className="text-2xl font-semibold">Geen toernooien gevonden</p>
            <p className="mt-2">Er zijn momenteel geen actieve toernooien. Kom later terug voor updates!</p>
          </div>
        )}
      </div>
    </div>
  )
}


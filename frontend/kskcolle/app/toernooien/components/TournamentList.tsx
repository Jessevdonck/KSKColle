"use client"

import React, { useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import TournamentCard from './TournamentCard'
import { getAll } from '../../api/index'
import { Trophy, ChevronUp, Archive, Calendar } from 'lucide-react'

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

interface CategorizedArchiveTournaments {
  herfstcompetitie: Tournament[]
  lentecompetitie: Tournament[]
  blitzkampioenschap: Tournament[]
  zomertoernooi: Tournament[]
  other: Tournament[]
}

export default function TournamentList() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('all') // 'all', 'herfst', 'lente', 'blitz', 'zomer', 'other'
  const [showArchive, setShowArchive] = useState(false)
  const { data: tournaments, error } = useSWR('tournament?active=true&is_youth=false', getAll)
  const { data: archiveTournaments, error: archiveError } = useSWR('tournament?active=false&is_youth=false', getAll)

  // Refs for each section
  const sectionRefs = {
    herfstcompetitie: useRef<HTMLDivElement>(null),
    lentecompetitie: useRef<HTMLDivElement>(null),
    blitzkampioenschap: useRef<HTMLDivElement>(null),
    zomertoernooi: useRef<HTMLDivElement>(null),
    other: useRef<HTMLDivElement>(null),
    archive: useRef<HTMLDivElement>(null)
  }

  // Archive refs
  const archiveSectionRefs = {
    herfstcompetitie: useRef<HTMLDivElement>(null),
    lentecompetitie: useRef<HTMLDivElement>(null),
    blitzkampioenschap: useRef<HTMLDivElement>(null),
    zomertoernooi: useRef<HTMLDivElement>(null),
    other: useRef<HTMLDivElement>(null)
  }

  useEffect(() => {
    if ((tournaments || error) && (archiveTournaments || archiveError)) {
      setIsLoading(false)
    }
  }, [tournaments, error, archiveTournaments, archiveError])

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

    // Observe current tournament sections
    Object.values(sectionRefs).forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current)
      }
    })

    // Observe archive sections
    Object.values(archiveSectionRefs).forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current)
      }
    })

    return () => observer.disconnect()
  }, [tournaments, archiveTournaments])

  const scrollToSection = (sectionId: string) => {
    // Check if it's an archive section
    if (sectionId.startsWith('archive-')) {
      const archiveSectionId = sectionId.replace('archive-', '')
      const sectionRef = archiveSectionRefs[archiveSectionId as keyof typeof archiveSectionRefs]
      if (sectionRef.current) {
        sectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    } else {
      const sectionRef = sectionRefs[sectionId as keyof typeof sectionRefs]
      if (sectionRef.current) {
        sectionRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
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
      } else if (name.includes('blitz') || name.includes('snelschaak') || name.includes('blitzkampioenschap') || name.includes('snel')) {
        categorized.blitzkampioenschap.push(tournament)
      } else if (name.includes('zomer') || name.includes('zomertoernooi')) {
        categorized.zomertoernooi.push(tournament)
      } else {
        categorized.other.push(tournament)
      }
    })

    return categorized
  }

  const categorizeArchiveTournaments = (tournaments: Tournament[]): CategorizedArchiveTournaments => {
    const categorized: CategorizedArchiveTournaments = {
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
      } else if (name.includes('blitz') || name.includes('snelschaak') || name.includes('blitzkampioenschap') || name.includes('snel')) {
        categorized.blitzkampioenschap.push(tournament)
      } else if (name.includes('zomer') || name.includes('zomertoernooi')) {
        categorized.zomertoernooi.push(tournament)
      } else {
        categorized.other.push(tournament)
      }
    })

    return categorized
  }

  // Filter tournaments by selected type
  const filterTournamentsByType = (tournaments: Tournament[], type: string): Tournament[] => {
    if (type === 'all') return tournaments
    
    return tournaments.filter(tournament => {
      const name = tournament.naam.toLowerCase()
      
      switch (type) {
        case 'herfst':
          return name.includes('herfst') || name.includes('herfstcompetitie')
        case 'lente':
          return name.includes('lente') || name.includes('lentecompetitie')
        case 'blitz':
          return name.includes('blitz') || name.includes('snelschaak') || name.includes('blitzkampioenschap') || name.includes('snel')
        case 'zomer':
          return name.includes('zomer') || name.includes('zomertoernooi')
        case 'other':
          return !name.includes('herfst') && !name.includes('herfstcompetitie') && 
                 !name.includes('lente') && !name.includes('lentecompetitie') &&
                 !name.includes('blitz') && !name.includes('snelschaak') && !name.includes('blitzkampioenschap') && !name.includes('snel') &&
                 !name.includes('zomer') && !name.includes('zomertoernooi')
        default:
          return true
      }
    })
  }

  const renderTournamentSection = (title: string, tournaments: Tournament[], sectionId: string, isArchive: boolean = false) => {
    if (tournaments.length === 0) return null

    const sectionRef = isArchive 
      ? archiveSectionRefs[sectionId as keyof typeof archiveSectionRefs]
      : sectionRefs[sectionId as keyof typeof sectionRefs]

    return (
      <div ref={sectionRef} id={`${isArchive ? 'archive-' : ''}${sectionId}`} className="mb-12 scroll-mt-24">
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
  const renderNavigation = (categorized: CategorizedTournaments, isArchive: boolean = false) => {
    const sections = [
      { id: 'herfstcompetitie', title: 'Herfstcompetitie', tournaments: categorized.herfstcompetitie },
      { id: 'lentecompetitie', title: 'Lentecompetitie', tournaments: categorized.lentecompetitie },
      { id: 'blitzkampioenschap', title: 'Snelschaakkampioenschap', tournaments: categorized.blitzkampioenschap },
      { id: 'zomertoernooi', title: 'Zomertoernooi', tournaments: categorized.zomertoernooi },
      { id: 'other', title: 'Nevenactiviteiten', tournaments: categorized.other }
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
                onClick={() => scrollToSection(isArchive ? `archive-${section.id}` : section.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeSection === (isArchive ? `archive-${section.id}` : section.id)
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
          
          {/* Filter Controls */}
          <div className="mt-8 space-y-4">
            {/* Tournament Type Filter */}
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-sm font-medium text-gray-700 self-center">Filter op type:</span>
              {[
                { id: 'all', label: 'Alle Types' },
                { id: 'herfst', label: 'Herfstcompetitie' },
                { id: 'lente', label: 'Lentecompetitie' },
                { id: 'blitz', label: 'Snelschaak' },
                { id: 'zomer', label: 'Zomertoernooi' },
                { id: 'other', label: 'Andere' }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedType === type.id
                      ? 'bg-mainAccent text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-mainAccent hover:text-white hover:shadow-md'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
            
            {/* Archive Toggle */}
            <div className="flex justify-center items-center space-x-3">
              <button
                onClick={() => setShowArchive(!showArchive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mainAccent focus:ring-offset-2 ${
                  showArchive ? 'bg-mainAccent' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showArchive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-700">Archief toernooien</span>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#B17457]" data-cy="is_loading"></div>
          </div>
        ) : error || archiveError ? (
          <div className="flex items-center justify-center">
            <div className="text-center text-red-500 bg-red-100 p-6 rounded-lg shadow-md" data-cy="axios_error_message">
              <h2 className="text-2xl font-bold mb-2">Error</h2>
              <p>Er is een fout opgetreden bij het laden van de toernooien</p>
            </div>
          </div>
        ) : showArchive ? (
          // Archive View
          (() => {
            if (!archiveTournaments || archiveTournaments.length === 0) {
              return (
                <div className="text-center text-[#2e2c2c] mt-12" data-cy="no_archive_tournaments_message">
                  <Archive className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-2xl font-semibold">Geen archief toernooien gevonden</p>
                  <p className="mt-2">Er zijn momenteel geen afgelopen toernooien in het archief.</p>
                </div>
              )
            }

            // Filter archive tournaments by selected type
            const filteredArchiveTournaments = filterTournamentsByType(archiveTournaments, selectedType)
            
            if (filteredArchiveTournaments.length === 0) {
              return (
                <div className="text-center text-[#2e2c2c] mt-12" data-cy="no_filtered_archive_tournaments_message">
                  <Archive className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-2xl font-semibold">Geen {selectedType === 'all' ? 'archief' : selectedType} toernooien gevonden</p>
                  <p className="mt-2">Er zijn momenteel geen afgelopen toernooien van dit type in het archief.</p>
                </div>
              )
            }

            // If filtering by specific type, show all tournaments of that type
            if (selectedType !== 'all') {
              return (
                <div className="space-y-8">
                  <div ref={sectionRefs.archive} id="archive" className="mb-12 scroll-mt-24">
                    <h2 className="text-3xl font-bold text-[#2e2c2c] mb-6 border-b-2 border-mainAccent pb-2 flex items-center">
                      <Archive className="mr-3 h-8 w-8 text-mainAccent" />
                      Archief - {[
                        { id: 'herfst', label: 'Herfstcompetitie' },
                        { id: 'lente', label: 'Lentecompetitie' },
                        { id: 'blitz', label: 'Snelschaakkampioenschap' },
                        { id: 'zomer', label: 'Zomertoernooi' },
                        { id: 'other', label: 'Nevenactiviteiten' }
                      ].find(t => t.id === selectedType)?.label}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArchiveTournaments.map(tournament => (
                      <TournamentCard key={tournament.tournament_id} tournament={tournament} />
                    ))}
                  </div>
                </div>
              )
            }

            // Show categorized view for 'all'
            const categorized = categorizeArchiveTournaments(archiveTournaments)
            const hasAnyTournaments = Object.values(categorized).some(category => category.length > 0)
            
            if (!hasAnyTournaments) {
              return (
                <div className="text-center text-[#2e2c2c] mt-12" data-cy="no_archive_tournaments_message">
                  <Archive className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-2xl font-semibold">Geen archief toernooien gevonden</p>
                  <p className="mt-2">Er zijn momenteel geen afgelopen toernooien in het archief.</p>
                </div>
              )
            }

            return (
              <div className="space-y-8">
                <div ref={sectionRefs.archive} id="archive" className="mb-12 scroll-mt-24">
                  <h2 className="text-3xl font-bold text-[#2e2c2c] mb-6 border-b-2 border-mainAccent pb-2 flex items-center">
                    <Archive className="mr-3 h-8 w-8 text-mainAccent" />
                    Archief Toernooien
                  </h2>
                </div>
                {renderNavigation(categorized, true)}
                {renderTournamentSection('Herfstcompetitie', categorized.herfstcompetitie, 'herfstcompetitie', true)}
                {renderTournamentSection('Lentecompetitie', categorized.lentecompetitie, 'lentecompetitie', true)}
                {renderTournamentSection('Snelschaakkampioenschap', categorized.blitzkampioenschap, 'blitzkampioenschap', true)}
                {renderTournamentSection('Zomertoernooi', categorized.zomertoernooi, 'zomertoernooi', true)}
                {renderTournamentSection('Nevenactiviteiten', categorized.other, 'other', true)}
              </div>
            )
          })()
        ) : (
          // Current Tournaments View
          (() => {
            if (!tournaments || tournaments.length === 0) {
              return (
                <div className="text-center text-[#2e2c2c] mt-12" data-cy="no_tournaments_message">
                  <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-2xl font-semibold">Geen actieve toernooien gevonden</p>
                  <p className="mt-2">Er zijn momenteel geen actieve toernooien. Kom later terug voor updates!</p>
                </div>
              )
            }

            // Filter current tournaments by selected type
            const filteredTournaments = filterTournamentsByType(tournaments, selectedType)
            
            if (filteredTournaments.length === 0) {
              return (
                <div className="text-center text-[#2e2c2c] mt-12" data-cy="no_filtered_tournaments_message">
                  <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-2xl font-semibold">Geen {selectedType === 'all' ? 'actieve' : selectedType} toernooien gevonden</p>
                  <p className="mt-2">Er zijn momenteel geen actieve toernooien van dit type.</p>
                </div>
              )
            }

            // If filtering by specific type, show all tournaments of that type
            if (selectedType !== 'all') {
              return (
                <div className="space-y-8">
                  <div className="mb-12 scroll-mt-24">
                    <h2 className="text-3xl font-bold text-[#2e2c2c] mb-6 border-b-2 border-mainAccent pb-2 flex items-center">
                      <Calendar className="mr-3 h-8 w-8 text-mainAccent" />
                      Huidige - {[
                        { id: 'herfst', label: 'Herfstcompetitie' },
                        { id: 'lente', label: 'Lentecompetitie' },
                        { id: 'blitz', label: 'Snelschaakkampioenschap' },
                        { id: 'zomer', label: 'Zomertoernooi' },
                        { id: 'other', label: 'Nevenactiviteiten' }
                      ].find(t => t.id === selectedType)?.label}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTournaments.map(tournament => (
                      <TournamentCard key={tournament.tournament_id} tournament={tournament} />
                    ))}
                  </div>
                </div>
              )
            }

            // Show categorized view for 'all'
            const categorized = categorizeTournaments(tournaments)
            const hasAnyTournaments = Object.values(categorized).some(category => category.length > 0)
            
            if (!hasAnyTournaments) {
              return (
                <div className="text-center text-[#2e2c2c] mt-12" data-cy="no_tournaments_message">
                  <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-2xl font-semibold">Geen actieve toernooien gevonden</p>
                  <p className="mt-2">Er zijn momenteel geen actieve toernooien. Kom later terug voor updates!</p>
                </div>
              )
            }

            return (
              <div className="space-y-8">
                {renderNavigation(categorized)}
                {renderTournamentSection('Herfstcompetitie', categorized.herfstcompetitie, 'herfstcompetitie')}
                {renderTournamentSection('Lentecompetitie', categorized.lentecompetitie, 'lentecompetitie')}
                {renderTournamentSection('Snelschaakkampioenschap', categorized.blitzkampioenschap, 'blitzkampioenschap')}
                {renderTournamentSection('Zomertoernooi', categorized.zomertoernooi, 'zomertoernooi')}
                {renderTournamentSection('Nevenactiviteiten', categorized.other, 'other')}
              </div>
            )
          })()
        )}
      </div>
    </div>
  )
}


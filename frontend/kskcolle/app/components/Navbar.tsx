"use client"

import Link from "next/link"
import {
  Home,
  Users,
  Trophy,
  BarChartBigIcon as ChartColumnBig,
  CalendarDays,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Globe,
  PersonStanding,
  Mail,
  BookOpen,
  History,
  Puzzle,
} from "lucide-react"
import { type ReactNode, useState, useEffect, useMemo } from "react"
import { usePathname } from "next/navigation"
import LoginSheet from "./LoginSheet"
import { useAuth } from "../contexts/auth"
import ProfileDropdown from "./ProfileDropdown"
import NotificationBell from "../../components/NotificationBell"
import useSWR from "swr"
import { getAll } from "../api/index"

interface Tournament {
  tournament_id: number
  naam: string
  finished: boolean
  rounds: Array<{
    ronde_datum: Date
  }>
}

function isBlitzTournament(naam: string): boolean {
  const name = naam.toLowerCase()
  return (
    name.includes('blitz') ||
    name.includes('snel') ||
    name.includes('snelschaak') ||
    name.includes('blitzkampioenschap')
  )
}

function getLastRoundDate(tournament: Tournament): Date | null {
  const sortedRounds = [...tournament.rounds].sort((a, b) => {
    const dateA = new Date(a.ronde_datum).getTime()
    const dateB = new Date(b.ronde_datum).getTime()
    return dateB - dateA
  })
  return sortedRounds.length > 0 ? new Date(sortedRounds[0].ronde_datum) : null
}

function pickLatestTournament(
  current: Tournament | null,
  currentDate: Date | null,
  candidate: Tournament,
  candidateDate: Date | null,
): Tournament {
  if (!current) return candidate
  if (candidateDate && currentDate && candidateDate > currentDate) return candidate
  if (!currentDate && candidateDate) return candidate
  if (!currentDate && !candidateDate && candidate.tournament_id > current.tournament_id) {
    return candidate
  }
  return current
}

export default function Navbar() {
  const { isAuthed } = useAuth()
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileAboutOpen, setIsMobileAboutOpen] = useState(false)
  const [isMobileYouthOpen, setIsMobileYouthOpen] = useState(false)
  const [isMobileTournamentOpen, setIsMobileTournamentOpen] = useState(false)
  const [isMobileLinksOpen, setIsMobileLinksOpen] = useState(false)
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false)

  // Fetch tournaments for navbar shortcuts (herfst, lente, blitz)
  const { data: tournaments = [] } = useSWR<Tournament[]>(
    'tournament?active=true&is_youth=false',
    getAll,
    { dedupingInterval: 10 * 60 * 1000 }, // 10 minutes
  )

  const { latestHerfst, latestLente, latestBlitz } = useMemo(() => {
    let latestHerfst: Tournament | null = null
    let latestLente: Tournament | null = null
    let latestHerfstDate: Date | null = null
    let latestLenteDate: Date | null = null

    const blitzEditions = new Map<
      string,
      { representative: Tournament; lastRoundDate: Date | null }
    >()

    tournaments.forEach((tournament) => {
      const name = tournament.naam.toLowerCase()
      const isHerfst = name.includes('herfst') || name.includes('herfstcompetitie')
      const isLente = name.includes('lente') || name.includes('lentecompetitie')
      const lastRoundDate = getLastRoundDate(tournament)

      if (isHerfst) {
        latestHerfst = pickLatestTournament(latestHerfst, latestHerfstDate, tournament, lastRoundDate)
        if (latestHerfst === tournament) latestHerfstDate = lastRoundDate
      }

      if (isLente) {
        latestLente = pickLatestTournament(latestLente, latestLenteDate, tournament, lastRoundDate)
        if (latestLente === tournament) latestLenteDate = lastRoundDate
      }

      if (isBlitzTournament(tournament.naam)) {
        const editionKey = tournament.naam
        const existing = blitzEditions.get(editionKey)
        if (!existing) {
          blitzEditions.set(editionKey, { representative: tournament, lastRoundDate })
        } else {
          if (
            lastRoundDate &&
            (!existing.lastRoundDate || lastRoundDate > existing.lastRoundDate)
          ) {
            existing.lastRoundDate = lastRoundDate
          }
          if (tournament.tournament_id < existing.representative.tournament_id) {
            existing.representative = tournament
          }
        }
      }
    })

    let latestBlitz: Tournament | null = null
    let latestBlitzDate: Date | null = null
    for (const edition of blitzEditions.values()) {
      latestBlitz = pickLatestTournament(
        latestBlitz,
        latestBlitzDate,
        edition.representative,
        edition.lastRoundDate,
      )
      if (latestBlitz === edition.representative) latestBlitzDate = edition.lastRoundDate
    }

    return { latestHerfst, latestLente, latestBlitz }
  }, [tournaments])

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  if (!isClient) {
    return null
  }

  return (
    <nav className="bg-neutral-50 text-textColor p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <img 
            src="/images/logo.png" 
            alt="KSK Colle Logo" 
            width={32} 
            height={32} 
            className="object-contain"
          />
          <span className="text-xl font-bold text-textColor">KSK Colle</span>
        </Link>

        <div className="hidden xl:flex space-x-4">
          {/* Home */}
          <Link href="/" className="flex items-center space-x-1 font-medium hover:text-mainAccent transition-colors text-sm">
            <Home size={12} />
            <span>Home</span>
          </Link>

          {/* About Us Dropdown */}
          <div className="relative group">
            <div className="flex items-center space-x-1 font-medium hover:text-mainAccent transition-colors text-sm cursor-pointer">
              <Users size={12} />
              <span>Over Ons</span>
              <ChevronDown size={12} />
            </div>
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-1">
                <Link href="/about" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Club Info
                </Link>
                <Link href="/locatie" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Locatie
                </Link>
                <Link href="/interviews" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Interviews
                </Link>
                <Link href="/photos" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Foto&apos;s
                </Link>
                <Link href="/articles" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Artikels
                </Link>
                <Link href="/nationale-elo" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Nationale ELO
                </Link>
              </div>
            </div>
          </div>

          {/* Tournaments Dropdown */}
          <div className="relative group">
            <div className="flex items-center space-x-1 font-medium hover:text-mainAccent transition-colors text-sm cursor-pointer">
              <Trophy size={12} />
              <span>Toernooien</span>
              <ChevronDown size={12} />
            </div>
            <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-1">
                <Link href="/toernooien" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Interne toernooien
                </Link>
                <Link href="/toernooien/megaschaak" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Megaschaak
                </Link>
                <Link href="/toernooien/reglement" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Reglementen
                </Link>
                <a href="https://www.schaakligaoostvlaanderen.be/ovic" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Oost-Vlaamse Interclub
                </a>
                <a href="https://interclub.web.app/club/410/players" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Interclub
                </a>
                {(latestHerfst || latestLente || latestBlitz) && (
                  <>
                    <div className="border-t border-gray-200 my-1"></div>
                    {latestHerfst && (
                      <Link href={`/toernooien/${latestHerfst.tournament_id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                        Herfstcompetitie
                      </Link>
                    )}
                    {latestLente && (
                      <Link href={`/toernooien/${latestLente.tournament_id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                        Lentecompetitie
                      </Link>
                    )}
                    {latestBlitz && (
                      <Link href={`/toernooien/${latestBlitz.tournament_id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                        Blitzkampioenschap
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Schaaklessen */}
          <Link href="/schaaklessen" className="flex items-center space-x-1 font-medium hover:text-mainAccent transition-colors text-sm">
            <BookOpen size={12} />
            <span>Schaaklessen</span>
          </Link>

          {/* Puzzels */}
          {isAuthed && (
            <Link href="/puzzels" className="flex items-center space-x-1 font-medium hover:text-mainAccent transition-colors text-sm">
              <Puzzle size={12} />
              <span>Puzzels</span>
            </Link>
          )}

          {/* Kalender */}
          <Link href="/calendar" className="flex items-center space-x-1 font-medium hover:text-mainAccent transition-colors text-sm">
            <CalendarDays size={12} />
            <span>Kalender</span>
          </Link>


          {/* Jeugd werking */}
          <div className="relative group">
            <div className="flex items-center space-x-1 font-medium hover:text-mainAccent transition-colors text-sm cursor-pointer">
              <PersonStanding size={12} />
              <span>Jeugd</span>
              <ChevronDown size={12} />
            </div>
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-1">
                <Link href="/youth/info" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Info
                </Link>
                <Link href="/youth/leden" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Jeugdleden
                </Link>
                <Link href="/youth/calendar" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Kalender
                </Link>
                <Link href="/youth/tournaments" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Jeugd Kampioenschap
                </Link>
                <Link href="/youth/zomerkampen" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Zomerkampen
                </Link>
                <Link href="/youth/info-ovjk-2025" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Info OVJK 2025
                </Link>
                <Link href="/youth/sponsoring-ovjk-2025" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Sponsoring OVJK 2025
                </Link>
                <a href="https://sites.google.com/view/vlaams-jeugdschaakcriterium/homepage" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Vlaams Jeugdschaakcriterium
                </a>
              </div>
            </div>
          </div>

          {/* Spelers */}
          <Link href="/spelers" className="flex items-center space-x-1 font-medium hover:text-mainAccent transition-colors text-sm">
            <ChartColumnBig size={12} />
            <span>Spelers</span>
          </Link>

          {/* Historiek Dropdown */}
          <div className="relative group">
            <div className="flex items-center space-x-1 font-medium hover:text-mainAccent transition-colors text-sm cursor-pointer">
              <History size={12} />
              <span>Historiek</span>
              <ChevronDown size={12} />
            </div>
            <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-1">
                <Link href="/erelijsten" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Erelijsten
                </Link>
                <Link href="/historiek/documenten" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Historische Documenten
                </Link>
              </div>
            </div>
          </div>

          {/* External Links Dropdown */}
          <div className="relative group">
            <div className="flex items-center space-x-1 font-medium hover:text-mainAccent transition-colors text-sm cursor-pointer">
              <Globe size={12} />
              <span>Links</span>
              <ChevronDown size={12} />
            </div>
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-1">
                <a href="https://blog.frbe-kbsb-ksb.be/nl/" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  KBSB
                </a>
                <a href="https://blog.frbe-kbsb-ksb.be/nl/kalender/" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  KBSB Toernooien
                </a>
                <a href="https://www.fide.com/" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  FIDE
                </a>
                <a href="https://www.vlaamseschaakfederatie.be/" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  VSF
                </a>
                <a href="https://www.schaakligaoostvlaanderen.be/" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-mainAccent transition-colors">
                  Liga Oost-Vlaanderen
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-textColor hover:text-mainAccent transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className="hidden xl:flex items-center space-x-4">
          <Link href="/contact" className="text-textColor hover:text-mainAccent transition-colors">
            <Mail size={18} />
          </Link>
          {isAuthed && <NotificationBell />}
          {isAuthed ? <ProfileDropdown /> : <LoginSheet />}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="xl:hidden absolute top-full left-0 right-0 bg-neutral-50 shadow-md max-h-[calc(100vh-80px)] flex flex-col">
          {/* Scrollable Menu Content */}
          <div className="overflow-y-auto flex-1">
            <div className="container mx-auto py-4 space-y-4">
              {/* Home */}
              <NavItem href="/" icon={<Home size={18} />} text="Home" onClick={() => setIsMobileMenuOpen(false)} />
              
              {/* Contact */}
              <NavItem href="/contact" icon={<Mail size={18} />} text="Contact" onClick={() => setIsMobileMenuOpen(false)} />

            {/* Mobile About Us Dropdown */}
            <div className="space-y-2">
              <button
                onClick={() => setIsMobileAboutOpen(!isMobileAboutOpen)}
                className="flex items-center justify-between w-full font-medium hover:text-mainAccent transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Users size={18} />
                  <span>Over Ons</span>
                </div>
                {isMobileAboutOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {isMobileAboutOpen && (
                <div className="ml-6 space-y-2">
                  <Link
                    href="/about"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Club Info
                  </Link>
                  <Link
                    href="/locatie"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Locatie
                  </Link>
                  <Link
                    href="/interviews"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Interviews
                  </Link>
                  <Link
                    href="/photos"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Foto&apos;s
                  </Link>
                  <Link
                    href="/articles"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Artikels
                  </Link>
                  <Link
                    href="/nationale-elo"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Nationale ELO
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Tournaments Dropdown */}
            <div className="space-y-2">
              <button
                onClick={() => setIsMobileTournamentOpen(!isMobileTournamentOpen)}
                className="flex items-center justify-between w-full font-medium hover:text-mainAccent transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Trophy size={18} />
                  <span>Toernooien</span>
                </div>
                {isMobileTournamentOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {isMobileTournamentOpen && (
                <div className="ml-6 space-y-2">
                  <Link
                    href="/toernooien"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Interne toernooien
                  </Link>
                  <Link
                    href="/toernooien/megaschaak"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Megaschaak
                  </Link>
                  <Link
                    href="/toernooien/reglement"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Reglementen
                  
                  </Link>
                  <a
                    href="https://www.schaakligaoostvlaanderen.be/ovic"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Oost-Vlaamse Interclub
                  </a>
                  <a
                    href="https://interclub.web.app/club/410/players"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Interclub
                  </a>
                  {(latestHerfst || latestLente || latestBlitz) && (
                    <>
                      <div className="border-t border-gray-200 my-2"></div>
                      {latestHerfst && (
                        <Link
                          href={`/toernooien/${latestHerfst.tournament_id}`}
                          className="block font-medium hover:text-mainAccent transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Herfstcompetitie
                        </Link>
                      )}
                      {latestLente && (
                        <Link
                          href={`/toernooien/${latestLente.tournament_id}`}
                          className="block font-medium hover:text-mainAccent transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Lentecompetitie
                        </Link>
                      )}
                      {latestBlitz && (
                        <Link
                          href={`/toernooien/${latestBlitz.tournament_id}`}
                          className="block font-medium hover:text-mainAccent transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Blitzkampioenschap
                        </Link>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Schaaklessen */}
            <NavItem href="/schaaklessen" icon={<BookOpen size={18} />} text="Schaaklessen" onClick={() => setIsMobileMenuOpen(false)} />

            {/* Mobile Puzzels */}
            {isAuthed && (
              <NavItem href="/puzzels" icon={<Puzzle size={18} />} text="Puzzels" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* Mobile Kalender */}
            <NavItem href="/calendar" icon={<CalendarDays size={18} />} text="Kalender" onClick={() => setIsMobileMenuOpen(false)} />


            {/* Mobile Youth Dropdown */}
            <div className="space-y-2">
              <button
                onClick={() => setIsMobileYouthOpen(!isMobileYouthOpen)}
                className="flex items-center justify-between w-full font-medium hover:text-mainAccent transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <PersonStanding size={18} />
                  <span>Jeugd</span>
                </div>
                {isMobileYouthOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {isMobileYouthOpen && (
                <div className="ml-6 space-y-2">
                  <Link
                    href="/youth/info"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Info
                  </Link>
                  <Link
                    href="/youth/leden"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Jeugdleden
                  </Link>
                  <Link
                    href="/youth/calendar"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Kalender
                  </Link>
                  <Link
                    href="/youth/tournaments"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Jeugd Kampioenschap
                  </Link>
                  <Link
                    href="/youth/zomerkampen"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Zomerkampen
                  </Link>
                  <Link
                    href="/youth/info-ovjk-2025"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Info OVJK 2025
                  </Link>
                  <Link
                    href="/youth/sponsoring-ovjk-2025"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sponsoring OVJK 2025
                  </Link>
                  <a
                    href="https://sites.google.com/view/vlaams-jeugdschaakcriterium/homepage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Vlaams Jeugdschaakcriterium
                  </a>
                </div>
              )}
            </div>

            {/* Mobile Spelers */}
            <NavItem href="/spelers" icon={<ChartColumnBig size={18} />} text="Spelers" onClick={() => setIsMobileMenuOpen(false)} />

            {/* Mobile Historiek Dropdown */}
            <div className="space-y-2">
              <button
                onClick={() => setIsMobileHistoryOpen(!isMobileHistoryOpen)}
                className="flex items-center justify-between w-full font-medium hover:text-mainAccent transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <History size={18} />
                  <span>Historiek</span>
                </div>
                {isMobileHistoryOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {isMobileHistoryOpen && (
                <div className="ml-6 space-y-2">
                  <Link
                    href="/erelijsten"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Erelijsten
                  </Link>
                  <Link
                    href="/historiek/documenten"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Historische Documenten
                  </Link>
                </div>
              )}
            </div>
            
            {/* Mobile External Links Dropdown */}
            <div className="space-y-2">
              <button
                onClick={() => setIsMobileLinksOpen(!isMobileLinksOpen)}
                className="flex items-center justify-between w-full font-medium hover:text-mainAccent transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Globe size={18} />
                  <span>Links</span>
                </div>
                {isMobileLinksOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {isMobileLinksOpen && (
                <div className="ml-6 space-y-2">
                  <a
                    href="https://blog.frbe-kbsb-ksb.be/nl/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    KBSB
                  </a>
                  <a
                    href="https://blog.frbe-kbsb-ksb.be/nl/kalender/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    KBSB Toernooien
                  </a>
                  <a
                    href="https://www.fide.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    FIDE
                  </a>
                  <a
                    href="https://www.vlaamseschaakfederatie.be/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    VSF
                  </a>
                  <a
                    href="https://www.schaakligaoostvlaanderen.be/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-medium hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Liga Oost-Vlaanderen
                  </a>
                </div>
              )}
            </div>
          </div>
          </div>

          {/* Profile and Notifications - Fixed at bottom */}
          <div className="border-t border-gray-200 bg-white px-4 py-3 flex items-center gap-3 sticky bottom-0 z-10">
            {isAuthed ? (
              <>
                <ProfileDropdown />
                <span className="text-sm font-medium text-gray-700 flex-1">
                  {isAuthed && typeof window !== 'undefined' && localStorage.getItem('user') 
                    ? JSON.parse(localStorage.getItem('user') || '{}')?.voornaam || 'Profiel'
                    : 'Profiel'}
                </span>
                {isAuthed && <NotificationBell />}
              </>
            ) : (
              <LoginSheet />
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
interface NavItemProps {
  href: string
  icon: ReactNode
  text: string
  onClick?: () => void
}

function NavItem({ href, icon, text, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-1.5 font-medium hover:text-mainAccent transition-colors"
      onClick={onClick}
    >
      {icon}
      <span>{text}</span>
    </Link>
  )
}


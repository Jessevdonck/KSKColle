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
  Archive,
  Globe,
  Medal,
  PersonStanding,
  Mail,
  BookOpen,
  History,
} from "lucide-react"
import { type ReactNode, useState, useEffect } from "react"
import Image from "next/image"
import LoginSheet from "./LoginSheet"
import { useAuth } from "../contexts/auth"
import ProfileDropdown from "./ProfileDropdown"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function Navbar() {
  const { isAuthed } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileAboutOpen, setIsMobileAboutOpen] = useState(false)
  const [isMobileYouthOpen, setIsMobileYouthOpen] = useState(false)
  const [isMobileTournamentOpen, setIsMobileTournamentOpen] = useState(false)
  const [isMobileLinksOpen, setIsMobileLinksOpen] = useState(false)
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }


  return (
    <nav className="bg-neutral-50 text-textColor p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Image 
            src="/images/logo.png" 
            alt="KSK Colle Logo" 
            width={32} 
            height={32} 
            className="object-contain"
          />
          <span className="text-xl font-bold text-textColor">KSK Colle</span>
        </Link>

        <div className="hidden xl:flex space-x-8">
          {/* Home */}
          <Link href="/" className="flex items-center space-x-2 font-semibold hover:text-mainAccent transition-colors">
            <Home size={20} />
            <span>Home</span>
          </Link>

          {/* About Us Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center space-x-2 font-semibold hover:text-mainAccent transition-colors">
              <Users size={20} />
              <span>Over Ons</span>
              <ChevronDown size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild className="hover:cursor-pointer">
                <Link href="/about" className="flex items-center">
                  <span>Club Info</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:cursor-pointer">
                <Link href="/interviews" className="flex items-center">
                  <span>Interviews</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:cursor-pointer">
                <Link href="/photos" className="flex items-center">
                  <span>Foto&apos;s</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tournaments Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center space-x-2 font-semibold hover:text-mainAccent transition-colors">
              <Trophy size={20} />
              <span>Toernooien</span>
              <ChevronDown size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild className="hover:cursor-pointer">
                <Link href="/toernooien" className="flex items-center">
                  <span>Huidige Toernooien</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:cursor-pointer">
                <Link href="/toernooien/rapidtoernooi" className="flex items-center">
                  <span>Rapidtoernooi</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:cursor-pointer">
                <Link href="/toernooien/reglement" className="flex items-center">
                  <span>Reglementen</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:cursor-pointer">
                <a href="https://www.demercatel.be/oost-vlaamseinterclub/" target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <span>Oost-Vlaamse Interclub</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:cursor-pointer">
                <a href="https://interclub.web.app/" target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <span>Interclub</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Kalender */}
          <Link href="/calendar" className="flex items-center space-x-2 font-semibold hover:text-mainAccent transition-colors">
            <CalendarDays size={20} />
            <span>Kalender</span>
          </Link>


          {/* Jeugd werking */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-2 font-semibold hover:text-mainAccent transition-colors">
                <PersonStanding size={20} />
                <span>Jeugd</span>
                <ChevronDown size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild className="hover:cursor-pointer">
                  <Link href="/youth/info" className="flex items-center">
                    <span>Info</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:cursor-pointer">
                  <Link href="/youth/calendar" className="flex items-center">
                    <span>Kalender</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:cursor-pointer">
                  <Link href="/youth/tournaments" className="flex items-center">
                    <span>Jeugd Kampioenschap</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:cursor-pointer">
                  <Link href="/youth/zomerkampen" className="flex items-center">
                    <span>Zomerkampen</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:cursor-pointer">
                  <Link href="/youth/info-ovjk-2025" className="flex items-center">
                    <span>Info OVJK 2025</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:cursor-pointer">
                  <Link href="/youth/sponsoring-ovjk-2025" className="flex items-center">
                    <span>Sponsoring OVJK 2025</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:cursor-pointer">
                  <a href="https://sites.google.com/view/vlaams-jeugdschaakcriterium/homepage" target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <span>Vlaams Jeugdschaakcriterium</span>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          {/* Spelers */}
          <Link href="/spelers" className="flex items-center space-x-2 font-semibold hover:text-mainAccent transition-colors">
            <ChartColumnBig size={20} />
            <span>Spelers</span>
          </Link>

          {/* Historiek Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center space-x-2 font-semibold hover:text-mainAccent transition-colors">
              <History size={20} />
              <span>Historiek</span>
              <ChevronDown size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild className="hover:cursor-pointer">
                <Link href="/erelijsten" className="flex items-center">
                  <span>Erelijsten</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:cursor-pointer">
                <Link href="/historiek/documenten" className="flex items-center">
                  <span>Historische Documenten</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* External Links Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-2 font-semibold hover:text-mainAccent transition-colors">
                <Globe size={20} />
                <span>Links</span>
                <ChevronDown size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild className="hover:cursor-pointer">
                  <a href="https://blog.frbe-kbsb-ksb.be/nl/" target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <span>KBSB</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:cursor-pointer">
                  <a href="https://blog.frbe-kbsb-ksb.be/nl/kalender/" target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <span>KBSB Toernooien</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:cursor-pointer">
                  <a href="https://www.fide.com/" target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <span>FIDE</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:cursor-pointer">
                  <a href="https://www.vlaamseschaakfederatie.be/" target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <span>VSF</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:cursor-pointer">
                  <a href="https://www.schaakligaoostvlaanderen.be/" target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <span>Liga Oost-Vlaanderen</span>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <Mail size={20} />
          </Link>
          {isAuthed ? <ProfileDropdown /> : <LoginSheet />}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="xl:hidden absolute top-full left-0 right-0 bg-neutral-50 shadow-md">
          <div className="container mx-auto py-4 space-y-4">
            {/* Home */}
            <NavItem href="/" icon={<Home size={20} />} text="Home" onClick={() => setIsMobileMenuOpen(false)} />
            
            {/* Contact */}
            <NavItem href="/contact" icon={<Mail size={20} />} text="Contact" onClick={() => setIsMobileMenuOpen(false)} />

            {/* Mobile About Us Dropdown */}
            <div className="space-y-2">
              <button
                onClick={() => setIsMobileAboutOpen(!isMobileAboutOpen)}
                className="flex items-center justify-between w-full font-semibold hover:text-mainAccent transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Users size={20} />
                  <span>Over Ons</span>
                </div>
                {isMobileAboutOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {isMobileAboutOpen && (
                <div className="ml-6 space-y-2">
                  <Link
                    href="/about"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Club Info
                  </Link>
                  <Link
                    href="/interviews"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Interviews
                  </Link>
                  <Link
                    href="/photos"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Foto&apos;s
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Tournaments Dropdown */}
            <div className="space-y-2">
              <button
                onClick={() => setIsMobileTournamentOpen(!isMobileTournamentOpen)}
                className="flex items-center justify-between w-full font-semibold hover:text-mainAccent transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Trophy size={20} />
                  <span>Toernooien</span>
                </div>
                {isMobileTournamentOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {isMobileTournamentOpen && (
                <div className="ml-6 space-y-2">
                  <Link
                    href="/toernooien"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Huidige Toernooien
                  </Link>
                  <Link
                    href="/toernooien"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Rapidtoernooi
                  </Link>
                  <Link
                    href="/toernooien/reglement"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Reglementen
                  </Link>
                  <a
                    href="https://www.demercatel.be/oost-vlaamseinterclub/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Oost-Vlaamse Interclub
                  </a>
                  <a
                    href="https://interclub.web.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Interclub
                  </a>
                </div>
              )}
            </div>

            {/* Mobile Kalender */}
            <NavItem href="/calendar" icon={<CalendarDays size={20} />} text="Kalender" onClick={() => setIsMobileMenuOpen(false)} />


            {/* Mobile Youth Dropdown */}
            <div className="space-y-2">
              <button
                onClick={() => setIsMobileYouthOpen(!isMobileYouthOpen)}
                className="flex items-center justify-between w-full font-semibold hover:text-mainAccent transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <PersonStanding size={20} />
                  <span>Jeugd</span>
                </div>
                {isMobileYouthOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {isMobileYouthOpen && (
                <div className="ml-6 space-y-2">
                  <Link
                    href="/youth/info"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Info
                  </Link>
                  <Link
                    href="/youth/calendar"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Kalender
                  </Link>
                  <Link
                    href="/youth/tournaments"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Jeugd Kampioenschap
                  </Link>
                  <Link
                    href="/youth/zomerkampen"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Zomerkampen
                  </Link>
                  <Link
                    href="/youth/info-ovjk-2025"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Info OVJK 2025
                  </Link>
                  <Link
                    href="/youth/sponsoring-ovjk-2025"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sponsoring OVJK 2025
                  </Link>
                  <a
                    href="https://sites.google.com/view/vlaams-jeugdschaakcriterium/homepage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Vlaams Jeugdschaakcriterium
                  </a>
                </div>
              )}
            </div>

            {/* Mobile Spelers */}
            <NavItem href="/spelers" icon={<ChartColumnBig size={20} />} text="Spelers" onClick={() => setIsMobileMenuOpen(false)} />

            {/* Mobile Historiek Dropdown */}
            <div className="space-y-2">
              <button
                onClick={() => setIsMobileHistoryOpen(!isMobileHistoryOpen)}
                className="flex items-center justify-between w-full font-semibold hover:text-mainAccent transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <History size={20} />
                  <span>Historiek</span>
                </div>
                {isMobileHistoryOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {isMobileHistoryOpen && (
                <div className="ml-6 space-y-2">
                  <Link
                    href="/erelijsten"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Erelijsten
                  </Link>
                  <Link
                    href="/historiek/documenten"
                    className="block font-semibold hover:text-mainAccent transition-colors"
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
                className="flex items-center justify-between w-full font-semibold hover:text-mainAccent transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Globe size={20} />
                  <span>Links</span>
                </div>
                {isMobileLinksOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {isMobileLinksOpen && (
                <div className="ml-6 space-y-2">
                  <a
                    href="https://blog.frbe-kbsb-ksb.be/nl/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    KBSB
                  </a>
                  <a
                    href="https://blog.frbe-kbsb-ksb.be/nl/kalender/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    KBSB Toernooien
                  </a>
                  <a
                    href="https://www.fide.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    FIDE
                  </a>
                  <a
                    href="https://www.vlaamseschaakfederatie.be/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    VSF
                  </a>
                  <a
                    href="https://www.schaakligaoostvlaanderen.be/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-semibold hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Liga Oost-Vlaanderen
                  </a>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200">{isAuthed ? <ProfileDropdown /> : <LoginSheet />}</div>
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
      className="flex items-center space-x-2 font-semibold hover:text-mainAccent transition-colors"
      onClick={onClick}
    >
      {icon}
      <span>{text}</span>
    </Link>
  )
}


'use client'

import Link from "next/link"
import { Crown, Home, Users, Trophy, BarChartBigIcon as ChartColumnBig, CalendarDays, Menu, X } from 'lucide-react'
import { ReactNode, useState, useEffect } from "react"
import LoginSheet from "./LoginSheet"
import { useAuth } from "../contexts/auth"
import ProfileDropdown from "./ProfileDropdown"

export default function Navbar() {
  const { isAuthed } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; 
  }

  const navItems = [
    { href: "/", icon: <Home size={20} />, text: "Home" },
    { href: "/about", icon: <Users size={20} />, text: "Over Ons" },
    { href: "/calendar", icon: <CalendarDays size={20} />, text: "Kalender" },
    { href: "/toernooien", icon: <Trophy size={20} />, text: "Toernooien" },
    { href: "/spelers", icon: <ChartColumnBig size={20} />, text: "Spelers" },
  ]

  return (
    <nav className="bg-neutral-50 text-textColor p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Crown size={32} className="text-mainAccent" />
          <span className="text-xl font-bold text-textColor">KSK Colle</span>
        </Link>
        
        <div className="hidden md:flex space-x-8">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>

        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-textColor hover:text-mainAccent transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className="hidden md:block">
          {isAuthed ? (<ProfileDropdown />) : (<LoginSheet />)}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-neutral-50 shadow-md">
          <div className="container mx-auto py-4 space-y-4">
            {navItems.map((item) => (
              <NavItem key={item.href} {...item} onClick={() => setIsMobileMenuOpen(false)} />
            ))}
            <div className="pt-4 border-t border-gray-200">
              {isAuthed ? (<ProfileDropdown />) : (<LoginSheet />)}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

interface NavItemProps {
  href: string;
  icon: ReactNode;
  text: string;
  onClick?: () => void;
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


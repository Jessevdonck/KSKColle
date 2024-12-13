'use client'

import Link from "next/link"
import { Crown, Home, Users, Trophy, BarChartBigIcon as ChartColumnBig, CalendarDays } from 'lucide-react'
import { ReactNode } from "react"
import LoginSheet from "./LoginSheet"
import { useAuth } from "../contexts/auth"
import ProfileDropdown from "./ProfileDropdown"

export default function Navbar() {
  const { isAuthed }  = useAuth();

  const navItems = [
    { href: "/", icon: <Home size={20}  />, text: "Home" },
    { href: "/about", icon: <Users size={20}  />, text: "Over Ons" },
    { href: "/calendar", icon: <CalendarDays size={20} />, text: "Kalender" },
    { href: "/toernooien", icon: <Trophy size={20}   />, text: "Toernooien" },
    { href: "/spelers", icon: <ChartColumnBig size={20}  />, text: "Spelers" },
  ]

  return (
    <nav className="bg-neutral-50 text-textColor p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Crown size={32} className="text-mainAccent" />
          <span className="text-xl font-bold text-textColor md:hidden lg:block">KSK Colle</span>
        </Link>
        
        <div className="hidden md:flex space-x-8">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
        {isAuthed ? <ProfileDropdown /> : <LoginSheet />}
      </div>
    </nav>
  )
}

interface NavItemProps {
    href: string;
    icon: ReactNode;
    text: string;
}

function NavItem({ href, icon, text }: NavItemProps) {
  return (
    <Link href={href} className="flex items-center space-x-2 font-semibold hover:text-mainAccent transition-colors">
      {icon}
      <span>{text}</span>
    </Link>
  )
}


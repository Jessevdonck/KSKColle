'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Crown, Home, Users, Trophy, ChartColumnBig, CalendarDays, Menu } from "lucide-react"
import { ReactNode, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
        
        <div className="flex items-center space-x-4">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="hidden md:inline-flex bg-mainAccent text-[#FAF7F0] hover:bg-mainAccentDark hover:text-white font-semibold">
                Aanmelden
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-neutral-50">
              <DialogHeader>
                <DialogTitle className="text-mainAccent">Aanmelden</DialogTitle>
                <DialogDescription className="text-textColor/70">
                  Vul je gegevens in om aan te melden.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col space-y-4 py-4">
                <div className="flex items-center space-x-4">
                  <Label htmlFor="email" className="w-1/4 text-right text-textColor">
                    Email
                  </Label>
                  <Input id="email" type="email" className="flex-1 bg-white border-mainAccent text-textColor" />
                </div>
                <div className="flex items-center space-x-4">
                  <Label htmlFor="password" className="w-1/4 text-right text-textColor">
                    Wachtwoord
                  </Label>
                  <Input id="password" type="password" className="flex-1 bg-white border-mainAccent text-textColor" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="bg-mainAccent text-[#FAF7F0] hover:bg-mainAccentDark hover:text-white font-semibold">
                  Aanmelden
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-neutral-50">
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-2 text-textColor hover:text-mainAccent transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.text}</span>
                  </Link>
                ))}
                <Button
                  variant="outline"
                  className="bg-mainAccent text-[#FAF7F0] hover:bg-mainAccentDark hover:text-white"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    setIsOpen(true)
                  }}
                >
                  Aanmelden
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
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
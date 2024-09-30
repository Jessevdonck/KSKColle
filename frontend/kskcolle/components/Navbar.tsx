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
    { href: "/", icon: <Home size={20} />, text: "Home" },
    { href: "/about", icon: <Users size={20} />, text: "Over Ons" },
    { href: "/kalender", icon: <CalendarDays size={20} />, text: "Kalender" },
    { href: "/toernooien", icon: <Trophy size={20} />, text: "Toernooien" },
    { href: "/spelers", icon: <ChartColumnBig size={20} />, text: "Spelers" },
  ]

  return (
    <nav className="bg-[#FAF7F0] text-[#4A4947] p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Crown size={32} className="text-[#B17457]" />
          <span className="text-xl font-bold text-[#4A4947] md:hidden lg:block">KSK Colle</span>
        </Link>
        
        <div className="hidden md:flex space-x-6">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
        
        <div className="flex items-center space-x-4">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="hidden md:inline-flex bg-[#B17457] text-[#FAF7F0] hover:bg-[#D8D2C2] hover:text-[#4A4947]">
                Aanmelden
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#FAF7F0]">
              <DialogHeader>
                <DialogTitle className="text-[#4A4947]">Aanmelden</DialogTitle>
                <DialogDescription className="text-[#4A4947]/70">
                  Vul je gegevens in om aan te melden.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col space-y-4 py-4">
                <div className="flex items-center space-x-4">
                  <Label htmlFor="email" className="w-1/4 text-right text-[#4A4947]">
                    Email
                  </Label>
                  <Input id="email" type="email" className="flex-1 bg-white border-[#B17457] text-[#4A4947]" />
                </div>
                <div className="flex items-center space-x-4">
                  <Label htmlFor="password" className="w-1/4 text-right text-[#4A4947]">
                    Wachtwoord
                  </Label>
                  <Input id="password" type="password" className="flex-1 bg-white border-[#B17457] text-[#4A4947]" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="bg-[#B17457] text-[#FAF7F0] hover:bg-[#D8D2C2] hover:text-[#4A4947]">
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
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-[#FAF7F0]">
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-2 text-[#4A4947] hover:text-[#B17457] transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.text}</span>
                  </Link>
                ))}
                <Button
                  variant="outline"
                  className="bg-[#B17457] text-[#FAF7F0] hover:bg-[#D8D2C2] hover:text-[#4A4947]"
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
    <Link href={href} className="flex items-center space-x-1 hover:text-[#B17457] transition-colors">
      {icon}
      <span>{text}</span>
    </Link>
  )
}
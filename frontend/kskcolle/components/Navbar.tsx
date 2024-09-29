import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Crown, Home, Users, Trophy, ChartColumnBig, CalendarDays } from "lucide-react"
import { ReactNode } from "react"

export default function Navbar() {
  return (
    <nav className="bg-[#FAF7F0] text-[#4A4947] p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Crown size={32} className="text-[#B17457]" />
          <span className="text-xl font-bold text-[#4A4947]">KSK Colle</span>
        </Link>
        
        <div className="hidden md:flex space-x-6">
          <NavItem href="/" icon={<Home size={20} />} text="Home" />
          <NavItem href="/over-ons" icon={<Users size={20} />} text="Over Ons" />
          <NavItem href="/kalender" icon={<CalendarDays size={20} />} text="Kalender" />
          <NavItem href="/toernooien" icon={<Trophy size={20} />} text="Toernooien" />
          <NavItem href="/spelers" icon={<ChartColumnBig size={20} />} text="Spelers" />
        </div>
        
        <div className="flex items-center">
          <Button variant="outline" className="hidden md:inline-flex bg-[#B17457] text-[#FAF7F0] hover:bg-[#D8D2C2] hover:text-[#4A4947]">
            Aanmelden
          </Button>
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
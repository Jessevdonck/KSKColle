"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, Trophy, Calendar, Settings, Shield } from "lucide-react"

const Sidebar = () => {
  const pathname = usePathname()

  const menuItems = [
    { href: "#dashboard", icon: Home, label: "Dashboard", color: "from-blue-500 to-blue-600" },
    { href: "#users", icon: Users, label: "Gebruikers", color: "from-green-500 to-green-600" },
    { href: "#tournaments", icon: Trophy, label: "Toernooien", color: "from-purple-500 to-purple-600" },
    { href: "#calendar", icon: Calendar, label: "Kalender", color: "from-orange-500 to-orange-600" },
  ]

  return (
    <div className="w-80 bg-white shadow-lg border-r border-neutral-200 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">KSK Colle</h2>
            <p className="text-white/80 text-sm">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-6">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === "/admin" && window.location.hash === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-mainAccent text-white shadow-md"
                    : "text-gray-700 hover:bg-mainAccent/10 hover:text-mainAccent"
                }`}
              >
                <div
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isActive ? "bg-white/20" : `bg-gradient-to-r ${item.color} text-white group-hover:scale-110`
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-medium">{item.label}</span>
                  {isActive && <div className="text-xs text-white/80 mt-0.5">Actief</div>}
                </div>
                {!isActive && (
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 bg-mainAccent rounded-full"></div>
                  </div>
                )}
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Snelle Acties</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Settings className="h-4 w-4" />
              Instellingen
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}

export default Sidebar

"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import UsersManagement from "../Users/UsersManagement"
import TournamentsManagement from "../Tournaments/TournamentsManagement"
import CalendarManagement from "../Calendar/CalendarManagement"
import SevillaImportPage from "../SevillaImport/page"
import ColorSettings from "../Settings/ColorSettings"
import { Users, Trophy, CalendarDays, Settings, BarChart3, Shield, Upload, Palette, Euro } from "lucide-react"
import { getAll } from "../../api/index"
import { useAuth } from "../../contexts/auth"
import { isAdmin } from "@/lib/roleUtils"
import { isBoardMember } from "@/lib/roleUtils"
import Link from "next/link"

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isClient, setIsClient] = useState(false)
  const { user: currentUser } = useAuth()

  // 1) Haal gebruikers op
  const { data: users = [] } = useSWR("users", () => getAll("users"))
  // 2) Haal actieve toernooien op
  const { data: activeTournaments = [] } = useSWR("tournament?active=true", () => getAll("tournament?active=true"))
  // 3) Haal calendar events op 
  const { data: events = [] } = useSWR("calendar", () => getAll("calendar"));

  // Check if user has admin or bestuurslid role
  const hasAccess = currentUser && (isAdmin(currentUser) || isBoardMember(currentUser))

  const today = new Date()
  const upcomingEventsCount = events.filter((ev: { date: string }) => {
    // ev.date is bv "2025-06-17T00:00:00.000Z"
    return new Date(ev.date) > today
  }).length

  const tabs = [
    { value: "dashboard", label: "Dashboard", icon: BarChart3, adminOnly: false },
    { value: "users", label: "Leden", icon: Users, adminOnly: true },
    { value: "lidgeld", label: "Lidgeld", icon: Euro, adminOnly: false },
    { value: "tournaments", label: "Toernooien", icon: Trophy, adminOnly: true },
    { value: "calendar", label: "Kalender", icon: CalendarDays, adminOnly: true },
    { value: "sevilla", label: "Sevilla Import", icon: Upload, adminOnly: true },
    { value: "settings", label: "Instellingen", icon: Palette, adminOnly: true },
  ].filter(tab => {
    // Bestuursleden zien alleen dashboard en lidgeld
    if (currentUser && isBoardMember(currentUser) && !isAdmin(currentUser)) {
      return !tab.adminOnly
    }
    // Admins zien alles
    return !tab.adminOnly || (currentUser && isAdmin(currentUser))
  })

  // Debug logging
  console.log('AdminPage Debug:', {
    currentUser,
    roles: currentUser?.roles,
    rolesType: typeof currentUser?.roles,
    isAdmin: currentUser ? isAdmin(currentUser) : false,
    isBoardMember: currentUser ? isBoardMember(currentUser) : false,
    hasAccess,
    availableTabs: tabs.map(t => t.value),
    token: typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null
  })

  useEffect(() => {
    setIsClient(true)

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      const availableTabs = tabs.map(tab => tab.value)
      if (availableTabs.includes(hash)) {
        setActiveTab(hash)
      }
    }

    if (window.location.hash) {
      handleHashChange()
    } else {
      window.location.hash = activeTab
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    window.location.hash = tab
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mainAccent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Dashboard wordt geladen...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Toegang geweigerd</h2>
          <p className="text-gray-600">Je hebt geen toegang tot het admin dashboard.</p>
          <div className="mt-4 p-4 bg-gray-100 rounded text-left text-sm">
            <p><strong>Debug info:</strong></p>
            <p>Current user: {currentUser ? 'Logged in' : 'Not logged in'}</p>
            <p>Roles: {currentUser?.roles ? JSON.stringify(currentUser.roles) : 'No roles'}</p>
            <p>Roles type: {typeof currentUser?.roles}</p>
            <p>Is Admin: {currentUser ? isAdmin(currentUser) : 'N/A'}</p>
            <p>Is Board Member: {currentUser ? isBoardMember(currentUser) : 'N/A'}</p>
            <p>Token exists: {typeof window !== "undefined" ? (localStorage.getItem("jwtToken") ? 'Yes' : 'No') : 'N/A'}</p>
          </div>
        </div>
      </div>
    )
  }

  const currentTab = tabs.find((tab) => tab.value === activeTab)

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-mainAccent/10 p-3 rounded-xl">
              <Shield className="h-8 w-8 text-mainAccent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-textColor">KSK Colle Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Beheer alle aspecten van de schaakclub</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Navigatie
              </h2>
            </div>
            <div className="p-6">
              {/* Desktop Navigation */}
              <div className="hidden lg:block">
                <TabsList className={`grid w-full grid-cols-${tabs.length} gap-2 bg-neutral-100 p-2 rounded-lg`}>
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex items-center justify-center gap-2 data-[state=active]:bg-mainAccent data-[state=active]:text-white"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>

              {/* Mobile Navigation - Dropdown */}
              <div className="lg:hidden">
                <Select value={activeTab} onValueChange={handleTabChange}>
                  <SelectTrigger className="w-full bg-neutral-100 border-neutral-200 h-12">
                    <div className="flex items-center gap-3">
                      {currentTab && (
                        <>
                          <currentTab.icon className="h-5 w-5 text-mainAccent" />
                          <span className="font-medium">{currentTab.label}</span>
                        </>
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <SelectItem key={tab.value} value={tab.value}>
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-mainAccent" />
                            <span>{tab.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="mt-0">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Welkom op het KSK Colle Dashboard
                </h2>
                <p className="text-white/80 mt-1">Selecteer een categorie om te beginnen met beheren</p>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Users Card */}
                  <div className="group relative overflow-hidden rounded-xl border border-neutral-200 hover:border-mainAccent/30 transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative p-6 text-center">
                      <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-textColor mb-3 group-hover:text-mainAccent transition-colors">
                        Actieve Leden
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-4">Het aantal geregistreerde clubleden</p>
                      <p className="text-2xl font-bold text-blue-800 mb-4">{users.length}</p>
                    </div>
                  </div>

                  {/* Tournaments Card */}
                  <div className="group relative overflow-hidden rounded-xl border border-neutral-200 hover:border-mainAccent/30 transition-all duration-300 hover:shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative p-6 text-center">
                      <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-green-500 to-green-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-textColor mb-3 group-hover:text-mainAccent transition-colors">
                        Actieve Toernooien
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-4">Toernooien die nog niet afgerond zijn</p>
                      <p className="text-2xl font-bold text-green-800 mb-4">{activeTournaments.length}</p>
                    </div>
                  </div>

                  {/* Calendar Card */}
                  <div className="group relative overflow-hidden rounded-xl border border-neutral-200 hover:border-mainAccent/30 transition-all duration-300 hover:shadow-lg md:col-span-2 lg:col-span-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative p-6 text-center">
                      <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <CalendarDays className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-textColor mb-3 group-hover:text-mainAccent transition-colors">
                        Komende Evenementen
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-4">Activiteiten gepland na vandaag</p>
                      <p className="text-2xl font-bold text-orange-800 mb-4">
                        {upcomingEventsCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Andere tabs */}
          <TabsContent value="users" className="mt-0">
            <UsersManagement />
          </TabsContent>
          <TabsContent value="lidgeld" className="mt-0">
            <Link href="/admin/lidgeld">
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="bg-mainAccent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Euro className="h-8 w-8 text-mainAccent" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Lidgeld Beheer</h3>
                <p className="text-gray-600 mb-4">Beheer lidgeld en bondslidgeld betalingen</p>
                <button className="bg-mainAccent text-white px-6 py-2 rounded-lg hover:bg-mainAccentDark transition-colors">
                  Open Lidgeld Beheer
                </button>
              </div>
            </Link>
          </TabsContent>
          <TabsContent value="tournaments" className="mt-0">
            <TournamentsManagement />
          </TabsContent>
          <TabsContent value="calendar" className="mt-0">
            <CalendarManagement />
          </TabsContent>
          <TabsContent value="sevilla" className="mt-0">
            <SevillaImportPage />
          </TabsContent>
          <TabsContent value="settings" className="mt-0">
            <ColorSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AdminPage

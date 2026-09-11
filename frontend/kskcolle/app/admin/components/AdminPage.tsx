"use client"

import { useEffect, useState, useMemo } from "react"
import useSWR from "swr"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import UsersManagement from "../Users/UsersManagement"
import TournamentsManagement from "../Tournaments/TournamentsManagement"
import CalendarManagement from "../Calendar/CalendarManagement"
import SevillaImportPage from "../SevillaImport/page"
import ColorSettings from "../Settings/ColorSettings"
import { Users, Trophy, CalendarDays, BarChart3, Shield, Upload, Palette, Euro, Puzzle } from "lucide-react"
import { getAll } from "../../api/index"
import { useAuth } from "../../contexts/auth"
import { isAdmin, isBoardMember, isPuzzleMaster } from "@/lib/roleUtils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isClient, setIsClient] = useState(false)
  const { user: currentUser } = useAuth()

  // 1) Haal gebruikers op
  const { data: users = [] } = useSWR("users", () => getAll("users"))
  // 2) Haal actieve toernooien op
  const { data: activeTournaments = [] } = useSWR("tournament?active=true", () => getAll("tournament?active=true"))
  // 3) Haal calendar events op
  const { data: events = [] } = useSWR("calendar", () => getAll("calendar"))

  // Check if user has admin or bestuurslid role
  const hasAccess = currentUser && (isAdmin(currentUser) || isBoardMember(currentUser))

  const today = new Date()
  const upcomingEventsCount = events.filter((ev: { date: string }) => {
    // ev.date is bv "2025-06-17T00:00:00.000Z"
    return new Date(ev.date) > today
  }).length

  const tabs = useMemo(
    () =>
      [
        { value: "dashboard", label: "Dashboard", icon: BarChart3, adminOnly: false, puzzleMasterOnly: false },
        { value: "users", label: "Leden", icon: Users, adminOnly: true, puzzleMasterOnly: false },
        { value: "lidgeld", label: "Lidgeld", icon: Euro, adminOnly: false, puzzleMasterOnly: false },
        { value: "tournaments", label: "Toernooien", icon: Trophy, adminOnly: true, puzzleMasterOnly: false },
        { value: "calendar", label: "Kalender", icon: CalendarDays, adminOnly: true, puzzleMasterOnly: false },
        { value: "puzzles", label: "Puzzels", icon: Puzzle, adminOnly: false, puzzleMasterOnly: true },
        { value: "sevilla", label: "Sevilla Import", icon: Upload, adminOnly: true, puzzleMasterOnly: false },
        { value: "settings", label: "Instellingen", icon: Palette, adminOnly: true, puzzleMasterOnly: false },
      ].filter((tab) => {
        // Admins beheren lidgeld onder Leden → geen aparte Lidgeld-tab
        if (tab.value === "lidgeld" && currentUser && isAdmin(currentUser)) {
          return false
        }
        // Bestuursleden zien alleen dashboard en lidgeld
        if (currentUser && isBoardMember(currentUser) && !isAdmin(currentUser)) {
          return !tab.adminOnly && !tab.puzzleMasterOnly
        }
        // Puzzle master only tabs
        if (tab.puzzleMasterOnly) {
          return Boolean(currentUser && (isAdmin(currentUser) || isPuzzleMaster(currentUser)))
        }
        // Admins zien alles
        return !tab.adminOnly || Boolean(currentUser && isAdmin(currentUser))
      }),
    [currentUser]
  )


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
  }, [tabs])

  // Admin heeft geen lidgeld-tab: oude #lidgeld-hash terug naar dashboard
  useEffect(() => {
    if (!currentUser || !isAdmin(currentUser)) return
    const available = tabs.map((t) => t.value)
    if (!available.includes(activeTab)) {
      setActiveTab("dashboard")
      window.location.hash = "dashboard"
    }
  }, [currentUser, activeTab, tabs])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    window.location.hash = tab
  }

  // Alleen navigeren als de gebruiker die tab ook echt in zijn menu heeft
  // (bv. bestuursleden hebben geen toegang tot Leden/Toernooien/Kalender).
  const goToTabIfAllowed = (tab: string) => {
    if (tabs.some((t) => t.value === tab)) {
      handleTabChange(tab)
    }
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
        <div className="bg-white rounded-lg shadow-md p-6 text-center max-w-sm">
          <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
            <Shield className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1.5">Toegang geweigerd</h2>
          <p className="text-gray-600 text-sm">Je hebt geen toegang tot het admin dashboard.</p>
        </div>
      </div>
    )
  }

  const currentTab = tabs.find((tab) => tab.value === activeTab)

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-mainAccent/10 p-2 rounded-lg">
              <Shield className="h-5 w-5 text-mainAccent" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-textColor">Admin Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600">Beheer alle aspecten van de schaakclub</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-2 mb-4">
            {/* Desktop Navigation */}
            <div className="hidden lg:block">
              <TabsList className="grid w-full gap-1.5 bg-transparent p-0" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex items-center justify-center gap-1.5 rounded-md data-[state=active]:bg-mainAccent data-[state=active]:text-white text-sm py-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden xl:inline">{tab.label}</span>
                      <span className="xl:hidden">{tab.label.split(' ')[0]}</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>

            {/* Mobile Navigation - Dropdown */}
            <div className="lg:hidden">
              <Select value={activeTab} onValueChange={handleTabChange}>
                <SelectTrigger className="w-full border-neutral-200 h-10">
                  <div className="flex items-center gap-2">
                    {currentTab && (
                      <>
                        <currentTab.icon className="h-4 w-4 text-mainAccent" />
                        <span className="font-medium text-sm">{currentTab.label}</span>
                      </>
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <SelectItem key={tab.value} value={tab.value}>
                        <div className="flex items-center gap-2">
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

          {/* Dashboard */}
          <TabsContent value="dashboard" className="mt-0">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-2.5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Welkom op het KSK Colle Dashboard
                </h2>
                <p className="text-xs text-white/80 mt-0.5">Selecteer een categorie om te beginnen met beheren</p>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Users Card */}
                  <button
                    type="button"
                    onClick={() => goToTabIfAllowed("users")}
                    className="group relative overflow-hidden rounded-lg border border-neutral-200 hover:border-mainAccent/30 transition-all duration-300 hover:shadow-md text-left"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative p-4 text-center">
                      <div className="inline-flex p-2.5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mb-2 group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-base font-semibold text-textColor mb-1 group-hover:text-mainAccent transition-colors">
                        Actieve Leden
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">Het aantal geregistreerde clubleden</p>
                      <p className="text-xl font-bold text-blue-800">{users.length}</p>
                    </div>
                  </button>

                  {/* Tournaments Card */}
                  <button
                    type="button"
                    onClick={() => goToTabIfAllowed("tournaments")}
                    className="group relative overflow-hidden rounded-lg border border-neutral-200 hover:border-mainAccent/30 transition-all duration-300 hover:shadow-md text-left"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative p-4 text-center">
                      <div className="inline-flex p-2.5 rounded-full bg-gradient-to-br from-green-500 to-green-600 mb-2 group-hover:scale-110 transition-transform duration-300">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-base font-semibold text-textColor mb-1 group-hover:text-mainAccent transition-colors">
                        Actieve Toernooien
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">Toernooien die nog niet afgerond zijn</p>
                      <p className="text-xl font-bold text-green-800">{activeTournaments.length}</p>
                    </div>
                  </button>

                  {/* Calendar Card */}
                  <button
                    type="button"
                    onClick={() => goToTabIfAllowed("calendar")}
                    className="group relative overflow-hidden rounded-lg border border-neutral-200 hover:border-mainAccent/30 transition-all duration-300 hover:shadow-md text-left md:col-span-2 lg:col-span-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative p-4 text-center">
                      <div className="inline-flex p-2.5 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 mb-2 group-hover:scale-110 transition-transform duration-300">
                        <CalendarDays className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-base font-semibold text-textColor mb-1 group-hover:text-mainAccent transition-colors">
                        Komende Evenementen
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">Activiteiten gepland na vandaag</p>
                      <p className="text-xl font-bold text-orange-800">
                        {upcomingEventsCount}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Andere tabs */}
          <TabsContent value="users" className="mt-0">
            <UsersManagement />
          </TabsContent>
          {currentUser && !isAdmin(currentUser) && (
            <TabsContent value="lidgeld" className="mt-0">
              <div className="bg-white rounded-lg shadow-md p-6 text-center max-w-sm mx-auto">
                <div className="bg-mainAccent/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <Euro className="h-6 w-6 text-mainAccent" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Lidgeld Beheer</h3>
                <p className="text-gray-600 text-sm mb-3">Beheer lidgeld en bondslidgeld betalingen</p>
                <Button asChild variant="accent" size="sm">
                  <Link href="/admin/lidgeld">Open Lidgeld Beheer</Link>
                </Button>
              </div>
            </TabsContent>
          )}
          <TabsContent value="tournaments" className="mt-0">
            <TournamentsManagement />
          </TabsContent>
          <TabsContent value="calendar" className="mt-0">
            <CalendarManagement />
          </TabsContent>
          <TabsContent value="puzzles" className="mt-0">
            <div className="bg-white rounded-lg shadow-md p-6 text-center max-w-sm mx-auto">
              <div className="bg-mainAccent/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <Puzzle className="h-6 w-6 text-mainAccent" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Puzzel Maker</h3>
              <p className="text-gray-600 text-sm mb-3">Maak nieuwe schaakpuzzels aan</p>
              <Button asChild variant="accent" size="sm">
                <Link href="/admin/puzzles">Open Puzzel Maker</Link>
              </Button>
            </div>
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

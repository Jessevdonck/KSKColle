'use client'

import { useEffect, useState } from "react"
import useSWR from 'swr'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UsersManagement from "../Users/UsersManagement"
import TournamentsManagement from "../Tournaments/TournamentsManagement"
import CalendarManagement from "../Calendar/CalendarManagement"
import { Users, Trophy, CalendarDays, Settings, BarChart3, Shield } from "lucide-react"
import { getAll } from '../../api/index'


const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isClient, setIsClient] = useState(false)

  // 1) Haal gebruikers op
  const { data: users = [] } = useSWR(
    'users',
    () => getAll('users')
  )
  // 2) Haal actieve toernooien op
  const { data: activeTournaments = [] } = useSWR(
    'tournament?active=true',
    () => getAll('tournament?active=true')
  )
  // 3) Haal alle calendar events op en filter toekomstige
  const { data: allEvents = [] } = useSWR(
    'calendarEvent',
    () => getAll('calendarEvent')
  )
  const upcomingCount = allEvents.filter(ev => {
    // ev.date is ISO-string
    return new Date(ev.date) >= new Date()
  }).length

  useEffect(() => {
    setIsClient(true)

    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (["dashboard", "users", "tournaments", "calendar"].includes(hash)) {
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
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 bg-neutral-100 p-2 rounded-lg">
                <TabsTrigger
                  value="dashboard"
                  className="flex items-center gap-2 data-[state=active]:bg-mainAccent data-[state=active]:text-white"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="flex items-center gap-2 data-[state=active]:bg-mainAccent data-[state=active]:text-white"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Leden</span>
                </TabsTrigger>
                <TabsTrigger
                  value="tournaments"
                  className="flex items-center gap-2 data-[state=active]:bg-mainAccent data-[state=active]:text-white"
                >
                  <Trophy className="h-4 w-4" />
                  <span className="hidden sm:inline">Toernooien</span>
                </TabsTrigger>
                <TabsTrigger
                  value="calendar"
                  className="flex items-center gap-2 data-[state=active]:bg-mainAccent data-[state=active]:text-white"
                >
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">Kalender</span>
                </TabsTrigger>
              </TabsList>
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
                      <p className="text-gray-600 leading-relaxed mb-4">
                        Het aantal geregistreerde clubleden
                      </p>
                      <p className="text-2xl font-bold text-blue-800 mb-4">
                        {users.length}
                      </p>
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
                      <p className="text-gray-600 leading-relaxed mb-4">
                        Toernooien die nog niet afgerond zijn
                      </p>
                      <p className="text-2xl font-bold text-green-800 mb-4">
                        {activeTournaments.length}
                      </p>
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
                      <p className="text-gray-600 leading-relaxed mb-4">
                        Activiteiten gepland na vandaag
                      </p>
                      <p className="text-2xl font-bold text-orange-800 mb-4">
                        {upcomingCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Andere tabs */}
          <TabsContent value="users" className="mt-0"><UsersManagement /></TabsContent>
          <TabsContent value="tournaments" className="mt-0"><TournamentsManagement /></TabsContent>
          <TabsContent value="calendar" className="mt-0"><CalendarManagement /></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AdminPage

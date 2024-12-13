'use client'

import React, { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Button } from "@/app/components/ui/button"
import UsersManagement from '../Users/UsersManagement'
import TournamentsManagement from '../Tournaments/TournamentsManagement'
import { Users, Trophy } from 'lucide-react'

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (['dashboard', 'users', 'tournaments'].includes(hash)) {
        setActiveTab(hash)
      }
    }

    handleHashChange() 
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    window.location.hash = tab
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-textColor">
      <header className="flex items-center justify-center bg-mainAccent text-white py-6 px-8 shadow-md">
        <h1 className="text-3xl font-bold">KSK Colle Admin Dashboard</h1>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex flex-col items-center">
          <TabsList className="mb-8 justify-start">
            <TabsTrigger 
              value="dashboard" 
              className="text-lg px-6 py-3"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="text-lg px-6 py-3"
            >
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="tournaments" 
              className="text-lg px-6 py-3"
            >
              Tournaments
            </TabsTrigger>
          </TabsList>
          <div className="w-full max-w-4xl"> 
            <TabsContent value="dashboard">
              <div className="bg-white rounded-lg shadow-md p-6 min-h-[300px] flex flex-col justify-center items-center">
                <h2 className="text-2xl font-semibold mb-4 text-mainAccent">Welkom op het KSK Colle dashboard</h2>
                <p className="text-gray-600 mb-8">Selecteer een tablad om te beginnen.</p>
                <div className="flex flex-wrap justify-center gap-4 w-full max-w-2xl">
                  <Button 
                    onClick={() => handleTabChange('users')} 
                    className="flex items-center justify-center gap-2 h-24 flex-1 min-w-[200px]"
                    variant="outline"
                  >
                    <Users className="h-6 w-6" />
                    <span>Gebruikers</span>
                  </Button>
                  <Button 
                    onClick={() => handleTabChange('tournaments')} 
                    className="flex items-center justify-center gap-2 h-24 flex-1 min-w-[200px]"
                    variant="outline"
                  >
                    <Trophy className="h-6 w-6" />
                    <span>Toernooien</span>
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="users">
              <div className="bg-white rounded-lg shadow-md p-6 min-h-[300px]">
                <UsersManagement />
              </div>
            </TabsContent>
            <TabsContent value="tournaments">
              <div className="bg-white rounded-lg shadow-md p-6 min-h-[300px]">
                <TournamentsManagement />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  )
}

export default AdminPage
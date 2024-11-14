'use client'

import React, { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UsersManagement from '../Users/UsersManagement'
import TournamentsManagement from '../Tournaments/TournamentsManagement'

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

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-textColor">
      <header className="flex items-center justify-center bg-mainAccent text-white py-6 px-8 shadow-md">
        <h1 className="text-3xl font-bold">KSK Colle Admin Dashboard</h1>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col items-center">
          <TabsList className="mb-8 justify-start">
            <TabsTrigger 
              value="dashboard" 
              onClick={() => window.location.hash = 'dashboard'}
              className="text-lg px-6 py-3"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              onClick={() => window.location.hash = 'users'}
              className="text-lg px-6 py-3"
            >
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="tournaments" 
              onClick={() => window.location.hash = 'tournaments'}
              className="text-lg px-6 py-3"
            >
              Tournaments
            </TabsTrigger>
          </TabsList>
          <div className="w-full max-w-4xl"> {/* Container for consistent width */}
            <TabsContent value="dashboard">
              <div className="bg-white rounded-lg shadow-md p-6 min-h-[300px] flex flex-col justify-center items-center">
                <h2 className="text-2xl font-semibold mb-4 text-mainAccent">Welkom op het KSK Colle dashboard</h2>
                <p className="text-gray-600">Selecteer een tablad om te beginnen.</p>
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
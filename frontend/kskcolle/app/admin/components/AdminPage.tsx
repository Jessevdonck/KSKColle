"use client"

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import UsersManagement from './UsersManagement'
import TournamentsManagement from './TournamentsManagement'
import Sidebar from './Sidebar'

const AdminPage = () => {
  return (
    <div className="flex h-screen bg-[#f7f7f7] text-[#292625]">
      <Sidebar />
      <div className="flex-1 p-10 overflow-auto">
        <h1 className="text-4xl font-extrabold mb-8 text-mainAccent">Admin Dashboard</h1>
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="users" className="text-lg">Users</TabsTrigger>
            <TabsTrigger value="tournaments" className="text-lg">Tournaments</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>
          <TabsContent value="tournaments">
            <TournamentsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AdminPage
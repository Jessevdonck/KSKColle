"use client"

import { useState } from 'react'
import useSWR from 'swr'
import { getLidgeldStatus, updateLidgeldStatus } from '../../api'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Euro, Filter, Search } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

interface LidgeldUser {
  user_id: number
  voornaam: string
  achternaam: string
  email: string
  tel_nummer: string
  is_youth: boolean
  lidgeld_betaald: boolean
  lidgeld_periode_start?: string | null
  lidgeld_periode_eind?: string | null
  bondslidgeld_betaald: boolean
  bondslidgeld_periode_start?: string | null
  bondslidgeld_periode_eind?: string | null
  jeugdlidgeld_betaald: boolean
  jeugdlidgeld_periode_start?: string | null
  jeugdlidgeld_periode_eind?: string | null
  roles: string[]
}

export default function LidgeldManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid' | 'expired'>('all')
  const [editingUser, setEditingUser] = useState<LidgeldUser | null>(null)

  const { data: users = [], error, mutate } = useSWR('lidgeld-status', getLidgeldStatus)

  const filteredUsers = users.filter((user: LidgeldUser) => {
    const matchesSearch = 
      user.voornaam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.achternaam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

    if (!matchesSearch) return false

    const now = new Date()
    const lidgeldValid = user.lidgeld_betaald && 
      user.lidgeld_periode_eind && 
      new Date(user.lidgeld_periode_eind) > now
    const bondslidgeldValid = user.bondslidgeld_betaald && 
      user.bondslidgeld_periode_eind && 
      new Date(user.bondslidgeld_periode_eind) > now
    const isMember = lidgeldValid || bondslidgeldValid

    switch (filterStatus) {
      case 'paid':
        return isMember
      case 'unpaid':
        return !isMember
      case 'expired':
        return (user.lidgeld_betaald || user.bondslidgeld_betaald) && !isMember
      default:
        return true
    }
  })

  const getMembershipStatus = (user: LidgeldUser) => {
    const now = new Date()
    const lidgeldValid = user.lidgeld_betaald && 
      user.lidgeld_periode_eind && 
      new Date(user.lidgeld_periode_eind) > now
    const bondslidgeldValid = user.bondslidgeld_betaald && 
      user.bondslidgeld_periode_eind && 
      new Date(user.bondslidgeld_periode_eind) > now
    const jeugdlidgeldValid = user.jeugdlidgeld_betaald && 
      user.jeugdlidgeld_periode_eind && 
      new Date(user.jeugdlidgeld_periode_eind) > now
    const isMember = lidgeldValid || bondslidgeldValid || jeugdlidgeldValid

    const expiresAt = [user.lidgeld_periode_eind, user.bondslidgeld_periode_eind, user.jeugdlidgeld_periode_eind]
      .filter(Boolean)
      .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0]

    return {
      isMember,
      lidgeldValid,
      bondslidgeldValid,
      jeugdlidgeldValid,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    }
  }

  const handleUpdateLidgeld = async (userId: number, data: any) => {
    try {
      await updateLidgeldStatus(userId, data)
      mutate()
      setEditingUser(null)
    } catch (error) {
      console.error('Failed to update lidgeld status:', error)
    }
  }

  const getStatusColor = (user: LidgeldUser) => {
    const status = getMembershipStatus(user)
    if (status.isMember) return 'bg-green-100 text-green-800'
    if (user.lidgeld_betaald || user.bondslidgeld_betaald) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (user: LidgeldUser) => {
    const status = getMembershipStatus(user)
    if (status.isMember) return 'Lid'
    if (user.lidgeld_betaald || user.bondslidgeld_betaald) return 'Verlopen'
    return 'Geen lid'
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Fout bij laden</h2>
          <p className="text-gray-600">De lidgeld gegevens konden niet worden geladen.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-neutral-200 rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-mainAccent/10 p-2 rounded-lg">
                  <Euro className="h-6 w-6 text-mainAccent" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-textColor">Lidgeld Beheer</h1>
                  <p className="text-gray-600">Beheer lidgeld en bondslidgeld betalingen</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                Zoeken
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Zoek op naam of email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="filter" className="text-sm font-medium text-gray-700 mb-2 block">
                Filter
              </Label>
              <select
                id="filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mainAccent"
              >
                <option value="all">Alle leden</option>
                <option value="paid">Lidgeld betaald</option>
                <option value="unpaid">Geen lidgeld</option>
                <option value="expired">Verlopen</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="grid gap-4">
          {filteredUsers.map((user: LidgeldUser) => {
            const status = getMembershipStatus(user)
            return (
              <Card key={user.user_id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-mainAccent/10 rounded-full flex items-center justify-center">
                        <span className="text-mainAccent font-semibold text-sm">
                          {user.voornaam[0]}{user.achternaam[0]}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{user.voornaam} {user.achternaam}</CardTitle>
                        <p className="text-sm text-gray-600">{user.email || 'Geen email'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(user)}>
                        {getStatusText(user)}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingUser(user)}
                      >
                        Bewerken
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className={`grid gap-4 ${user.is_youth ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Lidgeld</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={user.lidgeld_betaald} disabled />
                          <span>Betaald</span>
                        </div>
                        {user.lidgeld_periode_start && (
                          <p className="text-gray-600">
                            Van: {format(new Date(user.lidgeld_periode_start), 'dd MMM yyyy', { locale: nl })}
                          </p>
                        )}
                        {user.lidgeld_periode_eind && (
                          <p className="text-gray-600">
                            Tot: {format(new Date(user.lidgeld_periode_eind), 'dd MMM yyyy', { locale: nl })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Bondslidgeld</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={user.bondslidgeld_betaald} disabled />
                          <span>Betaald</span>
                        </div>
                        {user.bondslidgeld_periode_start && (
                          <p className="text-gray-600">
                            Van: {format(new Date(user.bondslidgeld_periode_start), 'dd MMM yyyy', { locale: nl })}
                          </p>
                        )}
                        {user.bondslidgeld_periode_eind && (
                          <p className="text-gray-600">
                            Tot: {format(new Date(user.bondslidgeld_periode_eind), 'dd MMM yyyy', { locale: nl })}
                          </p>
                        )}
                      </div>
                    </div>
                    {user.is_youth && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Jeugdlidgeld</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Checkbox checked={user.jeugdlidgeld_betaald} disabled />
                            <span>Betaald</span>
                          </div>
                          {user.jeugdlidgeld_periode_start && (
                            <p className="text-gray-600">
                              Van: {format(new Date(user.jeugdlidgeld_periode_start), 'dd MMM yyyy', { locale: nl })}
                            </p>
                          )}
                          {user.jeugdlidgeld_periode_eind && (
                            <p className="text-gray-600">
                              Tot: {format(new Date(user.jeugdlidgeld_periode_eind), 'dd MMM yyyy', { locale: nl })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen leden gevonden</h3>
            <p className="text-gray-600">Probeer een andere zoekterm of filter.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <LidgeldEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleUpdateLidgeld}
        />
      )}
    </div>
  )
}

// Edit Modal Component
function LidgeldEditModal({ user, onClose, onSave }: {
  user: LidgeldUser
  onClose: () => void
  onSave: (userId: number, data: any) => void
}) {
  const [formData, setFormData] = useState({
    lidgeld_betaald: user.lidgeld_betaald,
    lidgeld_periode_start: user.lidgeld_periode_start ? format(new Date(user.lidgeld_periode_start), 'yyyy-MM-dd') : '',
    lidgeld_periode_eind: user.lidgeld_periode_eind ? format(new Date(user.lidgeld_periode_eind), 'yyyy-MM-dd') : '',
    bondslidgeld_betaald: user.bondslidgeld_betaald,
    bondslidgeld_periode_start: user.bondslidgeld_periode_start ? format(new Date(user.bondslidgeld_periode_start), 'yyyy-MM-dd') : '',
    bondslidgeld_periode_eind: user.bondslidgeld_periode_eind ? format(new Date(user.bondslidgeld_periode_eind), 'yyyy-MM-dd') : '',
    jeugdlidgeld_betaald: user.jeugdlidgeld_betaald,
    jeugdlidgeld_periode_start: user.jeugdlidgeld_periode_start ? format(new Date(user.jeugdlidgeld_periode_start), 'yyyy-MM-dd') : '',
    jeugdlidgeld_periode_eind: user.jeugdlidgeld_periode_eind ? format(new Date(user.jeugdlidgeld_periode_eind), 'yyyy-MM-dd') : '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() // 0-indexed, so August is 7
    const currentDay = today.getDate()
    
    // If we're past August 31st this year, use next year's August 31st
    const yearForAugust31 = (currentMonth > 7 || (currentMonth === 7 && currentDay > 31)) 
      ? currentYear + 1 
      : currentYear
    
    const august31 = new Date(yearForAugust31, 7, 31) // August 31st (month is 0-indexed)
    
    const data = {
      ...formData,
      // Use the form data for dates, only set to today if no date is provided and paid
      lidgeld_periode_start: formData.lidgeld_periode_start ? new Date(formData.lidgeld_periode_start).toISOString() : (formData.lidgeld_betaald ? today.toISOString() : null),
      lidgeld_periode_eind: formData.lidgeld_periode_eind ? new Date(formData.lidgeld_periode_eind).toISOString() : (formData.lidgeld_betaald ? august31.toISOString() : null),
      bondslidgeld_periode_start: formData.bondslidgeld_periode_start ? new Date(formData.bondslidgeld_periode_start).toISOString() : (formData.bondslidgeld_betaald ? today.toISOString() : null),
      bondslidgeld_periode_eind: formData.bondslidgeld_periode_eind ? new Date(formData.bondslidgeld_periode_eind).toISOString() : (formData.bondslidgeld_betaald ? august31.toISOString() : null),
      jeugdlidgeld_periode_start: formData.jeugdlidgeld_periode_start ? new Date(formData.jeugdlidgeld_periode_start).toISOString() : (formData.jeugdlidgeld_betaald ? today.toISOString() : null),
      jeugdlidgeld_periode_eind: formData.jeugdlidgeld_periode_eind ? new Date(formData.jeugdlidgeld_periode_eind).toISOString() : (formData.jeugdlidgeld_betaald ? august31.toISOString() : null),
    }
    onSave(user.user_id, data)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Lidgeld bewerken - {user.voornaam} {user.achternaam}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={`grid gap-6 ${user.is_youth ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
              {/* Lidgeld */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Lidgeld</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lidgeld_betaald"
                    checked={formData.lidgeld_betaald}
                    onCheckedChange={(checked) => {
                      const today = new Date()
                      const currentYear = today.getFullYear()
                      const currentMonth = today.getMonth() // 0-indexed, so August is 7
                      const currentDay = today.getDate()
                      
                      // If we're past August 31st this year, use next year's August 31st
                      const yearForAugust31 = (currentMonth > 7 || (currentMonth === 7 && currentDay > 31)) 
                        ? currentYear + 1 
                        : currentYear
                      
                      const august31 = new Date(yearForAugust31, 7, 31)
                      setFormData(prev => ({ 
                        ...prev, 
                        lidgeld_betaald: !!checked,
                        // Only set dates if they're not already filled in
                        lidgeld_periode_start: checked && !prev.lidgeld_periode_start ? format(today, 'yyyy-MM-dd') : prev.lidgeld_periode_start,
                        lidgeld_periode_eind: checked && !prev.lidgeld_periode_eind ? format(august31, 'yyyy-MM-dd') : prev.lidgeld_periode_eind
                      }))
                    }}
                  />
                  <Label htmlFor="lidgeld_betaald">Betaald</Label>
                </div>
                <div>
                  <Label htmlFor="lidgeld_start" className="text-sm font-medium text-gray-700">Start datum</Label>
                  <Input
                    id="lidgeld_start"
                    type="date"
                    value={formData.lidgeld_periode_start}
                    onChange={(e) => setFormData(prev => ({ ...prev, lidgeld_periode_start: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="lidgeld_eind" className="text-sm font-medium text-gray-700">Eind datum</Label>
                  <Input
                    id="lidgeld_eind"
                    type="date"
                    value={formData.lidgeld_periode_eind}
                    onChange={(e) => setFormData(prev => ({ ...prev, lidgeld_periode_eind: e.target.value }))}
                  />
                </div>
              </div>

              {/* Bondslidgeld */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Bondslidgeld</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bondslidgeld_betaald"
                    checked={formData.bondslidgeld_betaald}
                    onCheckedChange={(checked) => {
                      const today = new Date()
                      const currentYear = today.getFullYear()
                      const currentMonth = today.getMonth() // 0-indexed, so August is 7
                      const currentDay = today.getDate()
                      
                      // If we're past August 31st this year, use next year's August 31st
                      const yearForAugust31 = (currentMonth > 7 || (currentMonth === 7 && currentDay > 31)) 
                        ? currentYear + 1 
                        : currentYear
                      
                      const august31 = new Date(yearForAugust31, 7, 31)
                      setFormData(prev => ({ 
                        ...prev, 
                        bondslidgeld_betaald: !!checked,
                        // Only set dates if they're not already filled in
                        bondslidgeld_periode_start: checked && !prev.bondslidgeld_periode_start ? format(today, 'yyyy-MM-dd') : prev.bondslidgeld_periode_start,
                        bondslidgeld_periode_eind: checked && !prev.bondslidgeld_periode_eind ? format(august31, 'yyyy-MM-dd') : prev.bondslidgeld_periode_eind
                      }))
                    }}
                  />
                  <Label htmlFor="bondslidgeld_betaald">Betaald</Label>
                </div>
                <div>
                  <Label htmlFor="bondslidgeld_start" className="text-sm font-medium text-gray-700">Start datum</Label>
                  <Input
                    id="bondslidgeld_start"
                    type="date"
                    value={formData.bondslidgeld_periode_start}
                    onChange={(e) => setFormData(prev => ({ ...prev, bondslidgeld_periode_start: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="bondslidgeld_eind" className="text-sm font-medium text-gray-700">Eind datum</Label>
                  <Input
                    id="bondslidgeld_eind"
                    type="date"
                    value={formData.bondslidgeld_periode_eind}
                    onChange={(e) => setFormData(prev => ({ ...prev, bondslidgeld_periode_eind: e.target.value }))}
                  />
                </div>
              </div>

              {/* Jeugdlidgeld - alleen voor jeugdleden */}
              {user.is_youth && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Jeugdlidgeld</h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="jeugdlidgeld_betaald"
                      checked={formData.jeugdlidgeld_betaald}
                      onCheckedChange={(checked) => {
                        const today = new Date()
                        const currentYear = today.getFullYear()
                        const currentMonth = today.getMonth() // 0-indexed, so August is 7
                        const currentDay = today.getDate()
                        
                        // If we're past August 31st this year, use next year's August 31st
                        const yearForAugust31 = (currentMonth > 7 || (currentMonth === 7 && currentDay > 31)) 
                          ? currentYear + 1 
                          : currentYear
                        
                        const august31 = new Date(yearForAugust31, 7, 31)
                        setFormData(prev => ({ 
                          ...prev, 
                          jeugdlidgeld_betaald: !!checked,
                          // Only set dates if they're not already filled in
                          jeugdlidgeld_periode_start: checked && !prev.jeugdlidgeld_periode_start ? format(today, 'yyyy-MM-dd') : prev.jeugdlidgeld_periode_start,
                          jeugdlidgeld_periode_eind: checked && !prev.jeugdlidgeld_periode_eind ? format(august31, 'yyyy-MM-dd') : prev.jeugdlidgeld_periode_eind
                        }))
                      }}
                    />
                    <Label htmlFor="jeugdlidgeld_betaald">Betaald</Label>
                  </div>
                  <div>
                    <Label htmlFor="jeugdlidgeld_start" className="text-sm font-medium text-gray-700">Start datum</Label>
                    <Input
                      id="jeugdlidgeld_start"
                      type="date"
                      value={formData.jeugdlidgeld_periode_start}
                      onChange={(e) => setFormData(prev => ({ ...prev, jeugdlidgeld_periode_start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="jeugdlidgeld_eind" className="text-sm font-medium text-gray-700">Eind datum</Label>
                    <Input
                      id="jeugdlidgeld_eind"
                      type="date"
                      value={formData.jeugdlidgeld_periode_eind}
                      onChange={(e) => setFormData(prev => ({ ...prev, jeugdlidgeld_periode_eind: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuleren
              </Button>
              <Button type="submit">
                Opslaan
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

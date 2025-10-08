"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { User } from "@/data/types"
import EditForm from "./components/forms/EditForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, Edit, Trash2, Mail, Trophy, Calendar, UserIcon, Search, Euro, CheckCircle, XCircle, Clock, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { getAll } from "../../api/index"

const createUrlFriendlyName = (voornaam: string, achternaam: string) => {
  return `${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, "_")
}

// Helper function to determine membership status
const getMembershipStatus = (user: User) => {
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

// Helper function to get status color and text
const getStatusInfo = (user: User) => {
  const status = getMembershipStatus(user)
  if (status.isMember) {
    return {
      color: 'bg-green-100 text-green-800',
      text: 'Lid',
      icon: CheckCircle
    }
  }
  if (user.lidgeld_betaald || user.bondslidgeld_betaald || user.jeugdlidgeld_betaald) {
    return {
      color: 'bg-red-100 text-red-800',
      text: 'Verlopen',
      icon: XCircle
    }
  }
  return {
    color: 'bg-gray-100 text-gray-800',
    text: 'Ex-Lid',
    icon: Clock
  }
}

type UserListProps = {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (userId: number) => Promise<void>
  isDeleting?: boolean
  onRefresh?: (updatedUser?: User) => void
  onUserDeleted?: (userId: number) => void
  pagination?: {
    currentPage: number
    totalPages: number
    total: number
    onPageChange: (page: number) => void
  }
}

export default function UserList({ users, onDelete, isDeleting = false, pagination, onRefresh, onUserDeleted }: UserListProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [isLoadingAllUsers, setIsLoadingAllUsers] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>("all")

  // Fetch all users when searching or filtering
  const fetchAllUsers = async () => {
    if (allUsers.length === 0 && !isLoadingAllUsers) {
      setIsLoadingAllUsers(true)
      try {
        const allUsersData = await getAll("users")
        setAllUsers(allUsersData)
      } catch (error) {
        console.error("Error fetching all users:", error)
      } finally {
        setIsLoadingAllUsers(false)
      }
    }
  }

  // Handler voor bevestiging bij verwijderen
  const handleDelete = async (userId: number) => {
    const confirmed = window.confirm("Weet je zeker dat je deze speler wilt verwijderen?")
    if (!confirmed) return
    
    try {
      await onDelete(userId)
      // Update allUsers state if user was deleted
      setAllUsers(prevUsers => prevUsers.filter(user => user.user_id !== userId))
      // Notify parent component
      onUserDeleted?.(userId)
    } catch (error) {
      // Error handling is done in the parent component
    }
  }

  // Handler voor user updates
  const handleUserUpdated = (updatedUser?: any) => {
    // Update allUsers cache if it exists and user was updated
    if (updatedUser && allUsers.length > 0) {
      setAllUsers(prevUsers => 
        prevUsers.map(user => 
          user.user_id === updatedUser.user_id ? updatedUser : user
        )
      )
    }
    // Also call parent refresh
    onRefresh?.(updatedUser)
  }

  // Filter gebruikers op zoekterm en user type
  const filteredUsers = React.useMemo(() => {
    // Use allUsers if search or filter is active, otherwise use paginated users
    let result = (searchTerm || selectedFilter !== "all") && allUsers.length > 0 ? allUsers : users
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter((user) => (
        `${user.voornaam} ${user.achternaam}`.toLowerCase().includes(searchLower) ||
        (user.email?.toLowerCase().includes(searchLower) ?? false) ||
        (user.fide_id?.toString().includes(searchLower) ?? false) ||
        user.schaakrating_elo.toString().includes(searchLower)
      ))
    }
    
    // Apply role/type filter
    if (selectedFilter !== "all") {
      result = result.filter((user) => {
        // Parse roles consistently
        let userRoles: string[] = []
        if (typeof user.roles === 'string') {
          try {
            userRoles = JSON.parse(user.roles)
          } catch (e) {
            userRoles = []
          }
        } else if (Array.isArray(user.roles)) {
          userRoles = user.roles
        }
        
        switch (selectedFilter) {
          case "admin":
            return userRoles.includes("admin")
          case "bestuurslid":
            return userRoles.includes("bestuurslid")
          case "youth":
            return user.is_youth === true
          case "exlid":
            return userRoles.includes("exlid")
          case "user":
            return userRoles.includes("user") && !userRoles.includes("admin") && !userRoles.includes("bestuurslid") && !userRoles.includes("exlid") && !user.is_youth
          default:
            return true
        }
      })
    }
    
    return result
  }, [searchTerm, allUsers, users, selectedFilter])

  // Count users by category
  const userCounts = React.useMemo(() => {
    const dataSource = allUsers.length > 0 ? allUsers : users
    const counts = {
      all: dataSource.length,
      admin: 0,
      bestuurslid: 0,
      youth: 0,
      user: 0,
      exlid: 0,
    }
    
    dataSource.forEach((user) => {
      // Parse roles if it's a string, otherwise use as is
      let userRoles: string[] = []
      if (typeof user.roles === 'string') {
        try {
          userRoles = JSON.parse(user.roles)
        } catch (e) {
          userRoles = []
        }
      } else if (Array.isArray(user.roles)) {
        userRoles = user.roles
      }
      
      if (userRoles.includes("admin")) counts.admin++
      if (userRoles.includes("bestuurslid")) counts.bestuurslid++
      if (user.is_youth === true) counts.youth++
      if (userRoles.includes("exlid")) counts.exlid++
      if (userRoles.includes("user") && !userRoles.includes("admin") && !userRoles.includes("bestuurslid") && !userRoles.includes("exlid") && !user.is_youth) {
        counts.user++
      }
    })
    
    return counts
  }, [users, allUsers])

  // Load all users on mount for counting purposes and filtering
  useEffect(() => {
    fetchAllUsers()
  }, []) // Empty dependency array is correct here

  // Fetch all users when search term or filter changes
  useEffect(() => {
    if (searchTerm || selectedFilter !== "all") {
      fetchAllUsers()
    }
  }, [searchTerm, selectedFilter]) // Dependencies are correct here

  if (!users.length) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Spelers Overzicht
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="bg-mainAccent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Users className="h-8 w-8 text-mainAccent" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Geen spelers gevonden</h3>
          <p className="text-gray-600 text-sm">Voeg een nieuwe speler toe om te beginnen.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Spelers Overzicht
          </h2>
          <p className="text-white/80 mt-1 text-sm">
            {pagination ? `${users.length} van ${pagination.total} spelers` : `${users.length} spelers geregistreerd`}
          </p>
        </div>

        <div className="p-4">
          {/* Search Bar and Filters */}
          <div className="mb-4 space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
              <Input
                type="text"
                placeholder="Zoek spelers op naam, email, FIDE ID of rating..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 text-sm"
              />
            </div>

            {/* Filter Badges */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-medium text-gray-600">Filter:</span>
              <button
                onClick={() => {
                  setSelectedFilter("all")
                  pagination.onPageChange(1)
                }}
                disabled={isLoadingAllUsers}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedFilter === "all"
                    ? "bg-mainAccent text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } ${isLoadingAllUsers ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Alle ({userCounts.all})
              </button>
              <button
                onClick={() => {
                  setSelectedFilter("admin")
                  pagination.onPageChange(1)
                }}
                disabled={isLoadingAllUsers}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedFilter === "admin"
                    ? "bg-red-500 text-white"
                    : "bg-red-50 text-red-600 hover:bg-red-100"
                } ${isLoadingAllUsers ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Shield className="inline h-3 w-3 mr-1" />
                Admin ({userCounts.admin})
              </button>
              <button
                onClick={() => {
                  setSelectedFilter("bestuurslid")
                  pagination.onPageChange(1)
                }}
                disabled={isLoadingAllUsers}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedFilter === "bestuurslid"
                    ? "bg-purple-500 text-white"
                    : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                } ${isLoadingAllUsers ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Bestuurslid ({userCounts.bestuurslid})
              </button>
              <button
                onClick={() => {
                  setSelectedFilter("youth")
                  pagination.onPageChange(1)
                }}
                disabled={isLoadingAllUsers}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedFilter === "youth"
                    ? "bg-blue-500 text-white"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                } ${isLoadingAllUsers ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Jeugd ({userCounts.youth})
              </button>
              <button
                onClick={() => {
                  setSelectedFilter("user")
                  pagination.onPageChange(1)
                }}
                disabled={isLoadingAllUsers}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedFilter === "user"
                    ? "bg-green-500 text-white"
                    : "bg-green-50 text-green-600 hover:bg-green-100"
                } ${isLoadingAllUsers ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Leden ({userCounts.user})
              </button>
              <button
                onClick={() => {
                  setSelectedFilter("exlid")
                  pagination.onPageChange(1)
                }}
                disabled={isLoadingAllUsers}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedFilter === "exlid"
                    ? "bg-gray-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } ${isLoadingAllUsers ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Clock className="inline h-3 w-3 mr-1" />
                Ex-Lid ({userCounts.exlid})
              </button>
            </div>

            {/* Results counter */}
            {(searchTerm || selectedFilter !== "all") && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                {isLoadingAllUsers ? (
                  <p className="flex items-center gap-2">
                    <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-mainAccent"></span>
                    Laden van alle spelers...
                  </p>
                ) : (
                  <>
                    <p>
                      <span className="font-semibold">{filteredUsers.length}</span> 
                      {searchTerm && ` van ${allUsers.length || users.length}`} spelers 
                      {selectedFilter !== "all" && ` (gefilterd op ${
                        selectedFilter === "admin" ? "Admin" :
                        selectedFilter === "bestuurslid" ? "Bestuurslid" :
                        selectedFilter === "youth" ? "Jeugd" :
                        selectedFilter === "user" ? "Leden" :
                        "Ex-Lid"
                      })`}
                    </p>
                    {(searchTerm || selectedFilter !== "all") && (
                      <button
                        onClick={() => {
                          setSearchTerm("")
                          setSelectedFilter("all")
                        }}
                        className="text-mainAccent hover:text-mainAccentDark underline"
                      >
                        Reset filters
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-mainAccent/10 to-mainAccentDark/10 border-b border-neutral-200">
                  <th className="p-3 text-left font-semibold text-textColor text-sm">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-3 w-3" />
                      Naam
                    </div>
                  </th>
                  <th className="p-3 text-left font-semibold text-textColor text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Geboortedatum
                    </div>
                  </th>
                  <th className="p-3 text-left font-semibold text-textColor text-sm">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-3 w-3" />
                      ELO Rating
                    </div>
                  </th>
                  <th className="p-3 text-left font-semibold text-textColor text-sm">FIDE ID</th>
                  <th className="p-3 text-center font-semibold text-textColor text-sm">
                    <div className="flex items-center gap-2">
                      <Euro className="h-3 w-3" />
                      Lidgeld
                    </div>
                  </th>
                  <th className="p-3 text-center font-semibold text-textColor text-sm">Status</th>
                  <th className="p-3 text-center font-semibold text-textColor text-sm">Acties</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.user_id}
                    className={`border-b border-neutral-100 transition-all hover:bg-mainAccent/5 ${
                      index % 2 === 0 ? "bg-white" : "bg-neutral-50/50"
                    }`}
                  >
                    <td className="p-3">
                      <Link
                        href={`/profile/${createUrlFriendlyName(user.voornaam, user.achternaam)}`}
                        className="group flex items-center gap-2 hover:text-mainAccent transition-colors"
                      >
                        <div className="w-8 h-8 bg-mainAccent/10 rounded-full flex items-center justify-center group-hover:bg-mainAccent/20 transition-colors">
                          <UserIcon className="h-4 w-4 text-mainAccent" />
                        </div>
                        <span className="font-medium text-sm group-hover:text-mainAccent transition-colors">{`${user.voornaam} ${user.achternaam}`}</span>
                      </Link>
                    </td>
                    <td className="p-3 text-sm">{user.geboortedatum ? new Date(user.geboortedatum).toLocaleDateString("nl-NL") : '-'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-3 w-3 text-mainAccent" />
                        <span className="font-semibold text-textColor text-sm">{user.schaakrating_elo}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{user.fide_id ?? "N/A"}</td>
                    <td className="p-3 text-center">
                      {(() => {
                        const statusInfo = getStatusInfo(user)
                        const StatusIcon = statusInfo.icon
                        return (
                          <Badge className={`${statusInfo.color} flex items-center gap-1 w-fit mx-auto`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.text}
                          </Badge>
                        )
                      })()}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-1">
                        {user.is_admin && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200">
                            Admin
                          </span>
                        )}
                        {user.is_youth && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200">
                            Jeugd
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          size="sm"
                          className="bg-mainAccent hover:bg-mainAccentDark h-7 w-7 p-0"
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-7 w-7 p-0 bg-transparent"
                          onClick={() => handleDelete(user.user_id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.user_id}
                className="border border-neutral-200 rounded-lg p-3 hover:border-mainAccent/30 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-mainAccent/10 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-mainAccent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-textColor text-sm">{`${user.voornaam} ${user.achternaam}`}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Mail className="h-3 w-3" />
                        <span>{user.email || 'Geen email'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {user.is_admin && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200">
                        Admin
                      </span>
                    )}
                    {user.is_youth && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200">
                        Jeugd
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  <div>
                    <div className="flex items-center gap-1 text-gray-500 mb-1">
                      <Trophy className="h-3 w-3" />
                      <span>ELIO Rating</span>
                    </div>
                    <div className="font-semibold text-textColor text-sm">{user.schaakrating_elo}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-gray-500 mb-1">
                      <Euro className="h-3 w-3" />
                      <span>Lidgeld</span>
                    </div>
                    <div className="text-sm">
                      {(() => {
                        const statusInfo = getStatusInfo(user)
                        const StatusIcon = statusInfo.icon
                        return (
                          <Badge className={`${statusInfo.color} flex items-center gap-1 w-fit`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.text}
                          </Badge>
                        )
                      })()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-mainAccent hover:bg-mainAccentDark text-sm"
                    onClick={() => setEditingUser(user)}
                  >
                    <Edit className="h-3 w-3 mr-2" />
                    Bewerken
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 text-sm bg-transparent"
                    onClick={() => handleDelete(user.user_id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination - only show when not searching */}
      {pagination && pagination.totalPages > 1 && !searchTerm && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Pagina {pagination.currentPage} van {pagination.totalPages} 
              ({pagination.total} totaal spelers)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                Vorige
              </Button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(
                  pagination.totalPages - 4 + i,
                  Math.max(1, pagination.currentPage - 2 + i)
                ))
                
                if (i > 0 && pageNum !== Math.max(1, Math.min(
                  pagination.totalPages - 4 + i - 1,
                  Math.max(1, pagination.currentPage - 2 + i - 1)
                )) + 1) {
                  return null
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => pagination.onPageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Volgende
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Edit className="h-4 w-4 text-mainAccent" />
              Speler Bewerken
            </DialogTitle>
          </DialogHeader>
          {editingUser && <EditForm user={editingUser} onClose={() => setEditingUser(null)} onRefresh={handleUserUpdated} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

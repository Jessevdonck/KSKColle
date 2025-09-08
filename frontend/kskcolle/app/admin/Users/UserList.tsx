"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { User } from "@/data/types"
import EditForm from "./components/forms/EditForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, Edit, Trash2, Mail, Trophy, Calendar, UserIcon, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

type UserListProps = {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (userId: number) => Promise<void>
  isDeleting?: boolean
  onRefresh?: () => void
}

export default function UserList({ users, onDelete, isDeleting = false }: UserListProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Handler voor bevestiging bij verwijderen
  const handleDelete = async (userId: number) => {
    const confirmed = window.confirm("Weet je zeker dat je deze speler wilt verwijderen?")
    if (!confirmed) return
    await onDelete(userId)
  }

  // Filter gebruikers op zoekterm
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      `${user.voornaam} ${user.achternaam}`.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.fide_id?.toString().includes(searchLower) ?? false) ||
      user.schaakrating_elo.toString().includes(searchLower)
    )
  })

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
          <p className="text-white/80 mt-1 text-sm">{users.length} spelers geregistreerd</p>
        </div>

        <div className="p-4">
          {/* Search Bar */}
          <div className="mb-4">
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
            {searchTerm && (
              <p className="text-xs text-gray-600 mt-2">
                {filteredUsers.length} van {users.length} spelers gevonden
              </p>
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
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-mainAccent/10 rounded-full flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-mainAccent" />
                        </div>
                        <span className="font-medium text-sm">{`${user.voornaam} ${user.achternaam}`}</span>
                      </div>
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
                        <span>{user.email}</span>
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
                      <span>ELO Rating</span>
                    </div>
                    <div className="font-semibold text-textColor text-sm">{user.schaakrating_elo}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-gray-500 mb-1">
                      <Calendar className="h-3 w-3" />
                      <span>Geboortedatum</span>
                    </div>
                    <div className="text-gray-700 text-sm">
                      {user.geboortedatum ? new Date(user.geboortedatum).toLocaleDateString("nl-NL") : '-'}
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

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Edit className="h-4 w-4 text-mainAccent" />
              Speler Bewerken
            </DialogTitle>
          </DialogHeader>
          {editingUser && <EditForm user={editingUser} onClose={() => setEditingUser(null)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

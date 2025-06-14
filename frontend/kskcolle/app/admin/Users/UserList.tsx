"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { User } from "@/data/types"
import EditForm from "./components/forms/EditForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, Edit, Trash2, Mail, Trophy, Calendar, Shield, UserIcon, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

type UserListProps = {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (userId: number) => Promise<void>
  isDeleting?: boolean
}

export default function UserList({ users, onDelete, isDeleting = false }: UserListProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      `${user.voornaam} ${user.achternaam}`.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.fide_id && user.fide_id.toString().includes(searchLower)) ||
      user.schaakrating_elo.toString().includes(searchLower)
    )
  })

  if (!users || users.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6" />
            Spelers Overzicht
          </h2>
        </div>
        <div className="p-12 text-center">
          <div className="bg-mainAccent/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Users className="h-10 w-10 text-mainAccent" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Geen spelers gevonden</h3>
          <p className="text-gray-600">Voeg een nieuwe speler toe om te beginnen.</p>
        </div>
      </div>
    )
  }

  if (filteredUsers.length === 0 && searchTerm) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6" />
            Spelers Overzicht
          </h2>
          <p className="text-white/80 mt-1">{users.length} spelers geregistreerd</p>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Zoek spelers op naam, email, FIDE ID of rating..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          </div>
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Search className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">Geen resultaten gevonden</h3>
            <p className="text-gray-600">Probeer een andere zoekterm of wis de zoekopdracht.</p>
            <Button onClick={() => setSearchTerm("")} variant="outline" className="mt-4">
              Wis zoekopdracht
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6" />
            Spelers Overzicht
          </h2>
          <p className="text-white/80 mt-1">{users.length} spelers geregistreerd</p>
        </div>

        <div className="p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Zoek spelers op naam, email, FIDE ID of rating..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-600 mt-2">
                {filteredUsers.length} van {users.length} spelers gevonden
              </p>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-mainAccent/10 to-mainAccentDark/10 border-b border-neutral-200">
                  <th className="p-4 text-left font-semibold text-textColor">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Naam
                    </div>
                  </th>
                  <th className="p-4 text-left font-semibold text-textColor">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Geboortedatum
                    </div>
                  </th>
                  <th className="p-4 text-left font-semibold text-textColor">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      ELO Rating
                    </div>
                  </th>
                  <th className="p-4 text-left font-semibold text-textColor">FIDE ID</th>
                  
                  <th className="p-4 text-center font-semibold text-textColor">Acties</th>
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
                    <td className="p-4">
                      <Button
                        variant="link"
                        onClick={() => setEditingUser(user)}
                        className="p-0 h-auto font-normal text-left justify-start hover:text-mainAccent"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-mainAccent/10 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-mainAccent" />
                          </div>
                          <span data-cy="name_output" className="font-medium">
                            {`${user.voornaam} ${user.achternaam}`}
                          </span>
                        </div>
                      </Button>
                    </td>
                    <td className="p-4">
                      <span data-cy="birthdate_output" className="text-gray-700">
                        {new Date(user.geboortedatum).toLocaleDateString("nl-NL")}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-mainAccent" />
                        <span data-cy="rating_output" className="font-semibold text-textColor">
                          {user.schaakrating_elo}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span data-cy="fide_output" className="text-gray-700">
                        {user.fide_id || "N/A"}
                      </span>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          onClick={() => setEditingUser(user)}
                          size="sm"
                          className="bg-mainAccent hover:bg-mainAccentDark"
                          data-cy="edit_button"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => onDelete(user.user_id)}
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          disabled={isDeleting}
                          data-cy="delete_button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.user_id}
                className="border border-neutral-200 rounded-lg p-4 hover:border-mainAccent/30 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-mainAccent/10 rounded-full flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-mainAccent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-textColor">{`${user.voornaam} ${user.achternaam}`}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </div>
                  {user.is_admin && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200">
                      Admin
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <div className="flex items-center gap-1 text-gray-500 mb-1">
                      <Trophy className="h-3 w-3" />
                      <span>ELO Rating</span>
                    </div>
                    <div className="font-semibold text-textColor">{user.schaakrating_elo}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-gray-500 mb-1">
                      <Calendar className="h-3 w-3" />
                      <span>Geboortedatum</span>
                    </div>
                    <div className="text-gray-700">{new Date(user.geboortedatum).toLocaleDateString("nl-NL")}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setEditingUser(user)}
                    size="sm"
                    className="flex-1 bg-mainAccent hover:bg-mainAccentDark"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Bewerken
                  </Button>
                  <Button
                    onClick={() => onDelete(user.user_id)}
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
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
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-mainAccent" />
              Speler Bewerken
            </DialogTitle>
          </DialogHeader>
          {editingUser && <EditForm user={editingUser} onClose={() => setEditingUser(null)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

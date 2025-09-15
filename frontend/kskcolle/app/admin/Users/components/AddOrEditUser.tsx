"use client"

import { useState } from "react"
import { getAll } from "../../../api/index"
import CreateUserForm from "../../../components/CreateUserForm"
import AsyncData from "../../../components/AsyncData"
import type { User } from "@/data/types"
import { UserPlus } from "lucide-react"

interface AddOrEditUserProps {
  onRefresh?: () => void
}

export default function AddOrEditUser({ onRefresh }: AddOrEditUserProps) {
  const [showForm, setShowForm] = useState(false)
  // We don't need to fetch users here since we're just creating new ones

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Nieuwe Speler Toevoegen
        </h2>
      </div>
      <div className="p-6">
        {!showForm ? (
          <div className="text-center py-12">
            <div className="bg-gradient-to-r from-mainAccent/10 to-mainAccentDark/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <UserPlus className="h-10 w-10 text-mainAccent" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Voeg een nieuwe speler toe</h3>
            <p className="text-gray-600 text-base mb-6 max-w-md mx-auto leading-relaxed">
              Maak een nieuw account aan voor een speler. Het wachtwoord wordt automatisch gegenereerd en via email verzonden.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-mainAccent to-mainAccentDark hover:from-mainAccentDark hover:to-mainAccent text-white px-8 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <div className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span className="font-medium">Nieuwe Speler Aanmaken</span>
              </div>
            </button>
          </div>
        ) : (
          <CreateUserForm
            onSuccess={(userId) => {
              setShowForm(false)
              onRefresh?.() // Refresh de user list
            }}
            onClose={() => setShowForm(false)}
          />
        )}
      </div>
    </div>
  )
}

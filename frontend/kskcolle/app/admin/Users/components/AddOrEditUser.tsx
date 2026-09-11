"use client"

import { useState } from "react"
import { getAll } from "../../../api/index"
import CreateUserForm from "../../../components/CreateUserForm"
import AsyncData from "../../../components/AsyncData"
import type { User } from "@/data/types"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AddOrEditUserProps {
  onRefresh?: () => void
}

export default function AddOrEditUser({ onRefresh }: AddOrEditUserProps) {
  const [showForm, setShowForm] = useState(false)
  // We don't need to fetch users here since we're just creating new ones

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-2.5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Nieuwe Speler Toevoegen
        </h2>
      </div>
      <div className="p-4">
        {!showForm ? (
          <div className="text-center py-6">
            <div className="bg-mainAccent/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3">
              <UserPlus className="h-7 w-7 text-mainAccent" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1.5">Voeg een nieuwe speler toe</h3>
            <p className="text-gray-600 text-sm mb-4 max-w-md mx-auto leading-relaxed">
              Maak een nieuw account aan voor een speler. Het wachtwoord wordt automatisch gegenereerd en via email verzonden.
            </p>
            <Button onClick={() => setShowForm(true)} variant="accent">
              <UserPlus className="h-4 w-4 mr-2" />
              Nieuwe Speler Aanmaken
            </Button>
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

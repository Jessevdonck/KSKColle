"use client"

import { getAll } from "../../api/index"
import PlayerTable from "./PlayerTable"
import useSWR from "swr"
import AsyncData from "../../components/AsyncData"
import type { User } from "@/data/types"
import { Users, Trophy } from "lucide-react"

export default function PlayerRanking() {
  const { data: users = [], isLoading, error } = useSWR<User[]>("users/publicUsers", getAll)

  const noPlayersError = users.length === 0 && !isLoading && !error

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent mx-auto mb-3"></div>
          <p className="text-gray-600 text-base">Spelers worden geladen...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Fout bij laden van spelers</h2>
          <p className="text-gray-600 text-sm">Er is een probleem opgetreden bij het ophalen van de spelersgegevens.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-mainAccent/10 p-2 rounded-lg">
              <Users className="h-6 w-6 text-mainAccent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-textColor">Spelers Ranglijst</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{users.length} geregistreerde spelers</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  <span>Gesorteerd op ELO rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AsyncData loading={isLoading} error={error}>
          {noPlayersError ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Geen Spelers
                </h2>
              </div>
              <div className="p-8 text-center">
                <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-red-600 mb-2">Geen spelers gevonden</h3>
                <p className="text-gray-600 text-sm">Er zijn momenteel geen spelers in de database.</p>
              </div>
            </div>
          ) : (
            <PlayerTable users={users} />
          )}
        </AsyncData>
      </div>
    </div>
  )
}

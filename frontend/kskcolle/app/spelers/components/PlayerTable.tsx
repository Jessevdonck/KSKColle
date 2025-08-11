"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { ChevronUp, ChevronDown, Trophy, TrendingUp, TrendingDown, Minus, User, Award } from "lucide-react"
import type { User as UserType } from "@/data/types"

type SortKey = keyof UserType
type SortOrder = "asc" | "desc"

const createUrlFriendlyName = (voornaam: string, achternaam: string) => {
  return `${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, "_")
}

interface PlayerTableProps {
  users: UserType[]
}

export default function PlayerTable({ users }: PlayerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("schaakrating_elo")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const sortPlayers = useCallback(
    (a: UserType, b: UserType) => {
      if (a[sortKey] == null || b[sortKey] == null) {
        return 0
      }
      if (a[sortKey] < b[sortKey]) return sortOrder === "asc" ? -1 : 1
      if (a[sortKey] > b[sortKey]) return sortOrder === "asc" ? 1 : -1
      return 0
    },
    [sortKey, sortOrder],
  )

  const handleSort = (key: SortKey) => {
    setSortOrder((currentOrder) => (key === sortKey && currentOrder === "asc" ? "desc" : "asc"))
    setSortKey(key)
  }

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (columnKey !== sortKey) return null
    return sortOrder === "asc" ? (
      <ChevronUp className="inline w-3 h-3 ml-1" />
    ) : (
      <ChevronDown className="inline w-3 h-3 ml-1" />
    )
  }

  const getRatingDifferenceIcon = (difference: number | null) => {
    if (!difference) return <Minus className="h-3 w-3 text-gray-400" />
    if (difference > 0) return <TrendingUp className="h-3 w-3 text-green-500" />
    if (difference < 0) return <TrendingDown className="h-3 w-3 text-red-500" />
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  const getRatingDifferenceColor = (difference: number | null) => {
    if (!difference) return "text-gray-500"
    if (difference > 0) return "text-green-600 font-semibold"
    if (difference < 0) return "text-red-600 font-semibold"
    return "text-gray-500"
  }

  const sortedPlayers = [...users].sort(sortPlayers)

  const columns = [
    { key: "achternaam" as SortKey, label: "Speler", icon: User },
    { key: "schaakrating_elo" as SortKey, label: "ELIO Rating", icon: Trophy },
    { key: "schaakrating_difference" as SortKey, label: "Verschil", icon: TrendingUp },
    { key: "schaakrating_max" as SortKey, label: "Hoogste Rating", icon: Award },
  ]

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Ranglijst
        </h2>
        <p className="text-white/80 mt-1 text-sm">Klik op een kolomtitel om te sorteren</p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-mainAccent/10 to-mainAccentDark/10 border-b border-neutral-200">
              <th className="p-3 text-left font-semibold text-textColor w-12 text-sm">#</th>
              {columns.map(({ key, label, icon: Icon }) => (
                <th
                  key={key}
                  className="p-3 text-left cursor-pointer hover:bg-mainAccent/5 transition-colors font-semibold text-textColor text-sm"
                  onClick={() => handleSort(key)}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-3 w-3" />
                    {label}
                    <SortIcon columnKey={key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player, index) => {
              const position = index + 1
              return (
                <tr
                  key={player.user_id}
                  className={`border-b border-neutral-100 transition-all hover:bg-mainAccent/5 ${
                    index % 2 === 0 ? "bg-white" : "bg-neutral-50/50"
                  }`}
                >
                  <td className="p-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 text-gray-700 font-bold text-sm">
                      {position}
                    </div>
                  </td>
                  <td className="p-3" data-cy="name">
                    <Link
                      href={`/profile/${createUrlFriendlyName(player.voornaam, player.achternaam)}`}
                      className="group flex items-center gap-2 hover:text-mainAccent transition-colors"
                    >
                      <div className="w-8 h-8 bg-mainAccent/10 rounded-full flex items-center justify-center group-hover:bg-mainAccent/20 transition-colors">
                        <User className="h-4 w-4 text-mainAccent" />
                      </div>
                      <div className="font-semibold text-textColor group-hover:text-mainAccent transition-colors text-sm">
                        {`${player.voornaam} ${player.achternaam}`}
                      </div>
                    </Link>
                  </td>
                  <td className="p-3" data-cy="rating">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-3 w-3 text-mainAccent" />
                      <span className="text-base font-bold text-textColor">{player.schaakrating_elo}</span>
                    </div>
                  </td>
                  <td className="p-3" data-cy="rating_difference">
                    <div className="flex items-center gap-2">
                      {getRatingDifferenceIcon(player.schaakrating_difference)}
                      <span className={`${getRatingDifferenceColor(player.schaakrating_difference)} text-sm`}>
                        {player.schaakrating_difference
                          ? player.schaakrating_difference > 0
                            ? `+${player.schaakrating_difference}`
                            : player.schaakrating_difference
                          : "-"}
                      </span>
                    </div>
                  </td>
                  <td className="p-3" data-cy="rating_max">
                    <div className="flex items-center gap-2">
                      <Award className="h-3 w-3 text-amber-500" />
                      <span className="font-medium text-textColor text-sm">{player.schaakrating_max || "-"}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden p-3 space-y-3">
        {sortedPlayers.map((player, index) => {
          const position = index + 1
          return (
            <div
              key={player.user_id}
              className="rounded-lg border bg-white border-neutral-200 hover:border-mainAccent/30 transition-all"
            >
              <div className="p-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 text-gray-700 font-bold text-sm">
                    {position}
                  </div>
                  <Link
                    href={`/profile/${createUrlFriendlyName(player.voornaam, player.achternaam)}`}
                    className="flex-1 group"
                  >
                    <div className="font-semibold text-textColor group-hover:text-mainAccent transition-colors text-sm">
                      {`${player.voornaam} ${player.achternaam}`}
                    </div>
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Trophy className="h-3 w-3 text-mainAccent" />
                      <span className="text-gray-500">ELO</span>
                    </div>
                    <div className="font-bold text-textColor text-sm">{player.schaakrating_elo}</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {getRatingDifferenceIcon(player.schaakrating_difference)}
                      <span className="text-gray-500">Verschil</span>
                    </div>
                    <div className={`${getRatingDifferenceColor(player.schaakrating_difference)} text-sm`}>
                      {player.schaakrating_difference
                        ? player.schaakrating_difference > 0
                          ? `+${player.schaakrating_difference}`
                          : player.schaakrating_difference
                        : "-"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Award className="h-3 w-3 text-amber-500" />
                      <span className="text-gray-500">Max</span>
                    </div>
                    <div className="font-medium text-textColor text-sm">{player.schaakrating_max || "-"}</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

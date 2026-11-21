"use client"

import { useState, useCallback, type ReactNode } from "react"
import Link from "next/link"
import { ChevronUp, ChevronDown, Trophy, User, Award, Zap } from "lucide-react"
import type { User as UserType } from "@/data/types"

type SortKey = keyof UserType

/** Zelfde kleur als de blitz-lijn in de ratinggrafiek op het profiel */
const BLITZ_COLOR = "#0ea5e9"
type SortOrder = "asc" | "desc"

const createUrlFriendlyName = (voornaam: string, achternaam: string) => {
  const slugPart = (s: string) =>
    encodeURIComponent((s ?? "").trim().toLowerCase().replace(/\s+/g, "_"))
  return `${slugPart(voornaam)}_${slugPart(achternaam)}`
}

interface PlayerTableProps {
  users: UserType[]
  /** Standaard: Ranglijst Clubrating */
  tableTitle?: string
  /** Extra regel rechts in de tabel-header (bv. niet-actieve leden-toggle). */
  membershipToggleSlot?: ReactNode
}

export default function PlayerTable({
  users,
  tableTitle = "Ranglijst Clubrating",
  membershipToggleSlot,
}: PlayerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("schaakrating_elo")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const sortPlayers = useCallback(
    (a: UserType, b: UserType) => {
      // Lege waarden (bv. geen blitzrating) altijd onderaan, ongeacht de sorteerrichting
      const aEmpty = a[sortKey] == null
      const bEmpty = b[sortKey] == null
      if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1
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

  const formatRatingDifference = (difference: number | null | undefined) => {
    if (difference === null || difference === undefined) return "-"
    if (difference > 0) return `+${difference}`
    return String(difference)
  }

  const getRatingDifferenceColor = (difference: number | null | undefined) => {
    if (difference === null || difference === undefined) return "text-gray-500"
    if (difference > 0) return "text-green-600 font-semibold"
    if (difference < 0) return "text-red-600 font-semibold"
    return "text-gray-500"
  }

  const sortedPlayers = [...users].sort(sortPlayers)

  // Gouden badge, enkel voor wie dít jaar zijn jubileum viert (exact 25/50 jaar lid)
  const JubileumBadge = ({ player }: { player: UserType }) => {
    if (!player.jubileum_dit_jaar || !player.jubileum_jaren) return null
    return (
      <span
        title={`Viert dit jaar ${player.jubileum_jaren} jaar lidmaatschap van KSK Colle`}
        className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm shrink-0"
      >
        <Award className="h-3 w-3" />
        {player.jubileum_jaren} jaar
      </span>
    )
  }

  // Blitzkolommen enkel als er spelers met een blitzrating in de lijst staan (niet bij de jeugd)
  const showBlitz = users.some((u) => u.blitz_rating != null)

  const columns = [
    { key: "achternaam" as SortKey, label: "Speler", icon: User },
    { key: "schaakrating_elo" as SortKey, label: "ELIO Rating", icon: Trophy },
    ...(showBlitz ? [{ key: "blitz_rating" as SortKey, label: "Blitz Rating", icon: Zap }] : []),
    { key: "schaakrating_max" as SortKey, label: "Hoogste Clubrating", icon: Award },
    ...(showBlitz ? [{ key: "blitz_rating_max" as SortKey, label: "Hoogste Blitzrating", icon: Award }] : []),
  ]

  /** Ratingverschil als klein getal rechtsboven de rating */
  const DiffSup = ({ difference }: { difference: number | null | undefined }) =>
    difference === null || difference === undefined || difference === 0 ? null : (
      <sup
        className={`ml-0.5 text-[10px] font-semibold ${getRatingDifferenceColor(difference)}`}
        title="Verschil na de laatste verwerking"
      >
        {formatRatingDifference(difference)}
      </sup>
    )

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 shrink-0" />
              {tableTitle}
            </h2>
            <p className="text-white/80 mt-0.5 text-xs">Klik op een kolomtitel om te sorteren</p>
          </div>
          {membershipToggleSlot ? (
            <div className="flex justify-center sm:justify-end shrink-0 self-center">{membershipToggleSlot}</div>
          ) : null}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-mainAccent/10 to-mainAccentDark/10 border-b border-neutral-200">
              <th className="p-2.5 text-left font-semibold text-textColor w-12 text-sm">#</th>
              {columns.map(({ key, label, icon: Icon }) => (
                <th
                  key={key}
                  className="p-2.5 text-left cursor-pointer hover:bg-mainAccent/5 transition-colors font-semibold text-textColor text-sm"
                  onClick={() => handleSort(key)}
                >
                  <span className="flex items-center gap-2">
                    <Icon
                      className={`h-3 w-3 ${key === "blitz_rating_max" ? "text-yellow-500" : ""}`}
                      style={key === "blitz_rating" ? { color: BLITZ_COLOR } : undefined}
                    />
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
                  <td className="p-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 text-gray-700 font-bold text-sm">
                      {position}
                    </div>
                  </td>
                  <td className="p-2.5" data-cy="name">
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
                      <JubileumBadge player={player} />
                    </Link>
                  </td>
                  <td className="p-2.5" data-cy="rating">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-3 w-3 text-mainAccent" />
                      <span className="text-base font-bold text-textColor">
                        {player.schaakrating_elo}
                        <DiffSup difference={player.schaakrating_difference} />
                      </span>
                    </div>
                  </td>
                  {showBlitz && (
                    <td className="p-2.5" data-cy="rating_blitz">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3" style={{ color: BLITZ_COLOR }} />
                        <span className="text-base font-bold text-textColor">
                          {player.blitz_rating ?? "-"}
                          {player.blitz_rating != null && <DiffSup difference={player.blitz_rating_difference} />}
                        </span>
                      </div>
                    </td>
                  )}
                  <td className="p-2.5" data-cy="rating_max">
                    <div className="flex items-center gap-2">
                      <Award className="h-3 w-3 text-yellow-500" />
                      <span className="font-medium text-textColor text-sm">{player.schaakrating_max || "-"}</span>
                    </div>
                  </td>
                  {showBlitz && (
                    <td className="p-2.5" data-cy="rating_blitz_max">
                      <div className="flex items-center gap-2">
                        <Award className="h-3 w-3 text-yellow-500" />
                        <span className="font-medium text-textColor text-sm">{player.blitz_rating_max ?? "-"}</span>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden p-2.5 space-y-2">
        {sortedPlayers.map((player, index) => {
          const position = index + 1
          return (
            <div
              key={player.user_id}
              className="rounded-lg border bg-white border-neutral-200 hover:border-mainAccent/30 transition-all"
            >
              <div className="p-2.5">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 text-gray-700 font-bold text-sm">
                    {position}
                  </div>
                  <Link
                    href={`/profile/${createUrlFriendlyName(player.voornaam, player.achternaam)}`}
                    className="flex-1 group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-textColor group-hover:text-mainAccent transition-colors text-sm">
                        {`${player.voornaam} ${player.achternaam}`}
                      </div>
                      <JubileumBadge player={player} />
                    </div>
                  </Link>
                </div>

                <div className={`grid ${showBlitz ? "grid-cols-4" : "grid-cols-2"} gap-2 text-xs`}>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Trophy className="h-3 w-3 text-mainAccent" />
                      <span className="text-gray-500">ELIO</span>
                    </div>
                    <div className="font-bold text-textColor text-sm">
                      {player.schaakrating_elo}
                      <DiffSup difference={player.schaakrating_difference} />
                    </div>
                  </div>
                  {showBlitz && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Zap className="h-3 w-3" style={{ color: BLITZ_COLOR }} />
                        <span className="text-gray-500">Blitz</span>
                      </div>
                      <div className="font-bold text-textColor text-sm">
                        {player.blitz_rating ?? "-"}
                        {player.blitz_rating != null && <DiffSup difference={player.blitz_rating_difference} />}
                      </div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Award className="h-3 w-3 text-yellow-500" />
                      <span className="text-gray-500">Max club</span>
                    </div>
                    <div className="font-medium text-textColor text-sm">{player.schaakrating_max || "-"}</div>
                  </div>
                  {showBlitz && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Award className="h-3 w-3 text-yellow-500" />
                        <span className="text-gray-500">Max blitz</span>
                      </div>
                      <div className="font-medium text-textColor text-sm">{player.blitz_rating_max ?? "-"}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

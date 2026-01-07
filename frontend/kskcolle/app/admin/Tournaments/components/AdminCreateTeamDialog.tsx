"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import useSWR from "swr"
import { axios } from "../../../api/index"
import type { MegaschaakPlayer, Toernooi, User } from "@/data/types"
import { X, Plus, Search, UserPlus, Save } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const MIN_PLAYERS = 10
const MAX_PLAYERS = 10
const MAX_BUDGET = 1000

interface AdminCreateTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournament: Toernooi
  onTeamCreated: () => void
}

export default function AdminCreateTeamDialog({
  open,
  onOpenChange,
  tournament,
  onTeamCreated,
}: AdminCreateTeamDialogProps) {
  const { toast } = useToast()
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [teamName, setTeamName] = useState("")
  const [selectedPlayers, setSelectedPlayers] = useState<MegaschaakPlayer[]>([])
  const [reservePlayer, setReservePlayer] = useState<MegaschaakPlayer | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [userSearchTerm, setUserSearchTerm] = useState("")

  // Fetch all users
  const { data: allUsers = [], isLoading: usersLoading } = useSWR<User[]>(
    open ? "users" : null,
    async () => {
      const response = await axios.get("/users")
      return response.data.items || []
    }
  )

  // Fetch available players
  const { data: availablePlayers = [], isLoading: playersLoading } = useSWR<MegaschaakPlayer[]>(
    open && tournament ? `megaschaak/players-${tournament.tournament_id}` : null,
    async () => {
      const response = await axios.get("/megaschaak/players")
      return response.data.items || []
    }
  )

  // Filter users
  const filteredUsers = React.useMemo(() => {
    if (!userSearchTerm.trim()) return allUsers
    const query = userSearchTerm.toLowerCase()
    return allUsers.filter(user => {
      const fullName = `${user.voornaam} ${user.achternaam}`.toLowerCase()
      const email = user.email?.toLowerCase() || ""
      return fullName.includes(query) || email.includes(query)
    })
  }, [allUsers, userSearchTerm])

  // Group players by class with proper sorting
  const playersByClass = React.useMemo(() => {
    const classMap = new Map<string, MegaschaakPlayer[]>()
    availablePlayers.forEach(player => {
      const className = player.class_name || "Onbekend"
      if (!classMap.has(className)) {
        classMap.set(className, [])
      }
      classMap.get(className)!.push(player)
    })
    
    // Custom sort order for class names
    const classOrder = [
      'Eerste Klasse',
      'Tweede Klasse',
      'Derde Klasse',
      'Vierde Klasse',
      'Vijfde Klasse',
      'Vierde en Vijfde Klasse',
      'Zesde Klasse',
      'Zevende Klasse',
      'Achtste Klasse',
      'Hoofdtoernooi'
    ]
    
    return Array.from(classMap.entries()).sort(([a], [b]) => {
      // If no class_name, put at the end
      if (a === "Onbekend" && b === "Onbekend") return 0
      if (a === "Onbekend") return 1
      if (b === "Onbekend") return -1
      
      // Use custom order for known class names
      const aIndex = classOrder.indexOf(a)
      const bIndex = classOrder.indexOf(b)
      
      // If both are in the order list, use their index
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }
      
      // If only one is in the list, prioritize it
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      
      // If neither is in the list, use alphabetical
      return a.localeCompare(b)
    })
  }, [availablePlayers])

  // Filter players by search term
  const filteredPlayersByClass = React.useMemo(() => {
    if (!searchTerm.trim()) return playersByClass
    const query = searchTerm.toLowerCase()
    return playersByClass.map(([className, players]) => [
      className,
      players.filter(player => {
        const fullName = `${player.voornaam} ${player.achternaam}`.toLowerCase()
        return fullName.includes(query)
      })
    ]).filter(([, players]) => players.length > 0) as [string, MegaschaakPlayer[]][]
  }, [playersByClass, searchTerm])

  const totalCost = selectedPlayers.reduce((sum, player) => sum + player.cost, 0)
  const remainingBudget = MAX_BUDGET - totalCost

  const isPlayerSelected = (playerId: number) => {
    return selectedPlayers.some(p => p.user_id === playerId)
  }

  const canAddPlayer = (player: MegaschaakPlayer) => {
    if (selectedPlayers.length >= MAX_PLAYERS) return false
    if (isPlayerSelected(player.user_id)) return false
    if (totalCost + player.cost > MAX_BUDGET) return false
    return true
  }

  const addPlayer = (player: MegaschaakPlayer) => {
    if (!canAddPlayer(player)) return
    setSelectedPlayers([...selectedPlayers, player])
  }

  const removePlayer = (playerId: number) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.user_id !== playerId))
    if (reservePlayer?.user_id === playerId) {
      setReservePlayer(null)
    }
  }

  const setAsReserve = (player: MegaschaakPlayer) => {
    if (player.cost > 100) {
      toast({
        title: "Fout",
        description: "Reservespeler mag maximaal 100 punten kosten",
        variant: "destructive"
      })
      return
    }
    setReservePlayer(player)
  }

  const handleCreateTeam = async () => {
    if (!selectedUserId) {
      toast({
        title: "Fout",
        description: "Selecteer eerst een gebruiker",
        variant: "destructive"
      })
      return
    }

    if (selectedPlayers.length !== MIN_PLAYERS) {
      toast({
        title: "Fout",
        description: `Je moet precies ${MIN_PLAYERS} spelers selecteren (momenteel: ${selectedPlayers.length})`,
        variant: "destructive"
      })
      return
    }

    if (!teamName.trim()) {
      toast({
        title: "Fout",
        description: "Geef het team een naam.",
        variant: "destructive"
      })
      return
    }

    if (!reservePlayer) {
      toast({
        title: "Fout",
        description: "Je moet nog een reservespeler selecteren!",
        variant: "destructive"
      })
      return
    }

    try {
      await axios.post(`/megaschaak/admin/tournament/${tournament.tournament_id}/team`, {
        userId: selectedUserId,
        playerIds: selectedPlayers.map(p => p.user_id),
        teamName: teamName,
        reservePlayerId: reservePlayer.user_id
      })

      toast({
        title: "Succes!",
        description: "Team aangemaakt!",
      })

      // Reset form
      setSelectedUserId(null)
      setTeamName("")
      setSelectedPlayers([])
      setReservePlayer(null)
      setSearchTerm("")
      setUserSearchTerm("")
      
      onTeamCreated()
      onOpenChange(false)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Kon team niet aanmaken"
      toast({
        title: "Fout",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const selectedUser = allUsers.find(u => u.user_id === selectedUserId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Team Aanmaken voor Gebruiker - {tournament.naam}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Selection */}
          <div className="space-y-2">
            <Label>Selecteer Gebruiker</Label>
            {selectedUser ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-blue-900">
                    {selectedUser.voornaam} {selectedUser.achternaam}
                    {selectedUser.email && ` (${selectedUser.email})`}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedUserId(null)
                    setTeamName("")
                    setSelectedPlayers([])
                    setReservePlayer(null)
                  }}
                  className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Zoek gebruiker op naam of email..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {!selectedUser && userSearchTerm && (
                  <div className="max-h-60 overflow-y-auto border rounded-lg mt-2">
                    {filteredUsers.slice(0, 20).map((user) => (
                      <div
                        key={user.user_id}
                        onClick={() => {
                          setSelectedUserId(user.user_id)
                          setUserSearchTerm("")
                        }}
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium">
                          {user.voornaam} {user.achternaam}
                        </div>
                        {user.email && (
                          <div className="text-sm text-gray-600">{user.email}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Team Name */}
          {selectedUserId && (
            <div className="space-y-2">
              <Label>Team Naam</Label>
              <Input
                type="text"
                placeholder="Bijv. Team van Jan"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
          )}

          {/* Selected Players Summary */}
          {selectedUserId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b pb-2">
                <Label className="text-base font-semibold">Geselecteerde Spelers ({selectedPlayers.length}/{MAX_PLAYERS})</Label>
                <div className="text-sm font-semibold">
                  Budget: <span className="text-mainAccent">{totalCost}</span> / {MAX_BUDGET} 
                  {remainingBudget >= 0 ? (
                    <span className="text-green-600 ml-1">({remainingBudget} over)</span>
                  ) : (
                    <span className="text-red-600 ml-1">({Math.abs(remainingBudget)} te veel!)</span>
                  )}
                </div>
              </div>
              {selectedPlayers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                  <p className="text-sm">Nog geen spelers geselecteerd</p>
                  <p className="text-xs mt-1">Selecteer {MAX_PLAYERS} spelers uit de lijst hieronder</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-lg border">
                  {selectedPlayers.map((player, index) => (
                    <div
                      key={player.user_id}
                      className="flex items-center justify-between p-2 bg-white border border-mainAccent/30 rounded-lg shadow-sm"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="bg-mainAccent text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="font-medium text-sm text-gray-800 truncate flex-shrink-0 min-w-[120px]">
                          {player.voornaam} {player.achternaam}
                        </div>
                        {player.class_name && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-mainAccent/10 text-mainAccent border border-mainAccent/30 flex-shrink-0">
                            {player.class_name}
                          </span>
                        )}
                        <div className="text-xs text-gray-600 flex-shrink-0">
                          Elo: {player.schaakrating_elo}
                        </div>
                        <div className="text-xs font-semibold text-mainAccent flex-shrink-0">
                          {player.cost} pts
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removePlayer(player.user_id)}
                        className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 flex-shrink-0 ml-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reserve Player */}
          {selectedUserId && (
            <div className="space-y-2">
              <Label>Reservespeler (max 100 pts)</Label>
              {reservePlayer ? (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      R
                    </div>
                    <div className="font-medium text-sm text-gray-800 truncate flex-shrink-0 min-w-[120px]">
                      {reservePlayer.voornaam} {reservePlayer.achternaam}
                    </div>
                    <div className="text-xs text-gray-600 flex-shrink-0">
                      Elo: {reservePlayer.schaakrating_elo}
                    </div>
                    <div className="text-xs font-semibold text-mainAccent flex-shrink-0">
                      {reservePlayer.cost} pts
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReservePlayer(null)}
                    className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-2 text-gray-500 bg-gray-50 rounded-lg">
                  <p className="text-xs">Geen reservespeler geselecteerd</p>
                </div>
              )}
            </div>
          )}

          {/* Player Selection */}
          {selectedUserId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Selecteer Spelers</Label>
                <div className="relative w-64">
                  <Input
                    type="text"
                    placeholder="Zoek speler..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto border rounded-lg divide-y">
                {filteredPlayersByClass.map(([className, players]) => (
                  <div key={className} className="p-3">
                    <div className="font-semibold text-sm mb-2 text-gray-700">{className}</div>
                    <div className="space-y-1">
                      {players.map((player) => {
                        const selected = isPlayerSelected(player.user_id)
                        const isReserve = reservePlayer?.user_id === player.user_id
                        const canAdd = canAddPlayer(player)
                        const isReserveCandidate = player.cost <= 100

                        return (
                          <div
                            key={player.user_id}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded border transition-all ${
                              selected
                                ? 'bg-green-50 border-green-300'
                                : isReserve
                                ? 'bg-blue-50 border-blue-300'
                                : canAdd || (isReserveCandidate && !reservePlayer)
                                ? 'bg-white hover:shadow-sm border-gray-200'
                                : 'bg-gray-50 border-gray-200 opacity-50'
                            }`}
                          >
                            <div className="flex-1 flex items-center gap-3 min-w-0">
                              <div className="font-medium text-sm text-gray-800 truncate">
                                {player.voornaam} {player.achternaam}
                              </div>
                              <div className="text-xs text-gray-600 flex-shrink-0">
                                Elo: {player.schaakrating_elo}
                              </div>
                              <div className="text-sm font-semibold text-mainAccent flex-shrink-0">
                                {player.cost} pts
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {selected ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removePlayer(player.user_id)}
                                  className="h-7 px-2 text-red-600 hover:bg-red-100"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  <span className="text-xs">Verwijder</span>
                                </Button>
                              ) : isReserve ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setReservePlayer(null)}
                                  className="h-7 px-2 text-blue-600 hover:bg-blue-100"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  <span className="text-xs">Reserve</span>
                                </Button>
                              ) : (
                                <>
                                  {canAdd && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => addPlayer(player)}
                                      className="h-7 px-2 text-green-600 hover:bg-green-100"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      <span className="text-xs">Toevoegen</span>
                                    </Button>
                                  )}
                                  {isReserveCandidate && !reservePlayer && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setAsReserve(player)}
                                      className="h-7 px-2 text-blue-600 hover:bg-blue-100"
                                    >
                                      <UserPlus className="h-3 w-3 mr-1" />
                                      <span className="text-xs">Reserve</span>
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={!selectedUserId || selectedPlayers.length !== MIN_PLAYERS || !reservePlayer || !teamName.trim()}
              className="bg-mainAccent hover:bg-mainAccentDark"
            >
              <Save className="h-4 w-4 mr-2" />
              Team Aanmaken
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


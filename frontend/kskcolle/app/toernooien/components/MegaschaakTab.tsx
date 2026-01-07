"use client"

import * as React from "react"
import { useState } from "react"
import useSWR from "swr"
import { axios } from "../../api/index"
import type { MegaschaakPlayer, MegaschaakTeam } from "@/data/types"
import { Swords, Users, Search, Plus, Trash2, Save, TrendingUp, Trophy, X, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { format, isPast } from "date-fns"

interface MegaschaakTabProps {
  tournamentId: number
  tournamentName: string
  megaschaakDeadline?: string | null
}

const MAX_PLAYERS = 10
const MAX_BUDGET = 1000

export default function MegaschaakTab({ tournamentId, tournamentName, megaschaakDeadline }: MegaschaakTabProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [teamName, setTeamName] = useState("Mijn Team")
  const [selectedPlayers, setSelectedPlayers] = useState<MegaschaakPlayer[]>([])

  // Check if deadline has passed
  const isDeadlinePassed = megaschaakDeadline ? isPast(new Date(megaschaakDeadline)) : false

  // Fetch standings if deadline has passed
  const { data: standings = [], isLoading: standingsLoading } = useSWR<any[]>(
    isDeadlinePassed ? `megaschaak/tournament/${tournamentId}/standings` : null,
    async () => {
      const response = await axios.get(`/megaschaak/tournament/${tournamentId}/standings`)
      return response.data.items
    }
  )

  // Fetch available players (only if deadline hasn't passed)
  const { data: availablePlayers = [], isLoading: playersLoading, mutate: mutatePlayers } = useSWR<MegaschaakPlayer[]>(
    'megaschaak/players',
    async () => {
      const response = await axios.get('/megaschaak/players')
      return response.data.items
    }
  )

  // Listen for config updates and refresh players
  React.useEffect(() => {
    const handleConfigUpdate = () => {
      mutatePlayers(undefined, { revalidate: true })
    }
    
    window.addEventListener('megaschaak-config-updated', handleConfigUpdate)
    return () => {
      window.removeEventListener('megaschaak-config-updated', handleConfigUpdate)
    }
  }, [mutatePlayers])

  // Fetch user's current team
  const { data: currentTeam, mutate: mutateTeam } = useSWR<MegaschaakTeam | null>(
    `megaschaak/tournament/${tournamentId}/my-team`,
    async () => {
      const response = await axios.get(`/megaschaak/tournament/${tournamentId}/my-team`)
      return response.data
    }
  )

  // Load current team into selected players when data arrives
  React.useEffect(() => {
    if (currentTeam && currentTeam.team_id) {
      setTeamName(currentTeam.team_name || "Mijn Team")
      const players = currentTeam.players.map(tp => ({
        user_id: tp.player.user_id,
        voornaam: tp.player.voornaam,
        achternaam: tp.player.achternaam,
        schaakrating_elo: tp.player.schaakrating_elo,
        is_youth: tp.player.is_youth,
        avatar_url: tp.player.avatar_url,
        cost: tp.cost
      }))
      setSelectedPlayers(players)
    }
  }, [currentTeam])

  // Calculate total cost
  const totalCost = selectedPlayers.reduce((sum, player) => sum + player.cost, 0)
  const remainingBudget = MAX_BUDGET - totalCost

  // Filter and group players by class
  const filteredPlayers = availablePlayers.filter(player => {
    const searchLower = searchTerm.toLowerCase()
    const fullName = `${player.voornaam} ${player.achternaam}`.toLowerCase()
    return fullName.includes(searchLower)
  })

  // Group players by class
  const playersByClass = React.useMemo(() => {
    const groups = new Map<string, MegaschaakPlayer[]>()
    
    filteredPlayers.forEach(player => {
      const className = player.class_name || 'Hoofdtoernooi'
      if (!groups.has(className)) {
        groups.set(className, [])
      }
      groups.get(className)!.push(player)
    })
    
    // Custom sort order for class names
    const classOrder = [
      'Hoofdtoernooi',
      'Eerste Klasse',
      'Tweede Klasse',
      'Derde Klasse',
      'Vierde Klasse',
      'Vijfde Klasse',
      'Vierde en Vijfde Klasse',
      'Zesde Klasse',
      'Zevende Klasse',
      'Achtste Klasse'
    ]
    
    return Array.from(groups.entries()).sort((a, b) => {
      const aIndex = classOrder.indexOf(a[0])
      const bIndex = classOrder.indexOf(b[0])
      
      // If both are in the order list, use their index
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }
      
      // If only one is in the list, prioritize it
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      
      // If neither is in the list, use alphabetical
      return a[0].localeCompare(b[0])
    })
  }, [filteredPlayers])

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
  }

  const handleSaveTeam = async () => {
    if (selectedPlayers.length === 0) {
      toast({
        title: "Fout",
        description: "Selecteer minstens 1 speler voor je team.",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await axios.post(`/megaschaak/tournament/${tournamentId}/team`, {
        playerIds: selectedPlayers.map(p => p.user_id),
        teamName: teamName || "Mijn Team"
      })

      toast({
        title: "Succes!",
        description: "Je team is opgeslagen!",
      })

      mutateTeam()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Kon team niet opslaan"
      toast({
        title: "Fout",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  // Show deadline message if deadline hasn't passed
  if (!isDeadlinePassed) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl text-center">
          <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-blue-800 mb-2">Megaschaak deadline is nog niet verstreken</h3>
          {megaschaakDeadline && (
            <p className="text-sm text-blue-700">
              De deadline is op <strong>{format(new Date(megaschaakDeadline), "dd/MM/yyyy 'om' HH:mm")}</strong>.
              Na deze datum kun je hier de megaschaak standen bekijken.
            </p>
          )}
        </div>
      </div>
    )
  }

  // Show standings if deadline has passed
  if (isDeadlinePassed) {
    if (standingsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mainAccent mx-auto mb-4"></div>
            <p className="text-gray-600">Stand laden...</p>
          </div>
        </div>
      )
    }

    if (standings.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Nog geen teams</h3>
          <p className="text-gray-500">Er zijn nog geen teams aangemaakt voor dit toernooi.</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Megaschaak Stand
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {standings.map((team, index) => (
                <div
                  key={team.team_id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                    index === 0
                      ? 'bg-yellow-50 border-yellow-300'
                      : index === 1
                      ? 'bg-gray-50 border-gray-300'
                      : index === 2
                      ? 'bg-orange-50 border-orange-300'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0
                        ? 'bg-yellow-500'
                        : index === 1
                        ? 'bg-gray-400'
                        : index === 2
                        ? 'bg-orange-500'
                        : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{team.team_name}</div>
                      <div className="text-sm text-gray-600">{team.players?.length || 0} spelers</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-mainAccent">{(team.totalScore || team.total_score || 0).toFixed(1)}</div>
                    <div className="text-xs text-gray-500">punten</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (playersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mainAccent mx-auto mb-4"></div>
          <p className="text-gray-600">Spelers laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header met Budget Info */}
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <Swords className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Megaschaak</h2>
            <p className="text-purple-100">Stel je fantasy team samen!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5" />
              <span className="text-sm opacity-80">Spelers</span>
            </div>
            <div className="text-2xl font-bold">{selectedPlayers.length} / {MAX_PLAYERS}</div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm opacity-80">Budget Gebruikt</span>
            </div>
            <div className="text-2xl font-bold">{totalCost} / {MAX_BUDGET}</div>
          </div>

          <div className={`rounded-lg p-4 ${remainingBudget < 0 ? 'bg-red-500/30' : 'bg-white/10'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-5 w-5" />
              <span className="text-sm opacity-80">Resterend</span>
            </div>
            <div className="text-2xl font-bold">{remainingBudget}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Speler Selectie */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Search className="h-5 w-5 text-mainAccent" />
              Beschikbare Spelers
            </h3>
            <Input
              type="text"
              placeholder="Zoek spelers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {playersByClass.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Geen spelers gevonden
              </div>
            ) : (
              playersByClass.map(([className, players]) => (
                <div key={className} className="space-y-2">
                  {/* Class Header */}
                  <div className="sticky top-0 bg-gradient-to-r from-mainAccent to-mainAccentDark text-white px-3 py-2 rounded-lg shadow-sm z-10">
                    <h4 className="font-bold text-sm">{className}</h4>
                    <p className="text-xs opacity-90">{players.length} spelers</p>
                  </div>
                  
                  {/* Players in this class */}
                  {players.map((player) => {
                    const selected = isPlayerSelected(player.user_id)
                    const canAdd = canAddPlayer(player)

                    return (
                      <div
                        key={player.user_id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          selected
                            ? 'bg-mainAccent/10 border-mainAccent/30'
                            : canAdd
                            ? 'bg-white border-gray-200 hover:border-mainAccent/30 hover:shadow-sm'
                            : 'bg-gray-50 border-gray-200 opacity-50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">
                            {player.voornaam} {player.achternaam}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span>Rating: {player.schaakrating_elo}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-semibold text-mainAccent">
                              {player.cost} pts
                            </div>
                          </div>
                          {selected ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removePlayer(player.user_id)}
                              className="h-8 border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => addPlayer(player)}
                              disabled={!canAdd}
                              className="h-8 bg-mainAccent hover:bg-mainAccentDark disabled:opacity-50"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Jouw Team */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-mainAccent" />
              Jouw Team
            </h3>
            <Input
              type="text"
              placeholder="Team naam..."
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full mb-3"
            />
          </div>

          {selectedPlayers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Selecteer spelers om je team samen te stellen</p>
              <p className="text-sm mt-2">Maximum {MAX_PLAYERS} spelers</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
                {selectedPlayers.map((player, index) => (
                  <div
                    key={player.user_id}
                    className="flex items-center justify-between p-3 bg-mainAccent/10 border border-mainAccent/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-mainAccent text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {player.voornaam} {player.achternaam}
                        </div>
                        <div className="text-sm text-gray-600">
                          Rating: {player.schaakrating_elo}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold text-mainAccent">
                        {player.cost} pts
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removePlayer(player.user_id)}
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSaveTeam}
                className="w-full bg-mainAccent hover:bg-mainAccentDark"
                disabled={remainingBudget < 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Team Opslaan
              </Button>

              {remainingBudget < 0 && (
                <p className="text-red-600 text-sm mt-2 text-center">
                  Budget overschreden! Verwijder spelers.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}


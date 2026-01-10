"use client"

import * as React from "react"
import { useState } from "react"
import useSWR from "swr"
import { axios } from "../../api/index"
import type { MegaschaakPlayer, MegaschaakTeam, Toernooi } from "@/data/types"
import { Swords, Users, Search, Plus, Trash2, Save, TrendingUp, Trophy, X, Calendar, Medal, ChevronRight, Clock, AlertCircle, Eye, Table2, Star, Zap, HelpCircle, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { format, isPast } from "date-fns"

const MIN_PLAYERS = 10
const MAX_PLAYERS = 10
const MAX_BUDGET = 1000

export default function MegaschaakPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [teamName, setTeamName] = useState("Nieuw Team")
  const [selectedPlayers, setSelectedPlayers] = useState<MegaschaakPlayer[]>([])
  const [reservePlayer, setReservePlayer] = useState<MegaschaakPlayer | null>(null)
  const [activeView, setActiveView] = useState<'team' | 'standings' | 'crosstable' | 'popular' | 'value'>('team')
  const [currentEditingTeam, setCurrentEditingTeam] = useState<MegaschaakTeam | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // Fetch active megaschaak tournament
  const { data: activeTournament, isLoading: tournamentLoading } = useSWR<Toernooi>(
    'megaschaak/active-tournament',
    async () => {
      const response = await axios.get('/megaschaak/active-tournament')
      return response.data
    },
    { revalidateOnFocus: false }
  )

  // Check if registration is closed (must be before using it in other hooks)
  const isRegistrationClosed = activeTournament?.megaschaak_deadline 
    ? isPast(new Date(activeTournament.megaschaak_deadline))
    : false

  // Reset to 'team' view if deadline hasn't passed and user tries to access other views
  React.useEffect(() => {
    if (!isRegistrationClosed && activeView !== 'team') {
      setActiveView('team')
    }
  }, [isRegistrationClosed, activeView])

  // Fetch available players (all participants from all classes of the active tournament)
  const { data: availablePlayers = [], isLoading: playersLoading, mutate: mutatePlayers } = useSWR<MegaschaakPlayer[]>(
    activeTournament ? 'megaschaak/players' : null,
    async () => {
      const response = await axios.get('/megaschaak/players')
      return response.data.items
    },
    { revalidateOnFocus: false }
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

  // Fetch user's teams for this tournament
  const { data: myTeams = [], mutate: mutateTeams } = useSWR<MegaschaakTeam[]>(
    activeTournament ? `megaschaak/tournament/${activeTournament.tournament_id}/my-teams` : null,
    async () => {
      if (!activeTournament) return []
      const response = await axios.get(`/megaschaak/tournament/${activeTournament.tournament_id}/my-teams`)
      return response.data.items
    },
    { revalidateOnFocus: false }
  )

  // Fetch standings (only if deadline has passed)
  const { data: standings = [], isLoading: standingsLoading } = useSWR<any[]>(
    activeTournament && isRegistrationClosed ? `megaschaak/tournament/${activeTournament.tournament_id}/standings` : null,
    async () => {
      if (!activeTournament) return []
      const response = await axios.get(`/megaschaak/tournament/${activeTournament.tournament_id}/standings`)
      return response.data.items
    },
    { revalidateOnFocus: false }
  )

  // Fetch cross-table data (only if deadline has passed)
  const { data: crossTableData, isLoading: crossTableLoading } = useSWR<any>(
    activeTournament && isRegistrationClosed ? `megaschaak/tournament/${activeTournament.tournament_id}/crosstable` : null,
    async () => {
      if (!activeTournament) return null
      const response = await axios.get(`/megaschaak/tournament/${activeTournament.tournament_id}/crosstable`)
      return response.data
    },
    { revalidateOnFocus: false }
  )

  // Fetch popular players (only if deadline has passed)
  const { data: popularPlayersData, isLoading: popularPlayersLoading } = useSWR<any>(
    activeTournament && isRegistrationClosed ? `megaschaak/tournament/${activeTournament.tournament_id}/popular-players` : null,
    async () => {
      if (!activeTournament) return null
      const response = await axios.get(`/megaschaak/tournament/${activeTournament.tournament_id}/popular-players`)
      return response.data
    },
    { revalidateOnFocus: false }
  )

  // Fetch value players (only if deadline has passed)
  const { data: valuePlayersData, isLoading: valuePlayersLoading } = useSWR<any>(
    activeTournament && isRegistrationClosed ? `megaschaak/tournament/${activeTournament.tournament_id}/value-players` : null,
    async () => {
      if (!activeTournament) return null
      const response = await axios.get(`/megaschaak/tournament/${activeTournament.tournament_id}/value-players`)
      return response.data
    },
    { revalidateOnFocus: false }
  )

  // Auto-select first team or create mode
  React.useEffect(() => {
    if (myTeams.length > 0 && !currentEditingTeam && !isCreatingNew) {
      setCurrentEditingTeam(myTeams[0])
    }
  }, [myTeams, currentEditingTeam, isCreatingNew])

  // Load team into editor when selecting a team
  React.useEffect(() => {
    if (currentEditingTeam && currentEditingTeam.team_id) {
      setTeamName(currentEditingTeam.team_name || "Mijn Team")
      const players = currentEditingTeam.players.map(tp => ({
        user_id: tp.player.user_id,
        voornaam: tp.player.voornaam,
        achternaam: tp.player.achternaam,
        schaakrating_elo: tp.player.schaakrating_elo,
        is_youth: tp.player.is_youth,
        avatar_url: tp.player.avatar_url,
        cost: tp.cost
      }))
      setSelectedPlayers(players)
      
      // Load reserve player if exists
      if (currentEditingTeam.reserve_player) {
        const reservePlayerData = availablePlayers.find(p => p.user_id === currentEditingTeam.reserve_player?.user_id)
        if (reservePlayerData) {
          setReservePlayer(reservePlayerData)
        } else if (currentEditingTeam.reserve_player) {
          // Fallback if not in available players list
          setReservePlayer({
            ...currentEditingTeam.reserve_player,
            cost: currentEditingTeam.reserve_cost || 0,
            class_name: ''
          })
        }
      } else {
        setReservePlayer(null)
      }
    } else if (isCreatingNew) {
      setTeamName("Nieuw Team")
      setSelectedPlayers([])
      setReservePlayer(null)
    }
  }, [currentEditingTeam, isCreatingNew, availablePlayers])

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
    toast({
      title: "Reservespeler geselecteerd",
      description: `${player.voornaam} ${player.achternaam} is nu je reservespeler`,
    })
  }

  const handleSaveTeam = async () => {
    if (!activeTournament) return
    
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
        description: "Geef je team een naam.",
        variant: "destructive"
      })
      return
    }

    try {
      if (currentEditingTeam && !isCreatingNew) {
        // Update existing team
        await axios.put(`/megaschaak/team/${currentEditingTeam.team_id}`, {
          playerIds: selectedPlayers.map(p => p.user_id),
          teamName: teamName,
          reservePlayerId: reservePlayer?.user_id || null
        })

        toast({
          title: "Succes!",
          description: "Team bijgewerkt!",
        })
      } else {
        // Create new team
        await axios.post(`/megaschaak/tournament/${activeTournament.tournament_id}/team`, {
          playerIds: selectedPlayers.map(p => p.user_id),
          teamName: teamName,
          reservePlayerId: reservePlayer?.user_id || null
        })

        toast({
          title: "Succes!",
          description: "Nieuw team aangemaakt!",
        })
        
        setIsCreatingNew(false)
      }

      mutateTeams()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Kon team niet opslaan"
      toast({
        title: "Fout",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleNewTeam = () => {
    setIsCreatingNew(true)
    setCurrentEditingTeam(null)
    setTeamName("Nieuw Team")
    setSelectedPlayers([])
    setReservePlayer(null)
  }

  const handleSelectTeam = (team: MegaschaakTeam) => {
    setIsCreatingNew(false)
    setCurrentEditingTeam(team)
    setTeamName(team.team_name)
    
    // Map players and add class_name from availablePlayers
    const mappedPlayers = team.players.map(p => {
      const playerData = availablePlayers.find(ap => ap.user_id === p.player.user_id)
      return {
        ...p.player,
        cost: p.cost,
        class_name: playerData?.class_name || ''
      }
    })
    setSelectedPlayers(mappedPlayers)
    
    // Load reserve player if exists
    if (team.reserve_player) {
      const reservePlayerData = availablePlayers.find(p => p.user_id === team.reserve_player?.user_id)
      if (reservePlayerData) {
        setReservePlayer(reservePlayerData)
      } else if (team.reserve_player) {
        // Fallback if not in available players list
        setReservePlayer({
          ...team.reserve_player,
          cost: team.reserve_cost || 0,
          class_name: ''
        })
      }
    } else {
      setReservePlayer(null)
    }
  }

  // Update selectedPlayers class_name when availablePlayers loads
  React.useEffect(() => {
    if (availablePlayers.length > 0 && selectedPlayers.length > 0) {
      setSelectedPlayers(prevPlayers => 
        prevPlayers.map(p => {
          const playerData = availablePlayers.find(ap => ap.user_id === p.user_id)
          if (playerData && playerData.class_name && !p.class_name) {
            return {
              ...p,
              class_name: playerData.class_name
            }
          }
          return p
        })
      )
    }
  }, [availablePlayers])

  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    if (!confirm(`Weet je zeker dat je "${teamName}" wilt verwijderen?`)) return

    try {
      await axios.delete(`/megaschaak/team/${teamId}`)
      
      toast({
        title: "Succes!",
        description: "Team verwijderd!",
      })

      setCurrentEditingTeam(null)
      setIsCreatingNew(false)
      mutateTeams()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Kon team niet verwijderen"
      toast({
        title: "Fout",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  // Loading state
  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mainAccent mx-auto mb-4"></div>
          <p className="text-gray-600">Megaschaak laden...</p>
        </div>
      </div>
    )
  }

  // No active tournament
  if (!activeTournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="bg-white shadow-sm border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-mainAccent/10 p-3 rounded-xl">
                <Swords className="h-8 w-8 text-mainAccent" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-textColor">Megaschaak</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="bg-mainAccent/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Swords className="h-10 w-10 text-mainAccent" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Geen Actief Megaschaak Toernooi</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Er is momenteel geen megaschaak aan de gang. 
            </p>
            <Link href="/toernooien">
              <Button className="bg-mainAccent hover:bg-mainAccentDark">
                <Calendar className="h-4 w-4 mr-2" />
                Bekijk Toernooien
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (playersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="bg-white shadow-sm border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-mainAccent/10 p-3 rounded-xl">
                <Swords className="h-8 w-8 text-mainAccent" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-textColor">Megaschaak</h1>
                <p className="text-gray-600 mt-1">{activeTournament.naam}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mainAccent mx-auto mb-4"></div>
            <p className="text-gray-600">Spelers laden...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-mainAccent/10 p-3 rounded-xl">
              <Swords className="h-8 w-8 text-mainAccent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-textColor">Megaschaak</h1>
              <p className="text-gray-600 mt-1">{activeTournament.naam}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reglement */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 py-3 sm:py-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-mainAccent flex-shrink-0" />
              <span className="leading-tight">Reglement Megaschaak 2025</span>
            </h2>
            <div className="text-xs sm:text-sm text-gray-700 space-y-1.5 sm:space-y-2">
              <p className="leading-relaxed"><strong>•</strong> Elke deelnemer dient een ploeg in ter waarde van <strong>max. 1000 punten</strong></p>
              <p className="leading-relaxed"><strong>•</strong> Een ploeg moet bestaan uit <strong>exact 10 schakers</strong></p>
              <p className="leading-relaxed"><strong>•</strong> Daarnaast mag je één reservespeler selecteren ter waarde van <strong>max. 100 punten</strong></p>
              <p className="leading-relaxed"><strong>•</strong> Bij uitval wordt de reservespeler automatisch vervangen (score vanaf moment van vervanging)</p>
              <p className="leading-relaxed"><strong>•</strong> De waarde van elke schaker staat hieronder vermeld alsook in welke afdeling ze spelen.</p>
              <p className="leading-relaxed"><strong>•</strong> <strong>Winst = 1 punt</strong>, <strong>Remise = 0,5 punt</strong>, <strong>Verlies = 0 punt</strong></p>
              <p className="leading-relaxed"><strong>•</strong> Deelname kost <strong>€2,50</strong> per ingestuurde ploeg, meerdere ploegen per persoon zijn toegestaan</p>
              <p className="leading-relaxed"><strong>•</strong> Prijzen voor de <strong>top 3</strong> uit de ingezamelde bijdragen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveView('team')}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
                activeView === 'team'
                  ? 'text-mainAccent border-mainAccent'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Mijn Team
              </div>
            </button>
            {isRegistrationClosed && (
              <>
                <button
                  onClick={() => setActiveView('standings')}
                  className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
                    activeView === 'standings'
                      ? 'text-mainAccent border-mainAccent'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Stand
                  </div>
                </button>
                <button
                  onClick={() => setActiveView('crosstable')}
                  className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
                    activeView === 'crosstable'
                      ? 'text-mainAccent border-mainAccent'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Table2 className="h-4 w-4" />
                    Kruistabel
                  </div>
                </button>
                <button
                  onClick={() => setActiveView('value')}
                  className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
                    activeView === 'value'
                      ? 'text-mainAccent border-mainAccent'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Beste Waarde
                  </div>
                </button>
                <button
                  onClick={() => setActiveView('popular')}
                  className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
                    activeView === 'popular'
                      ? 'text-mainAccent border-mainAccent'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Populairste
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${activeView === 'crosstable' ? 'max-w-[95vw]' : 'max-w-7xl'} mx-auto px-6 sm:px-8 lg:px-12 py-8`}>
        {!isRegistrationClosed && activeView !== 'team' ? (
          // If deadline hasn't passed and user tries to access other views, show message
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Deze tab is alleen beschikbaar na de deadline.</p>
          </div>
        ) : activeView === 'popular' ? (
          <PopularPlayersView 
            players={popularPlayersData?.items || []}
            isLoading={popularPlayersLoading}
          />
        ) : activeView === 'value' ? (
          <ValuePlayersView 
            players={valuePlayersData?.items || []}
            isLoading={valuePlayersLoading}
          />
        ) : activeView === 'crosstable' ? (
          <CrossTableView 
            data={crossTableData}
            isLoading={crossTableLoading}
          />
        ) : activeView === 'standings' ? (
          <StandingsView 
            standings={standings} 
            isLoading={standingsLoading}
          />
        ) : isRegistrationClosed && myTeams.length > 0 ? (
          // Show all teams when registration is closed
          <MyTeamsOverview myTeams={myTeams} />
        ) : isRegistrationClosed && myTeams.length === 0 ? (
          // No teams and registration closed
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Inschrijvingen Gesloten</h3>
                <p className="text-sm text-red-700">
                  De deadline is verstreken op{" "}
                  <strong>{format(new Date(activeTournament.megaschaak_deadline!), "dd/MM/yyyy 'om' HH:mm")}</strong>.
                  Je hebt geen teams ingediend. Bekijk de stand om te zien hoe andere teams het doen!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
          {/* Deadline Info Banner */}
          {activeTournament?.megaschaak_deadline && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">Inschrijvingsdeadline</h3>
                <p className="text-sm text-blue-700">
                  Je hebt tot <strong>{format(new Date(activeTournament.megaschaak_deadline), "dd/MM/yyyy 'om' HH:mm")}</strong> om je team samen te stellen.
                  Je kan je team blijven aanpassen tot de deadline.
                </p>
              </div>
            </div>
          )}

          {/* Team Selector */}
          {myTeams.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Jouw Teams ({myTeams.length})</h3>
                <Button 
                  onClick={handleNewTeam}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nieuw Team
                </Button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {myTeams.map(team => (
                  <button
                    key={team.team_id}
                    onClick={() => handleSelectTeam(team)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all ${
                      currentEditingTeam?.team_id === team.team_id && !isCreatingNew
                        ? 'border-mainAccent bg-mainAccent/10 text-mainAccent font-semibold'
                        : 'border-gray-200 bg-white hover:border-mainAccent/50'
                    }`}
                  >
                    <div className="text-sm">{team.team_name}</div>
                    <div className="text-xs text-gray-500">{team.players.length} spelers</div>
                  </button>
                ))}
                {isCreatingNew && (
                  <div className="flex-shrink-0 px-4 py-2 rounded-lg border-2 border-green-500 bg-green-50 text-green-700">
                    <div className="text-sm font-semibold">Nieuw Team</div>
                    <div className="text-xs">Aan het maken...</div>
                  </div>
                )}
              </div>
              {currentEditingTeam && !isCreatingNew && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                  <p className="text-xs text-gray-600">
                    Bewerk: <strong>{currentEditingTeam.team_name}</strong>
                  </p>
                  <Button
                    onClick={() => handleDeleteTeam(currentEditingTeam.team_id, currentEditingTeam.team_name)}
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Verwijder
                  </Button>
                </div>
              )}
            </div>
          )}

          {myTeams.length === 0 && !isCreatingNew && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">Je hebt nog geen team aangemaakt</p>
              <Button 
                onClick={handleNewTeam}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Maak je Eerste Team
              </Button>
            </div>
          )}

          {/* Budget Info */}
          {(myTeams.length > 0 || isCreatingNew) && (
            <>
            <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark rounded-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="h-6 w-6" />
                <h2 className="text-xl font-bold">
                  {isCreatingNew ? 'Nieuw Team Samenstellen' : `Bewerk: ${currentEditingTeam?.team_name || 'Team'}`}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-5 w-5" />
                  <span className="text-sm opacity-80">Spelers</span>
                </div>
                <div className="text-2xl font-bold">{selectedPlayers.length} / {MAX_PLAYERS}</div>
                <div className="text-xs text-white">Precies {MAX_PLAYERS} spelers vereist</div>
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

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {playersByClass.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'Geen spelers gevonden' : 'Geen spelers beschikbaar'}
                  </div>
                ) : (
                  playersByClass.map(([className, players], classIndex) => {
                    // Calculate color intensity based on class index (darker to lighter)
                    const getClassColor = (index: number) => {
                      const intensities = [
                        'bg-mainAccent/15 border-mainAccent/40',      // Hoofdtoernooi - darkest
                        'bg-mainAccent/13 border-mainAccent/35',      // Eerste Klasse
                        'bg-mainAccent/11 border-mainAccent/30',      // Tweede Klasse
                        'bg-mainAccent/9 border-mainAccent/25',       // Derde Klasse
                        'bg-mainAccent/7 border-mainAccent/20',       // Vierde Klasse
                        'bg-mainAccent/6 border-mainAccent/18',       // Vijfde Klasse
                        'bg-mainAccent/5 border-mainAccent/15',       // Zesde Klasse
                        'bg-mainAccent/4 border-mainAccent/12',       // Zevende Klasse
                        'bg-mainAccent/3 border-mainAccent/10',       // Achtste Klasse - lightest
                      ]
                      return intensities[index] || intensities[intensities.length - 1]
                    }
                    
                    const classColors = getClassColor(classIndex)
                    
                    return (
                      <div key={className} className="space-y-1.5">
                        {/* Class Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-mainAccent to-mainAccentDark text-white px-3 py-1.5 rounded-md shadow-sm z-10">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm">{className}</h4>
                            <span className="text-xs opacity-80">{players.length} spelers</span>
                          </div>
                        </div>
                        
                        {/* Players in this class - All info on one line */}
                        {players.map((player) => {
                          const selected = isPlayerSelected(player.user_id)
                          const canAdd = canAddPlayer(player)
                          const isReserveCandidate = player.cost <= 100
                          const isSelectedAsReserve = reservePlayer?.user_id === player.user_id
                          // Keep reserve candidates visible even if team is full
                          const shouldBeVisible = canAdd || (isReserveCandidate && !reservePlayer) || isSelectedAsReserve

                          return (
                            <div
                              key={player.user_id}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded border transition-all ${
                                selected
                                  ? 'bg-green-50 border-green-300'
                                  : isSelectedAsReserve
                                  ? 'bg-blue-50 border-blue-300'
                                  : shouldBeVisible
                                  ? `${classColors} hover:shadow-sm`
                                  : 'bg-gray-50 border-gray-200 opacity-50'
                              }`}
                            >
                              {/* Player Info - All on one line */}
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

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {selected ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removePlayer(player.user_id)}
                                    className="h-7 px-2 border-red-200 text-red-600 hover:bg-red-50"
                                    title="Verwijder uit team"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                ) : isSelectedAsReserve ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                      Reserve
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setReservePlayer(null)}
                                      className="h-7 px-2 border-red-200 text-red-600 hover:bg-red-50"
                                      title="Verwijder reservespeler"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => addPlayer(player)}
                                      disabled={!canAdd}
                                      className="h-7 px-2 bg-mainAccent hover:bg-mainAccentDark disabled:opacity-50"
                                      title="Voeg toe aan team"
                                    >
                                      <Plus className="h-3.5 w-3.5 mr-1" />
                                      <span className="text-xs">Team</span>
                                    </Button>
                                    {isReserveCandidate && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setAsReserve(player)}
                                        className="h-7 px-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                                        title="Stel in als reservespeler (max 100 pts)"
                                      >
                                        <UserPlus className="h-3.5 w-3.5 mr-1" />
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
                    )
                  })
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
                  <p className="text-sm mt-2">Selecteer {MAX_PLAYERS} spelers</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5 mb-3">
                    {selectedPlayers.map((player, index) => (
                      <div
                        key={player.user_id}
                        className="flex items-center justify-between p-2 bg-mainAccent/10 border border-mainAccent/30 rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="bg-mainAccent text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="font-medium text-sm text-gray-800 truncate flex-shrink-0 min-w-[120px]">
                            {player.voornaam} {player.achternaam}
                          </div>
                          {player.class_name && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-white/80 text-mainAccent border border-mainAccent/30 flex-shrink-0">
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
                          className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Reserve Speler Section */}
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="mb-2 bg-blue-50 rounded-lg p-2 border border-blue-200">
                      <h4 className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                        <UserPlus className="h-4 w-4 text-blue-700" />
                        Reservespeler (max 100 pts)
                      </h4>
                    </div>

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

                  <Button
                    onClick={handleSaveTeam}
                    className="w-full bg-mainAccent hover:bg-mainAccentDark mt-4"
                    disabled={remainingBudget < 0}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isCreatingNew ? 'Team Aanmaken' : 'Wijzigingen Opslaan'}
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
          </>
          )}
          </div>
        )}
      </div>
    </div>
  )
}

// My Teams Overview Component (after deadline)
function MyTeamsOverview({ myTeams }: { myTeams: MegaschaakTeam[] }) {
  const [expandedTeamId, setExpandedTeamId] = React.useState<number | null>(null)
  
  const { data: expandedTeamDetails } = useSWR<any>(
    expandedTeamId ? `megaschaak/team/${expandedTeamId}/details` : null,
    async () => {
      if (!expandedTeamId) return null
      const response = await axios.get(`/megaschaak/team/${expandedTeamId}/details`)
      return response.data
    },
    { revalidateOnFocus: false }
  )

  return (
    <div className="space-y-6">
     

      {/* Teams Grid */}
      <div className="space-y-4">
        {myTeams.map(team => (
          <div key={team.team_id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div 
              onClick={() => setExpandedTeamId(expandedTeamId === team.team_id ? null : team.team_id)}
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div>
                <h3 className="font-bold text-lg text-gray-800">{team.team_name}</h3>
                <p className="text-sm text-gray-600">{team.players.length} spelers</p>
              </div>
              <Button size="sm" variant="outline" className="border-mainAccent text-mainAccent">
                {expandedTeamId === team.team_id ? 'Inklappen' : 'Bekijk Details'}
              </Button>
            </div>
            
            {expandedTeamId === team.team_id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                {expandedTeamDetails ? (
                  <TeamDetailView teamDetails={expandedTeamDetails} />
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Cross Table View Component
function CrossTableView({ data, isLoading }: { data: any, isLoading: boolean }) {
  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mainAccent mx-auto mb-4"></div>
          <p className="text-gray-600">Kruistabel laden...</p>
        </div>
      </div>
    )
  }

  if (!data.teams || data.teams.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Table2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Nog geen teams</h3>
        <p className="text-gray-500">Er zijn nog geen teams aangemaakt voor dit toernooi.</p>
      </div>
    )
  }

  const { teams, players } = data

  // Group players by class for headers
  const playersByClass = players.reduce((acc: any, player: any) => {
    const className = player.className || 'Hoofdtoernooi'
    if (!acc[className]) {
      acc[className] = []
    }
    acc[className].push(player)
    return acc
  }, {})

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

  // Sort the class entries
  const sortedClassEntries = Object.entries(playersByClass).sort(([classA], [classB]) => {
    const aIndex = classOrder.indexOf(classA)
    const bIndex = classOrder.indexOf(classB)
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return classA.localeCompare(classB)
  })

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Table2 className="h-5 w-5" />
          Kruistabel Megaschaak
        </h2>
        <p className="text-xs text-white/80 mt-1">
          {teams.length} teams • {players.length} spelers
        </p>
      </div>

      <div className="p-3 overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            {/* Class headers */}
            <tr>
              <th className="sticky left-0 z-20 bg-white border-b-2 border-mainAccent"></th>
              {sortedClassEntries.map(([className, classPlayers]: [string, any], classIdx: number) => (
                <th 
                  key={className}
                  colSpan={(classPlayers as any[]).length}
                  className={`px-2 py-1.5 text-center bg-mainAccent/10 border-b-2 border-mainAccent text-mainAccent font-bold text-xs ${
                    classIdx > 0 ? 'border-l-4 border-l-mainAccent' : ''
                  }`}
                >
                  {className}
                </th>
              ))}
              <th className="px-2 py-1.5 text-center bg-mainAccent/20 border-b-2 border-mainAccent font-bold text-mainAccent border-l-4 border-l-mainAccent">
                Totaal
              </th>
            </tr>
            {/* Player headers */}
            <tr className="bg-gray-50">
              <th className="sticky left-0 z-20 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700 border-r-2 border-gray-300">
                Team
              </th>
              {players.map((player: any, playerIdx: number) => {
                // Check if this is the first player of a new class
                const isFirstInClass = playerIdx === 0 || players[playerIdx - 1].className !== player.className
                return (
                  <th 
                    key={player.user_id}
                    className={`px-1.5 py-2 text-center font-medium text-gray-700 border-r border-gray-200 min-w-[70px] ${
                      isFirstInClass ? 'border-l-4 border-l-mainAccent' : ''
                    }`}
                  >
                    <div className="text-[10px] leading-tight">
                      {player.voornaam.substring(0, 1)}. {player.achternaam}
                    </div>
                    <div className="text-[9px] text-gray-500">
                      {player.schaakrating_elo}
                    </div>
                  </th>
                )
              })}
              <th className="px-2 py-2 text-center font-semibold text-gray-700 bg-gray-100 border-l-4 border-l-mainAccent">
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team: any, idx: number) => (
              <tr 
                key={team.team_id}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td 
                  className="sticky left-0 z-10 px-3 py-2 font-semibold text-gray-800 border-r-2 border-gray-300 text-xs whitespace-nowrap"
                  style={{ backgroundColor: idx % 2 === 0 ? 'white' : 'rgb(249, 250, 251)' }}
                >
                  {team.team_name}
                </td>
                {team.playerScores.map((ps: any, playerIdx: number) => {
                  const score = ps.score
                  // Check if this is the first player of a new class
                  const isFirstInClass = playerIdx === 0 || 
                    players[playerIdx - 1].className !== players[playerIdx].className
                  
                  return (
                    <td 
                      key={ps.player_id}
                      className={`px-1.5 py-2 text-center border-r border-gray-200 ${
                        isFirstInClass ? 'border-l-4 border-l-mainAccent' : ''
                      }`}
                    >
                      {ps.inTeam ? (
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                          score === null || score === 0 ? 'bg-red-100 text-red-800' :
                          score >= 1 ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {score !== null ? score.toFixed(1) : '0.0'}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                  )
                })}
                <td className="px-2 py-2 text-center font-bold text-mainAccent bg-mainAccent/5 border-l-4 border-l-mainAccent">
                  {team.totalScore.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Standings View Component
function StandingsView({ standings, isLoading }: { standings: any[], isLoading: boolean }) {
  const [expandedTeamId, setExpandedTeamId] = React.useState<number | null>(null)
  
  const { data: expandedTeamDetails } = useSWR<any>(
    expandedTeamId ? `megaschaak/team/${expandedTeamId}/details` : null,
    async () => {
      if (!expandedTeamId) return null
      const response = await axios.get(`/megaschaak/team/${expandedTeamId}/details`)
      return response.data
    },
    { revalidateOnFocus: false }
  )
  if (isLoading) {
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
    <div className="space-y-4">
      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Klassement
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {standings.map((team, index) => (
            <div key={team.team_id}>
              <div
                onClick={() => setExpandedTeamId(expandedTeamId === team.team_id ? null : team.team_id)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    {index === 0 ? (
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                        <Medal className="h-6 w-6 text-white" />
                      </div>
                    ) : index === 1 ? (
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center shadow-lg">
                        <Medal className="h-6 w-6 text-white" />
                      </div>
                    ) : index === 2 ? (
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                        <Medal className="h-6 w-6 text-white" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600 text-lg">
                        {index + 1}
                      </div>
                    )}
                  </div>

                  {/* Team Info */}
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-mainAccent transition-colors truncate">
                      {team.team_name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {team.user.voornaam} {team.user.achternaam}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {team.players.length} spelers
                    </p>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-mainAccent">
                        {team.totalScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">punten</div>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-all ${
                      expandedTeamId === team.team_id 
                        ? 'rotate-90 text-mainAccent' 
                        : 'text-gray-400 group-hover:text-mainAccent'
                    }`} />
                  </div>
                </div>
              </div>

              {/* Expanded Team Details */}
              {expandedTeamId === team.team_id && (
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  {expandedTeamDetails ? (
                    <TeamDetailView teamDetails={expandedTeamDetails} />
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Team Detail View Component
function TeamDetailView({ teamDetails }: { teamDetails: any }) {
  const rounds = teamDetails.rounds || []
  
  return (
    <div className="space-y-6">
      {/* Team Summary */}
      <div className="bg-mainAccent/10 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-mainAccent">
              {teamDetails.players.length}
            </div>
            <div className="text-sm text-gray-600">Spelers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-mainAccent">
              {rounds.length}
            </div>
            <div className="text-sm text-gray-600">Rondes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-mainAccent">
              {teamDetails.players.reduce((sum: number, p: any) => sum + p.totalScore, 0).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Totaal Punten</div>
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10">
                Speler
              </th>
              {rounds.map((round: number) => (
                <th key={round} className="px-3 py-3 text-center text-sm font-semibold text-gray-700">
                  R{round}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-sm font-semibold text-mainAccent bg-mainAccent/10">
                Totaal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teamDetails.players
              .sort((a: any, b: any) => b.totalScore - a.totalScore)
              .map((playerData: any, idx: number) => (
                <tr key={playerData.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800 sticky left-0 z-10" 
                      style={{ backgroundColor: idx % 2 === 0 ? 'white' : 'rgb(249, 250, 251)' }}>
                    {playerData.player.voornaam} {playerData.player.achternaam}
                    <div className="text-xs text-gray-500">
                      Rating: {playerData.player.schaakrating_elo}
                    </div>
                  </td>
                  {rounds.map((round: number) => {
                    const roundScore = playerData.roundScores?.find((rs: any) => rs.ronde_nummer === round)
                    const score = roundScore?.score ?? null
                    return (
                      <td key={round} className="px-3 py-3 text-center text-sm">
                        <span className={`inline-block px-2 py-1 rounded ${
                          score === 1 ? 'bg-green-100 text-green-800 font-semibold' :
                          score === 0.5 ? 'bg-yellow-100 text-yellow-800' :
                          score === 0 ? 'bg-red-100 text-red-800' :
                          'bg-gray-50 text-gray-400'
                        }`}>
                          {score !== null ? score.toFixed(1) : '-'}
                        </span>
                      </td>
                    )
                  })}
                  <td className="px-4 py-3 text-center bg-mainAccent/5">
                    <span className="text-lg font-bold text-mainAccent">
                      {playerData.totalScore.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr className="bg-mainAccent/10 font-bold">
              <td className="px-4 py-3 text-sm text-gray-800 sticky left-0 bg-mainAccent/10 z-10">
                Team Totaal
              </td>
              {rounds.map((round: number) => {
                const roundTotal = teamDetails.players.reduce((sum: number, p: any) => {
                  const roundScore = p.roundScores?.find((rs: any) => rs.ronde_nummer === round)
                  return sum + (roundScore?.score || 0)
                }, 0)
                return (
                  <td key={round} className="px-3 py-3 text-center text-sm text-gray-800">
                    {roundTotal.toFixed(1)}
                  </td>
                )
              })}
              <td className="px-4 py-3 text-center bg-mainAccent/20">
                <span className="text-xl font-bold text-mainAccent">
                  {teamDetails.players.reduce((sum: number, p: any) => sum + p.totalScore, 0).toFixed(1)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// Popular Players View Component
function PopularPlayersView({ players, isLoading }: { players: any[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Spelers laden...</p>
        </div>
      </div>
    )
  }

  if (!players || players.length === 0) {
    return (
      <div className="text-center py-8">
        <Star className="h-12 w-12 text-gray-300 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Geen Data Beschikbaar</h3>
        <p className="text-sm text-gray-500">Er zijn nog geen teams aangemaakt voor dit toernooi.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Star className="h-4 w-4" />
          Populairste Spelers
        </h2>
        <p className="text-xs text-white/80">Meest geselecteerd in teams</p>
      </div>

      <div className="divide-y divide-gray-100">
        {players.map((player, index) => (
          <div
            key={player.user_id}
            className="px-3 py-2 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div className="flex-shrink-0 w-8 text-center">
                <div className="text-lg font-bold text-gray-600">
                  {index + 1}
                </div>
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-800 truncate">
                  {player.voornaam} {player.achternaam}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-600">
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                    {player.className}
                  </span>
                  <span>Elo: {player.schaakrating_elo}</span>
                  <span className="font-semibold text-mainAccent">
                    {player.cost}pt
                  </span>
                </div>
              </div>

              {/* Selection Count */}
              <div className="text-right flex-shrink-0">
                <div className="text-xl font-bold text-mainAccent">
                  {player.selectionCount}
                </div>
                <div className="text-[10px] text-gray-500">
                  {player.selectionCount === 1 ? 'team' : 'teams'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Value Players View Component
function ValuePlayersView({ players, isLoading }: { players: any[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Spelers laden...</p>
        </div>
      </div>
    )
  }

  if (!players || players.length === 0) {
    return (
      <div className="text-center py-8">
        <Zap className="h-12 w-12 text-gray-300 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Geen Data Beschikbaar</h3>
        <p className="text-sm text-gray-500">Er zijn nog geen wedstrijden gespeeld in dit toernooi.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 py-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Beste Waarde Spelers
        </h2>
        <p className="text-xs text-white/80">Meeste punten per budget punt</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">
                #
              </th>
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">
                Speler
              </th>
              <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase">
                Klasse
              </th>
              <th className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-600 uppercase">
                Elo
              </th>
              <th className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-600 uppercase">
                Kost
              </th>
              <th className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-600 uppercase">
                Punten
              </th>
              <th className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-600 uppercase">
                Games
              </th>
              <th className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-600 bg-mainAccent/10 relative">
                <div className="flex items-center justify-center gap-1">
                  <span>Ratio</span>
                  <div className="relative group">
                    <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
                    <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-[100] pointer-events-none">
                      <div className="bg-white border border-gray-200 text-gray-700 text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                        <p className="font-medium text-mainAccent">Behaalde punten / kost</p>
                        <div className="absolute bottom-full right-4 mb-px">
                          <div className="border-[6px] border-transparent border-b-white"></div>
                          <div className="absolute bottom-0 right-0 border-[6px] border-transparent border-b-gray-200" style={{ marginBottom: '1px' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {players.map((player, index) => (
              <tr key={player.user_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-2 py-1.5">
                  <div className="text-sm font-bold text-gray-600">
                    {index + 1}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <div className="font-semibold text-gray-800">
                    {player.voornaam} {player.achternaam}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                    {player.className}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-center text-gray-600">
                  {player.schaakrating_elo}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span className="font-semibold text-gray-800">
                    {player.cost}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <span className="font-semibold text-mainAccent">
                    {player.totalScore.toFixed(1)}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-center text-gray-600">
                  {player.gamesPlayed}
                </td>
                <td className="px-2 py-1.5 text-center bg-mainAccent/5">
                  <span className="text-sm font-bold text-mainAccent">
                    {player.valueRatio.toFixed(3)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


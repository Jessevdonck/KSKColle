"use client"

import { useState } from "react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { getAll, deleteById } from "../../api/index"
import type { Toernooi, MegaschaakTeam } from "@/data/types"
import { Trophy, Users, Trash2, Eye, Calendar, CheckCircle, Swords, Clock, Settings, User, X, Calculator, Plus } from "lucide-react"
import MegaschaakConfigForm from "./components/MegaschaakConfigForm"
import CloseTournamentDialog from "./components/CloseTournamentDialog"
import AdminCreateTeamDialog from "./components/AdminCreateTeamDialog"
import { axios } from "../../api/index"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"

interface TournamentListProps {
  onSelectTournament: (tournament: Toernooi) => void
}

export default function TournamentList({ onSelectTournament }: TournamentListProps) {
  const { toast } = useToast()
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [selectedTournamentForClose, setSelectedTournamentForClose] = useState<{ id: number; name: string; ratingEnabled: boolean } | null>(null)
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false)
  const [selectedTournamentForDeadline, setSelectedTournamentForDeadline] = useState<{ ids: number[], name: string, currentDeadline: string | null } | null>(null)
  const [deadlineValue, setDeadlineValue] = useState("")
  const [teamsDialogOpen, setTeamsDialogOpen] = useState(false)
  const [selectedTournamentForTeams, setSelectedTournamentForTeams] = useState<{ ids: number[], name: string } | null>(null)
  const [teamSearchQuery, setTeamSearchQuery] = useState("")
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [selectedTournamentForConfig, setSelectedTournamentForConfig] = useState<{ id: number, name: string } | null>(null)
  const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState(false)
  const [selectedTournamentForCreateTeam, setSelectedTournamentForCreateTeam] = useState<Toernooi | null>(null)
  
  // Haal alleen actieve toernooien op (finished = false)
  const { data: tournaments, error, mutate } = useSWR<Toernooi[]>(
    "tournament?active=true", 
    () => getAll("tournament", { active: "true" })
  )

  // Fetch teams for selected tournaments (all classes combined)
  const { data: megaschaakTeams = [], mutate: mutateTeams } = useSWR<MegaschaakTeam[]>(
    selectedTournamentForTeams ? `/megaschaak-teams-${selectedTournamentForTeams.ids.join('-')}` : null,
    async () => {
      if (!selectedTournamentForTeams) return []
      
      // Fetch teams for all tournament IDs (all classes)
      const allTeamsPromises = selectedTournamentForTeams.ids.map(id =>
        axios.get(`/megaschaak/tournament/${id}/all-teams`).then(res => res.data.items)
      )
      
      const allTeamsArrays = await Promise.all(allTeamsPromises)
      // Flatten and deduplicate teams by team_id
      const allTeams = allTeamsArrays.flat()
      const uniqueTeams = Array.from(
        new Map(allTeams.map(team => [team.team_id, team])).values()
      )
      
      return uniqueTeams
    }
  )
  const { trigger: deleteTournament, isMutating: isDeleting } = useSWRMutation(
    "tournament",
    deleteById,
    { revalidate: false }
  )

  const { trigger: closeTournament, isMutating: isClosing } = useSWRMutation(
    "tournament?active=true",
    async (url, { arg }: { arg: { id: number; updateRatings: boolean } }) => {
      const { data } = await axios.post(
        `/tournament/${arg.id}/close`,
        { updateRatings: arg.updateRatings }
      );
      return data;
    },
    { revalidate: false }
  )

  // Filter teams based on search query (must be before early returns)
  const filteredTeams = React.useMemo(() => {
    if (!teamSearchQuery.trim()) return megaschaakTeams
    
    const query = teamSearchQuery.toLowerCase()
    return megaschaakTeams.filter(team => {
      const userName = `${team.user.voornaam} ${team.user.achternaam}`.toLowerCase()
      const email = team.user.email?.toLowerCase() || ""
      const teamName = team.team_name.toLowerCase()
      
      return userName.includes(query) || email.includes(query) || teamName.includes(query)
    })
  }, [megaschaakTeams, teamSearchQuery])

  // Groepeer toernooien op naam (must be before early returns)
  const groupedTournaments = React.useMemo(() => {
    if (!tournaments) return []
    
    const groups = new Map<string, Toernooi[]>()
    
    tournaments.forEach(tournament => {
      const groupKey = tournament.naam
      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      groups.get(groupKey)!.push(tournament)
    })
    
    // Define class order for sorting
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

    return Array.from(groups.entries()).map(([name, tournaments]) => ({
      name,
      tournaments: tournaments.sort((a, b) => {
        // Sorteer op class_name als die bestaat
        if (!a.class_name && !b.class_name) return 0
        if (!a.class_name) return 1
        if (!b.class_name) return -1
        
        // Use class order for sorting
        const aIndex = classOrder.indexOf(a.class_name)
        const bIndex = classOrder.indexOf(b.class_name)
        
        // If both are in the order list, use their index
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
        
        // If only one is in the list, prioritize it
        if (aIndex !== -1) return -1
        if (bIndex !== -1) return 1
        
        // If neither is in the list, use alphabetical
        return a.class_name.localeCompare(b.class_name)
      })
    }))
  }, [tournaments])

  // Define handleDeleteTeam before early returns
  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    if (!confirm(`Weet je zeker dat je het team "${teamName}" wilt verwijderen?`)) return

    try {
      await axios.delete(`/megaschaak/admin/team/${teamId}`)
      toast({
        title: "Success",
        description: `Team "${teamName}" verwijderd!`
      })
      mutateTeams()
    } catch (err) {
      console.error("Fout met team verwijderen:", err)
      toast({
        title: "Error",
        description: "Kon team niet verwijderen.",
        variant: "destructive"
      })
    }
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-red-700 mb-1">Fout bij laden van toernooien</h3>
        <p className="text-red-600">Probeer de pagina opnieuw te laden.</p>
      </div>
    )
  }

  if (!tournaments) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainAccent mx-auto mb-4"></div>
        <p className="text-gray-600">Toernooien worden geladen...</p>
      </div>
    )
  }

  const handleDelete = async (tournamentId: number) => {
    // Vraag om bevestiging
    const confirmed = window.confirm("Weet je zeker dat je dit toernooi wilt verwijderen?")
    if (!confirmed) return

    // Optimistische update: direct uit lijst
    const previous = tournaments
    const updated = tournaments.filter((t) => t.tournament_id !== tournamentId)
    mutate(updated, false)

    try {
      await deleteTournament(tournamentId)
      toast({ title: "Success", description: "Toernooi succesvol verwijderd!" })
      // geen extra mutate()
    } catch (err) {
      console.error("Fout met toernooi te verwijderen:", err)
      // Rollback bij fout
      mutate(previous, false)
      toast({ title: "Error", description: "Kon toernooi niet verwijderen.", variant: "destructive" })
    }
  }

  const handleClose = (tournamentId: number, tournamentName: string, ratingEnabled: boolean) => {
    setSelectedTournamentForClose({ id: tournamentId, name: tournamentName, ratingEnabled })
    setCloseDialogOpen(true)
  }

  const handleConfirmClose = async (updateRatings: boolean) => {
    if (!selectedTournamentForClose) return

    try {
      const result = await closeTournament({ 
        id: selectedTournamentForClose.id, 
        updateRatings 
      })
      
      toast({ 
        title: "Success", 
        description: result.message || `Toernooi "${selectedTournamentForClose.name}" is afgesloten!` 
      })
      
      // Refresh de lijst om de status te updaten
      mutate()
      setCloseDialogOpen(false)
      setSelectedTournamentForClose(null)
    } catch (err) {
      console.error("Fout met toernooi af te sluiten:", err)
      toast({ 
        title: "Error", 
        description: "Kon toernooi niet afsluiten.", 
        variant: "destructive" 
      })
    }
  }

  const handleToggleMegaschaak = async (tournamentIds: number[], currentState: boolean) => {
    try {
      // Toggle megaschaak for all classes of this tournament
      await Promise.all(
        tournamentIds.map(id => 
          axios.patch(`/megaschaak/tournament/${id}/toggle`, {
            enabled: !currentState
          })
        )
      )
      
      toast({ 
        title: "Success", 
        description: `Megaschaak ${!currentState ? 'ingeschakeld' : 'uitgeschakeld'} voor alle klasses!` 
      })
      
      // Refresh de lijst
      mutate()
    } catch (err) {
      console.error("Fout met megaschaak toggle:", err)
      toast({ 
        title: "Error", 
        description: "Kon megaschaak status niet wijzigen.", 
        variant: "destructive" 
      })
    }
  }

  const handleOpenDeadlineDialog = (tournamentIds: number[], tournamentName: string, currentDeadline: string | null) => {
    setSelectedTournamentForDeadline({ ids: tournamentIds, name: tournamentName, currentDeadline })
    setDeadlineValue(currentDeadline || "")
    setDeadlineDialogOpen(true)
  }

  const handleSaveDeadline = async () => {
    if (!selectedTournamentForDeadline) return

    try {
      // Set deadline for all classes
      await Promise.all(
        selectedTournamentForDeadline.ids.map(id =>
          axios.patch(`/megaschaak/tournament/${id}/deadline`, {
            deadline: deadlineValue || null
          })
        )
      )

      toast({
        title: "Success",
        description: deadlineValue 
          ? "Deadline ingesteld voor alle klasses!" 
          : "Deadline verwijderd voor alle klasses!"
      })

      mutate()
      setDeadlineDialogOpen(false)
      setSelectedTournamentForDeadline(null)
    } catch (err) {
      console.error("Fout met deadline instellen:", err)
      toast({
        title: "Error",
        description: "Kon deadline niet instellen.",
        variant: "destructive"
      })
    }
  }

  const handleOpenTeamsDialog = (tournamentIds: number[], tournamentName: string) => {
    setSelectedTournamentForTeams({ ids: tournamentIds, name: tournamentName })
    setTeamSearchQuery("") // Reset search when opening
    setTeamsDialogOpen(true)
  }

  return (
    <>
      <CloseTournamentDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        tournamentName={selectedTournamentForClose?.name || ""}
        onConfirm={handleConfirmClose}
        isLoading={isClosing}
        ratingEnabled={selectedTournamentForClose?.ratingEnabled ?? true}
      />

      {/* Deadline Dialog */}
      <Dialog open={deadlineDialogOpen} onOpenChange={setDeadlineDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Megaschaak Inschrijvingsdeadline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Stel de deadline in voor het samenstellen van teams voor <strong>{selectedTournamentForDeadline?.name}</strong>.
                Na deze datum kunnen leden hun team niet meer wijzigen.
              </p>
              <Label htmlFor="deadline">Deadline (datum en tijd)</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadlineValue}
                onChange={(e) => setDeadlineValue(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Laat leeg om geen deadline in te stellen (altijd bewerkbaar)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeadlineDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSaveDeadline} className="bg-mainAccent hover:bg-mainAccentDark">
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-4 sm:px-6 py-3 sm:py-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
            Actieve Toernooien
          </h2>
          <p className="text-white/80 mt-1 text-sm sm:text-base">
            {groupedTournaments.length} {groupedTournaments.length === 1 ? 'toernooi' : 'toernooien'} 
            ({tournaments.length} totaal met klasses)
          </p>
        </div>

      <div className="p-4 sm:p-6">
        {tournaments.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-mainAccent/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-10 w-10 text-mainAccent" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Geen toernooien gevonden</h3>
            <p className="text-gray-500">Maak een nieuw toernooi aan om te beginnen.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" data-cy="tournament">
            {groupedTournaments.map((group) => (
              <div
                key={group.name}
                className="border border-neutral-200 rounded-lg p-4 sm:p-6 hover:border-mainAccent/30 hover:shadow-md transition-all duration-200"
              >
                {/* Hoofdtitel */}
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-base sm:text-lg font-semibold text-textColor mb-1 sm:mb-2 truncate" data-cy="tournament_name">
                      {group.name}
                    </h3>
                    {group.tournaments.length > 1 && (
                      <p className="text-xs text-gray-500 mb-2 sm:mb-3">
                        {group.tournaments.length} klasses
                      </p>
                    )}
                  </div>
                  <div className="bg-mainAccent/10 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-mainAccent" />
                  </div>
                </div>

                {/* Klasses */}
                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                  {group.tournaments.map((t) => (
                    <div
                      key={t.tournament_id}
                      className="border-l-2 border-mainAccent/30 pl-2 sm:pl-3 py-1"
                    >
                      {t.class_name && (
                        <p className="text-xs sm:text-sm font-medium text-mainAccent mb-1">
                          {t.class_name}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{t.rondes} rondes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{t.participations.length} spelers</span>
                        </div>
                      </div>
                      
                      {/* Action buttons per klasse */}
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                        <Button
                          onClick={() => onSelectTournament(t)}
                          size="sm"
                          className="h-7 sm:h-8 text-xs bg-mainAccent hover:bg-mainAccentDark flex-1 sm:flex-initial min-w-[80px]"
                          data-cy="tournament_manage_button"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          <span className="hidden xs:inline">Beheer</span>
                          <span className="xs:hidden">Beheer</span>
                        </Button>
                        {!t.finished && (
                          <Button
                            onClick={() => handleClose(t.tournament_id, `${t.naam}${t.class_name ? ` (${t.class_name})` : ''}`, t.rating_enabled)}
                            size="sm"
                            variant="outline"
                            className="h-7 sm:h-8 text-xs border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
                            disabled={isClosing}
                            data-cy="tournament_close_button"
                            title="Sluit toernooi"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDelete(t.tournament_id)}
                          size="sm"
                          variant="outline"
                          className="h-7 sm:h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          disabled={isDeleting}
                          data-cy="tournament_delete_button"
                          title="Verwijder toernooi"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Megaschaak Toggle - Once per tournament group */}
                <div className="border-t border-neutral-200 pt-3 mt-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Swords className={`h-4 w-4 flex-shrink-0 ${group.tournaments.some(t => t.megaschaak_enabled) ? 'text-mainAccent' : 'text-gray-400'}`} />
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Megaschaak</span>
                      {group.tournaments.some(t => t.megaschaak_enabled) && (
                        <span className="px-2 py-0.5 bg-mainAccent/10 text-mainAccent rounded-full text-xs font-medium">
                          Actief
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => handleToggleMegaschaak(
                        group.tournaments.map(t => t.tournament_id),
                        group.tournaments.some(t => t.megaschaak_enabled)
                      )}
                      size="sm"
                      variant="outline"
                      className={`h-8 text-xs whitespace-nowrap ${
                        group.tournaments.some(t => t.megaschaak_enabled)
                          ? 'border-mainAccent/30 text-mainAccent hover:bg-mainAccent/10 hover:border-mainAccent' 
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                      title={group.tournaments.some(t => t.megaschaak_enabled) ? 'Megaschaak uitschakelen voor alle klasses' : 'Megaschaak inschakelen voor alle klasses'}
                    >
                      {group.tournaments.some(t => t.megaschaak_enabled) ? 'Uitschakelen' : 'Inschakelen'}
                    </Button>
                  </div>
                  
                  {/* Deadline Section */}
                  {group.tournaments.some(t => t.megaschaak_enabled) && (
                    <div className="bg-gray-50 rounded-lg p-2 mt-2">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Clock className="h-3 w-3 text-gray-600 flex-shrink-0" />
                          <span className="text-xs text-gray-700">
                            Deadline: {
                              group.tournaments[0].megaschaak_deadline 
                                ? format(new Date(group.tournaments[0].megaschaak_deadline), "dd/MM/yyyy HH:mm")
                                : "Geen deadline"
                            }
                          </span>
                          <Button
                            onClick={() => handleOpenDeadlineDialog(
                              group.tournaments.map(t => t.tournament_id),
                              group.name,
                              group.tournaments[0].megaschaak_deadline || null
                            )}
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs text-mainAccent hover:bg-mainAccent/10 whitespace-nowrap"
                          >
                            Wijzig
                          </Button>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <Button
                            onClick={() => {
                              setSelectedTournamentForConfig({ 
                                id: group.tournaments[0].tournament_id, 
                                name: group.name 
                              })
                              setConfigDialogOpen(true)
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs text-mainAccent hover:bg-mainAccent/10 whitespace-nowrap"
                            title="Formule configuratie bewerken"
                          >
                            <Calculator className="h-3 w-3 mr-1" />
                            Formule
                          </Button>
                          <Button
                            onClick={() => handleOpenTeamsDialog(
                              group.tournaments.map(t => t.tournament_id),
                              group.name
                            )}
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs text-blue-600 hover:bg-blue-50 whitespace-nowrap"
                            title="Bekijk en beheer teams"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Teams
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teams Management Dialog */}
      <Dialog open={teamsDialogOpen} onOpenChange={setTeamsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Megaschaak Teams - {selectedTournamentForTeams?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Create Team Button */}
            {selectedTournamentForTeams && tournaments && (
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    const tournament = tournaments.find(t => selectedTournamentForTeams.ids.includes(t.tournament_id))
                    if (tournament) {
                      setSelectedTournamentForCreateTeam(tournament)
                      setCreateTeamDialogOpen(true)
                    }
                  }}
                  className="bg-mainAccent hover:bg-mainAccentDark"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Team Aanmaken voor Gebruiker
                </Button>
              </div>
            )}
            {megaschaakTeams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nog geen teams aangemaakt voor dit toernooi</p>
              </div>
            ) : (
              <>
                {/* Search Bar */}
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Zoek op team naam, gebruiker of email..."
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <Eye className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {teamSearchQuery && (
                    <button
                      onClick={() => setTeamSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Results count */}
                <div className="text-sm text-gray-600">
                  {filteredTeams.length} {filteredTeams.length === 1 ? 'team' : 'teams'} 
                  {teamSearchQuery && ` gevonden voor "${teamSearchQuery}"`}
                </div>

                {/* Teams List */}
                {filteredTeams.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Geen teams gevonden voor &quot;{teamSearchQuery}&quot;</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTeams.map((team) => (
                  <div
                    key={team.team_id}
                    className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{team.team_name}</h3>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap">
                            {team.players.length} spelers
                          </span>
                          {team.reserve_player && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium whitespace-nowrap">
                              + Reserve
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="break-words">
                              {team.user.voornaam} {team.user.achternaam}
                              {team.user.email && (
                                <span className="hidden sm:inline"> ({team.user.email})</span>
                              )}
                            </span>
                          </div>
                          {team.user.email && (
                            <div className="sm:hidden text-xs text-gray-500 mt-1 ml-5 truncate">
                              {team.user.email}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                          {team.players.map((tp) => (
                            <div
                              key={tp.id}
                              className="text-xs bg-gray-50 rounded p-2"
                            >
                              <div className="font-medium truncate">
                                {tp.player.voornaam} {tp.player.achternaam}
                              </div>
                              <div className="text-gray-500 text-[10px] sm:text-xs">
                                {tp.player.schaakrating_elo} ELO • {tp.cost} pts
                              </div>
                            </div>
                          ))}
                        </div>
                        {team.reserve_player && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="text-xs text-gray-600 mb-1">Reservespeler:</div>
                            <div className="text-xs bg-green-50 rounded p-2 inline-block">
                              <div className="font-medium">
                                {team.reserve_player.voornaam} {team.reserve_player.achternaam}
                              </div>
                              <div className="text-gray-500">
                                {team.reserve_player.schaakrating_elo} ELO • {team.reserve_cost} pts
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => handleDeleteTeam(team.team_id, team.team_name)}
                        size="sm"
                        variant="outline"
                        className="sm:ml-4 border-red-200 text-red-600 hover:bg-red-50 self-start sm:self-auto"
                        title="Verwijder team"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setTeamsDialogOpen(false)} variant="outline">
              Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Megaschaak Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Megaschaak Formule Configuratie - {selectedTournamentForConfig?.name}</DialogTitle>
          </DialogHeader>
          {selectedTournamentForConfig && (
            <MegaschaakConfigForm
              tournamentId={selectedTournamentForConfig.id}
              tournamentName={selectedTournamentForConfig.name}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Admin Create Team Dialog */}
      {selectedTournamentForCreateTeam && (
        <AdminCreateTeamDialog
          open={createTeamDialogOpen}
          onOpenChange={setCreateTeamDialogOpen}
          tournament={selectedTournamentForCreateTeam}
          onTeamCreated={() => {
            mutateTeams()
            setCreateTeamDialogOpen(false)
            setSelectedTournamentForCreateTeam(null)
          }}
        />
      )}
    </div>
    </>
  )
}

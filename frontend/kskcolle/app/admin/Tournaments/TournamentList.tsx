"use client"

import { useState } from "react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { getAll, deleteById } from "../../api/index"
import type { Toernooi } from "@/data/types"
import { Trophy, Users, Trash2, Eye, Calendar, CheckCircle, Swords, Clock } from "lucide-react"
import CloseTournamentDialog from "./components/CloseTournamentDialog"
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
  
  // Haal alleen actieve toernooien op (finished = false)
  const { data: tournaments, error, mutate } = useSWR<Toernooi[]>(
    "tournament?active=true", 
    () => getAll("tournament", { active: "true" })
  )
  const { trigger: deleteTournament, isMutating: isDeleting } = useSWRMutation(
    "tournament",
    deleteById,
    { revalidate: false }
  )

  const { trigger: closeTournament, isMutating: isClosing } = useSWRMutation(
    "tournament?active=true",
    async (url, { arg }: { arg: { id: number; updateRatings: boolean } }) => {
      const response = await fetch(`http://localhost:9000/api/tournament/${arg.id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
        },
        body: JSON.stringify({ updateRatings: arg.updateRatings }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to close tournament');
      }
      
      return response.json();
    },
    { revalidate: false }
  )

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

  // Groepeer toernooien op naam
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
    
    return Array.from(groups.entries()).map(([name, tournaments]) => ({
      name,
      tournaments: tournaments.sort((a, b) => {
        // Sorteer op class_name als die bestaat
        if (!a.class_name && !b.class_name) return 0
        if (!a.class_name) return 1
        if (!b.class_name) return -1
        return a.class_name.localeCompare(b.class_name)
      })
    }))
  }, [tournaments])

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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Megaschaak Inschrijvingsdeadline</DialogTitle>
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
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Actieve Toernooien
          </h2>
          <p className="text-white/80 mt-1">
            {groupedTournaments.length} {groupedTournaments.length === 1 ? 'toernooi' : 'toernooien'} 
            ({tournaments.length} totaal met klasses)
          </p>
        </div>

      <div className="p-6">
        {tournaments.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-mainAccent/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-10 w-10 text-mainAccent" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Geen toernooien gevonden</h3>
            <p className="text-gray-500">Maak een nieuw toernooi aan om te beginnen.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-cy="tournament">
            {groupedTournaments.map((group) => (
              <div
                key={group.name}
                className="border border-neutral-200 rounded-lg p-6 hover:border-mainAccent/30 hover:shadow-md transition-all duration-200"
              >
                {/* Hoofdtitel */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-textColor mb-2" data-cy="tournament_name">
                      {group.name}
                    </h3>
                    {group.tournaments.length > 1 && (
                      <p className="text-xs text-gray-500 mb-3">
                        {group.tournaments.length} klasses
                      </p>
                    )}
                  </div>
                  <div className="bg-mainAccent/10 p-2 rounded-lg">
                    <Trophy className="h-5 w-5 text-mainAccent" />
                  </div>
                </div>

                {/* Klasses */}
                <div className="space-y-3 mb-4">
                  {group.tournaments.map((t) => (
                    <div
                      key={t.tournament_id}
                      className="border-l-2 border-mainAccent/30 pl-3 py-1"
                    >
                      {t.class_name && (
                        <p className="text-sm font-medium text-mainAccent mb-1">
                          {t.class_name}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-600">
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
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Button
                          onClick={() => onSelectTournament(t)}
                          size="sm"
                          className="h-7 text-xs bg-mainAccent hover:bg-mainAccentDark"
                          data-cy="tournament_manage_button"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Beheer
                        </Button>
                        {!t.finished && (
                          <Button
                            onClick={() => handleClose(t.tournament_id, `${t.naam}${t.class_name ? ` (${t.class_name})` : ''}`, t.rating_enabled)}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
                            disabled={isClosing}
                            data-cy="tournament_close_button"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDelete(t.tournament_id)}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          disabled={isDeleting}
                          data-cy="tournament_delete_button"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Megaschaak Toggle - Once per tournament group */}
                <div className="border-t border-neutral-200 pt-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Swords className={`h-4 w-4 ${group.tournaments.some(t => t.megaschaak_enabled) ? 'text-mainAccent' : 'text-gray-400'}`} />
                      <span className="text-sm font-medium text-gray-700">Megaschaak</span>
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
                      className={`h-8 text-xs ${
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
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2 mt-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-600" />
                        <span className="text-xs text-gray-700">
                          Deadline: {
                            group.tournaments[0].megaschaak_deadline 
                              ? format(new Date(group.tournaments[0].megaschaak_deadline), "dd/MM/yyyy HH:mm")
                              : "Geen deadline"
                          }
                        </span>
                      </div>
                      <Button
                        onClick={() => handleOpenDeadlineDialog(
                          group.tournaments.map(t => t.tournament_id),
                          group.name,
                          group.tournaments[0].megaschaak_deadline || null
                        )}
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs text-mainAccent hover:bg-mainAccent/10"
                      >
                        Wijzig
                      </Button>
                    </div>
                  )}
                  
                  {group.tournaments.length > 1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Geldt voor alle {group.tournaments.length} klasses
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { getAll, deleteById } from "../../api/index"
import type { Toernooi } from "@/data/types"
import { Trophy, Users, Trash2, Eye, Calendar, CheckCircle } from "lucide-react"
import CloseTournamentDialog from "./components/CloseTournamentDialog"

interface TournamentListProps {
  onSelectTournament: (tournament: Toernooi) => void
}

export default function TournamentList({ onSelectTournament }: TournamentListProps) {
  const { toast } = useToast()
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [selectedTournamentForClose, setSelectedTournamentForClose] = useState<{ id: number; name: string } | null>(null)
  
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

  const handleClose = (tournamentId: number, tournamentName: string) => {
    setSelectedTournamentForClose({ id: tournamentId, name: tournamentName })
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

  return (
    <>
      <CloseTournamentDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        tournamentName={selectedTournamentForClose?.name || ""}
        onConfirm={handleConfirmClose}
        isLoading={isClosing}
      />
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-mainAccent to-mainAccentDark px-6 py-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Actieve Toernooien
          </h2>
          <p className="text-white/80 mt-1">{tournaments.length} toernooien gevonden</p>
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
            {tournaments.map((t) => (
              <div
                key={t.tournament_id}
                className="border border-neutral-200 rounded-lg p-6 hover:border-mainAccent/30 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-textColor mb-1" data-cy="tournament_name">
                      {t.naam}
                    </h3>
                    {t.class_name && (
                      <p className="text-sm text-mainAccent font-medium mb-2">
                        {t.class_name}
                      </p>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span data-cy="tournament_round">{t.rondes} rondes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span data-cy="tournament_participation">{t.participations.length} deelnemers</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-mainAccent/10 p-2 rounded-lg">
                    <Trophy className="h-5 w-5 text-mainAccent" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => onSelectTournament(t)}
                    className="flex-1 bg-mainAccent hover:bg-mainAccentDark"
                    data-cy="tournament_manage_button"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Beheer
                  </Button>
                  {!t.finished && (
                    <Button
                      onClick={() => handleClose(t.tournament_id, t.naam)}
                      variant="outline"
                      className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
                      disabled={isClosing}
                      data-cy="tournament_close_button"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDelete(t.tournament_id)}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    disabled={isDeleting}
                    data-cy="tournament_delete_button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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

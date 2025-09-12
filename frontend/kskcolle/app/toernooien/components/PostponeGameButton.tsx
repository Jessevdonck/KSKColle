'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react'
import { postponeGame, getPostponableGames, getAvailableMakeupRounds } from '../../api/index'
import { useAuth } from '../../contexts/auth'

interface PostponeGameButtonProps {
  tournamentId: number
  tournamentName: string
  isHerfst: boolean
  participations?: Array<{
    user_id: number
  }>
  onGamePostponed?: (originalRoundNumber: number) => void
}

interface PostponableGame {
  game_id: number
  speler1: {
    user_id: number
    voornaam: string
    achternaam: string
  }
  speler2: {
    user_id: number
    voornaam: string
    achternaam: string
  } | null
  round: {
    ronde_nummer: number
    ronde_datum: string
    tournament: {
      naam: string
    }
  }
}

interface MakeupRound {
  round_id: number
  ronde_datum: string | undefined
  startuur: string
  label: string | null
}

export default function PostponeGameButton({ tournamentId, tournamentName, isHerfst, participations = [], onGamePostponed }: PostponeGameButtonProps) {
  const { user, loading: authLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [postponableGames, setPostponableGames] = useState<PostponableGame[]>([])
  const [makeupRounds, setMakeupRounds] = useState<MakeupRound[]>([])
  const [loading, setLoading] = useState(false)
  const [postponing, setPostponing] = useState<number | null>(null)
  const [selectedMakeupRound, setSelectedMakeupRound] = useState<number | null>(null)

  // Check if user is participating in the tournament
  const isParticipating = user && participations.some(participation => participation.user_id === user.user_id)

  const handleOpen = async () => {
    if (!user || authLoading) return
    
    setLoading(true)
    try {
      const [games, rounds] = await Promise.all([
        getPostponableGames(tournamentId),
        getAvailableMakeupRounds(tournamentId, isHerfst)
      ])
      
      setPostponableGames(games)
      setMakeupRounds(rounds)
      
      // Debug: log the makeup rounds data
      console.log('Makeup rounds received:', rounds)
      console.log('Makeup rounds length:', rounds.length)
      rounds.forEach((round, index) => {
        console.log(`Round ${index}:`, {
          round_id: round.round_id,
          ronde_datum: round.ronde_datum,
          startuur: round.startuur,
          label: round.label,
          type: typeof round.ronde_datum,
          full_round: round
        })
      })
      
      setIsOpen(true)
    } catch (error: any) {
      console.error('Failed to load postponable games:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Kon games niet laden'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePostpone = async (gameId: number) => {
    if (!user || authLoading) return
    
    // Voor lente toernooien moet een inhaaldag geselecteerd zijn
    if (!isHerfst && !selectedMakeupRound) {
      alert('Selecteer eerst een inhaaldag')
      return
    }
    
    setPostponing(gameId)
    try {
      const result = await postponeGame('', { 
        arg: { 
          game_id: gameId,
          makeup_round_id: !isHerfst ? selectedMakeupRound : undefined
        } 
      })
      alert(result.message)
      
      // Find the original round number of the postponed game
      const postponedGame = postponableGames.find(game => game.game_id === gameId)
      if (postponedGame && onGamePostponed) {
        onGamePostponed(postponedGame.round.ronde_nummer)
      }
      
      // Refresh the entire page to show the postponed game
      window.location.reload()
    } catch (error: any) {
      console.error('Failed to postpone game:', error)
      console.error('Error response:', error?.response?.data)
      const errorMessage = error?.response?.data?.message || error?.message || 'Kon game niet uitstellen'
      alert(`Fout bij uitstellen: ${errorMessage}`)
    } finally {
      setPostponing(null)
    }
  }

  const getOpponentName = (game: PostponableGame) => {
    if (!game.speler2) return 'BYE'
    return game.speler1.user_id === user?.user_id 
      ? `${game.speler2.voornaam} ${game.speler2.achternaam}`
      : `${game.speler1.voornaam} ${game.speler1.achternaam}`
  }

  const formatDate = (dateString: string | undefined) => {
    try {
      console.log('Formatting date:', dateString, 'Type:', typeof dateString)
      
      // Handle undefined or null dates
      if (!dateString || dateString === 'undefined' || dateString === 'null') {
        console.warn('Date string is undefined/null:', dateString)
        return 'Datum niet beschikbaar'
      }
      
      // Handle both ISO strings and other date formats
      let date: Date
      if (typeof dateString === 'string') {
        // If it's already an ISO string, use it directly
        if (dateString.includes('T') || dateString.includes('Z')) {
          date = new Date(dateString)
        } else {
          // If it's a different format, try to parse it
          date = new Date(dateString)
        }
      } else {
        date = new Date(dateString)
      }
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString)
        return 'Ongeldige datum'
      }
      
      const formatted = date.toLocaleDateString('nl-BE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      console.log('Formatted date:', formatted)
      return formatted
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', dateString)
      return 'Ongeldige datum'
    }
  }

  // Only show the button if user is authenticated, loaded, and participating in the tournament
  if (!user || authLoading || !isParticipating) return null

  return (
    <>
      <Button 
        onClick={handleOpen}
        disabled={loading || authLoading}
        variant="outline"
        className="w-full"
      >
        <Calendar className="h-4 w-4 mr-2" />
        {loading ? 'Laden...' : authLoading ? 'Authenticeren...' : 'Partij Uitstellen'}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Partij Uitstellen - {tournamentName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {postponableGames.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Geen partijen beschikbaar om uit te stellen</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Je kunt alleen ongespeelde partijen uitstellen
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Belangrijke informatie:</p>
                        <ul className="mt-1 space-y-1">
                          <li>• Je tegenstander krijgt automatisch een email notificatie</li>
                          <li>• Neem ook persoonlijk contact op met je tegenstander</li>
                          {isHerfst && <li>• Herfst: partij wordt uitgesteld naar de eerstvolgende inhaaldag</li>}
                          {!isHerfst && <li>• Lente: partij wordt uitgesteld naar een beschikbare inhaaldag</li>}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {postponableGames.map((game) => (
                      <div key={game.game_id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">
                                vs {getOpponentName(game)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>Ronde {game.round.ronde_nummer} - {formatDate(game.round.ronde_datum)}</span>
                            </div>
                          </div>
                          <Button
                            onClick={() => handlePostpone(game.game_id)}
                            disabled={postponing === game.game_id}
                            size="sm"
                            variant="outline"
                          >
                            {postponing === game.game_id ? 'Uitstellen...' : 'Uitstellen'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {makeupRounds.length > 0 && (
                    <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {isHerfst ? 'Inhaaldag:' : 'Kies inhaaldag:'}
                      </h4>
                      <div className="space-y-2">
                        {makeupRounds.map((round) => (
                          <div 
                            key={round.round_id} 
                            className={`flex items-center gap-2 text-sm p-2 rounded-lg cursor-pointer transition-colors ${
                              !isHerfst && selectedMakeupRound === round.round_id
                                ? 'bg-mainAccent text-white'
                                : 'hover:bg-gray-100'
                            }`}
                            onClick={() => !isHerfst && setSelectedMakeupRound(round.round_id)}
                          >
                            {!isHerfst && (
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                selectedMakeupRound === round.round_id
                                  ? 'bg-white border-white'
                                  : 'border-gray-400'
                              }`}>
                                {selectedMakeupRound === round.round_id && (
                                  <div className="w-2 h-2 bg-mainAccent rounded-full"></div>
                                )}
                              </div>
                            )}
                            <Badge variant={isHerfst ? "secondary" : "outline"}>
                              {round.label || 'Inhaaldag'}
                            </Badge>
                            <span className="text-gray-600">
                              {formatDate(round.ronde_datum)} om {round.startuur}
                            </span>
                          </div>
                        ))}
                      </div>
                      {!isHerfst && (
                        <p className="text-xs text-gray-500 mt-2">
                          Klik op een inhaaldag om deze te selecteren
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                >
                  Sluiten
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import useSWR, { mutate as globalMutate } from "swr"
import useSWRMutation from "swr/mutation"
import { axios } from "../../../api/index"
import { Calculator, Save, RotateCcw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface MegaschaakConfig {
  classBonusPoints: { [key: string]: number }
  roundsPerClass: { [key: string]: number }
  correctieMultiplier: number
  correctieSubtract: number
  minCost: number
  maxCost: number
}

interface MegaschaakConfigFormProps {
  tournamentId: number
  tournamentName: string
}

interface Tournament {
  tournament_id: number
  naam: string
  rondes: number
  class_name?: string | null
}

export default function MegaschaakConfigForm({ tournamentId, tournamentName }: MegaschaakConfigFormProps) {
  const { toast } = useToast()
  const [config, setConfig] = useState<MegaschaakConfig | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [tournamentClasses, setTournamentClasses] = useState<string[]>([])

  // Fetch tournament to get its class_name
  const { data: tournament } = useSWR(
    `tournament/${tournamentId}`,
    async () => {
      const { data } = await axios.get(`tournament/${tournamentId}`)
      return data
    }
  )

  // Fetch all tournaments with the same name to get all classes
  const { data: allTournaments = [] } = useSWR(
    tournament ? `tournament?active=true&name=${encodeURIComponent(tournament.naam)}` : null,
    async () => {
      const { data } = await axios.get('tournament?active=true')
      return data.items || data || []
    }
  )

  // Extract unique class names from tournaments with the same name
  useEffect(() => {
    if (tournament && allTournaments.length > 0) {
      const classes = allTournaments
        .filter((t: Tournament) => t.naam === tournament.naam && t.class_name)
        .map((t: Tournament) => t.class_name as string)
        .filter((className: string, index: number, self: string[]) => self.indexOf(className) === index)
        .sort((a: string, b: string) => {
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
          const aIndex = classOrder.indexOf(a)
          const bIndex = classOrder.indexOf(b)
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
          if (aIndex !== -1) return -1
          if (bIndex !== -1) return 1
          return a.localeCompare(b)
        })
      
      // If no classes found, use the tournament's own class_name or default
      if (classes.length === 0 && tournament.class_name) {
        setTournamentClasses([tournament.class_name])
      } else if (classes.length === 0) {
        setTournamentClasses(['Hoofdtoernooi'])
      } else {
        setTournamentClasses(classes)
      }
    }
  }, [tournament, allTournaments])

  const { data, error, mutate } = useSWR<MegaschaakConfig>(
    `megaschaak/tournament/${tournamentId}/config`,
    async () => {
      const { data } = await axios.get(`megaschaak/tournament/${tournamentId}/config`)
      return data
    }
  )

  const { trigger: updateConfig } = useSWRMutation(
    `megaschaak/tournament/${tournamentId}/config`,
    async (url, { arg }: { arg: Partial<MegaschaakConfig> }) => {
      const { data } = await axios.patch(`megaschaak/tournament/${tournamentId}/config`, arg)
      return data
    }
  )

  useEffect(() => {
    if (data) {
      setConfig(data)
    }
  }, [data])

  if (error) {
    return (
      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="text-red-500 text-center">
            <p>Fout bij laden van configuratie</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!config) {
    return (
      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-mainAccent mx-auto mb-3"></div>
            <p className="text-gray-600 text-sm">Configuratie wordt geladen...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleSave = async () => {
    if (!config) return

    setIsSaving(true)
    try {
      await updateConfig(config)
      await mutate()
      
      // Invalidate and revalidate all megaschaak player caches to refresh costs
      // Use revalidate: true to force a fresh fetch
      await globalMutate('megaschaak/players', undefined, { revalidate: true })
      
      // Also invalidate any tournament-specific caches that might have player data
      await globalMutate(
        (key) => typeof key === 'string' && (
          key.startsWith('megaschaak/tournament/') || 
          key === 'megaschaak/players'
        ),
        undefined,
        { revalidate: true }
      )
      
      // Dispatch a custom event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('megaschaak-config-updated', { 
          detail: { tournamentId } 
        }))
      }
      
      toast({
        title: "Configuratie opgeslagen",
        description: "De megaschaak formule configuratie is succesvol bijgewerkt. De spelerslijst wordt ververst.",
      })
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast({
        title: "Fout",
        description: err.response?.data?.message || "Er is een fout opgetreden bij het opslaan.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (data) {
      setConfig(data)
      toast({
        title: "Wijzigingen ongedaan gemaakt",
        description: "De configuratie is teruggezet naar de opgeslagen waarden.",
      })
    }
  }

  const updateClassBonus = (className: string, value: number) => {
    setConfig({
      ...config,
      classBonusPoints: {
        ...config.classBonusPoints,
        [className]: value
      }
    })
  }

  const updateRoundsPerClass = (className: string, value: number) => {
    setConfig({
      ...config,
      roundsPerClass: {
        ...config.roundsPerClass,
        [className]: value
      }
    })
  }

  const updateField = (field: keyof MegaschaakConfig, value: number) => {
    setConfig({
      ...config,
      [field]: value
    })
  }

  const hasChanges = JSON.stringify(config) !== JSON.stringify(data)

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-mainAccent" />
          <CardTitle>Megaschaak Formule Configuratie</CardTitle>
        </div>
        <CardDescription>
          Pas de formule parameters aan voor {tournamentName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Class Bonus Points */}
        <div>
          <Label className="text-base font-semibold mb-3 block">Bonus Punten per Klasse</Label>
          {tournamentClasses.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Klassen worden geladen...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tournamentClasses.map((className) => (
                <div key={className} className="flex items-center gap-2">
                  <Label htmlFor={`bonus-${className}`} className="w-32 text-sm">
                    {className}:
                  </Label>
                  <Input
                    id={`bonus-${className}`}
                    type="number"
                    value={config.classBonusPoints[className] || 0}
                    onChange={(e) => updateClassBonus(className, parseFloat(e.target.value) || 0)}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rounds per Class */}
        <div>
          <Label className="text-base font-semibold mb-3 block">Aantal Rondes per Klasse</Label>
          <p className="text-xs text-gray-500 mb-3">
            Het aantal rondes dat gebruikt wordt om de megaschaak kost te delen. Standaard wordt het aantal rondes van het toernooi gebruikt.
          </p>
          {tournamentClasses.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Klassen worden geladen...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tournamentClasses.map((className) => {
                // Get default rounds from tournament if available
                const tournamentForClass = allTournaments.find((t: Tournament) => t.class_name === className)
                const defaultRounds = tournamentForClass?.rondes || 10
                const currentRounds = config.roundsPerClass[className] || defaultRounds
                
                return (
                  <div key={className} className="flex items-center gap-2">
                    <Label htmlFor={`rounds-${className}`} className="w-32 text-sm">
                      {className}:
                    </Label>
                    <Input
                      id={`rounds-${className}`}
                      type="number"
                      min="1"
                      value={currentRounds}
                      onChange={(e) => updateRoundsPerClass(className, parseInt(e.target.value) || defaultRounds)}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500">
                      (standaard: {defaultRounds})
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Formula Parameters */}
        <div className="border-t pt-4">
          <Label className="text-base font-semibold mb-3 block">Formule Parameters</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="multiplier" className="text-sm">
                Correctie Multiplier
              </Label>
              <Input
                id="multiplier"
                type="number"
                step="0.1"
                value={config.correctieMultiplier}
                onChange={(e) => updateField('correctieMultiplier', parseFloat(e.target.value) || 1.5)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Standaard: 1.5 (gebruikt in: Pt(tot) × multiplier - subtract)
              </p>
            </div>

            <div>
              <Label htmlFor="subtract" className="text-sm">
                Correctie Aftrek
              </Label>
              <Input
                id="subtract"
                type="number"
                value={config.correctieSubtract}
                onChange={(e) => updateField('correctieSubtract', parseFloat(e.target.value) || 1800)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Standaard: 1800 (gebruikt in: Pt(tot) × multiplier - subtract)
              </p>
            </div>

            <div>
              <Label htmlFor="minCost" className="text-sm">
                Minimale Kosten
              </Label>
              <Input
                id="minCost"
                type="number"
                value={config.minCost}
                onChange={(e) => updateField('minCost', parseFloat(e.target.value) || 1)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimale waarde voor een speler (standaard: 1)
              </p>
            </div>

            <div>
              <Label htmlFor="maxCost" className="text-sm">
                Maximale Kosten
              </Label>
              <Input
                id="maxCost"
                type="number"
                value={config.maxCost}
                onChange={(e) => updateField('maxCost', parseFloat(e.target.value) || 200)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximale waarde voor een speler (standaard: 200)
              </p>
            </div>
          </div>
        </div>

        {/* Formula Explanation */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <Label className="text-sm font-semibold mb-2 block">Formule Uitleg</Label>
          <div className="text-xs text-gray-600 space-y-1">
            <p>1. Bonus Pt(kl) = bonus punten per klasse (zie hierboven)</p>
            <p>2. TPR = Tournament Performance Rating (berekend uit laatste Herfst/Lente competitie, indien deze niet beschikbaar is, wordt de rating van de speler gebruikt)</p>
            <p>3. Pt(ELO) = (Rating + TPR) / 2</p>
            <p>4. Pt(tot) = Bonus Pt(kl) + Pt(ELO)</p>
            <p>5. Correctie = Pt(tot) × {config.correctieMultiplier} - {config.correctieSubtract}</p>
            <p>6. Megaschaak kost = MROUND(Correctie, 10) / aantal_rondes (afgerond naar geheel getal)</p>
            <p>7. Afgerond tussen {config.minCost} en {config.maxCost}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-mainAccent text-white hover:bg-mainAccentDark"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Opslaan..." : "Opslaan"}
          </Button>
          <Button
            onClick={handleReset}
            disabled={!hasChanges}
            variant="outline"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


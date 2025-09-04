"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Palette, RotateCcw, Save } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ColorSettings {
  mainAccent: string
  mainAccentDark: string
  selectionColor: string
  selectionTextColor: string
}

const DEFAULT_COLORS: ColorSettings = {
  mainAccent: '#deb71d',
  mainAccentDark: '#d4ae17',
  selectionColor: '#deb71d',
  selectionTextColor: '#FAF7F0'
}

export default function ColorSettings() {
  const [colors, setColors] = useState<ColorSettings>(DEFAULT_COLORS)
  const [hasChanges, setHasChanges] = useState(false)

  // Load colors from localStorage on mount
  useEffect(() => {
    const savedColors = localStorage.getItem('ksk-colle-colors')
    if (savedColors) {
      try {
        const parsedColors = JSON.parse(savedColors)
        setColors(parsedColors)
        applyColors(parsedColors)
      } catch (error) {
        console.error('Error loading saved colors:', error)
      }
    }
  }, [])

  // Apply colors to CSS custom properties
  const applyColors = (colorSettings: ColorSettings) => {
    const root = document.documentElement
    root.style.setProperty('--main-accent', colorSettings.mainAccent)
    root.style.setProperty('--main-accent-dark', colorSettings.mainAccentDark)
    root.style.setProperty('--selection-color', colorSettings.selectionColor)
    root.style.setProperty('--selection-text-color', colorSettings.selectionTextColor)
  }

  // Handle color change
  const handleColorChange = (colorType: keyof ColorSettings, value: string) => {
    const newColors = { ...colors, [colorType]: value }
    setColors(newColors)
    setHasChanges(true)
    applyColors(newColors)
  }

  // Save colors to localStorage
  const saveColors = () => {
    try {
      localStorage.setItem('ksk-colle-colors', JSON.stringify(colors))
      setHasChanges(false)
      toast({
        title: "Kleuren opgeslagen",
        description: "De nieuwe kleuren zijn succesvol opgeslagen.",
      })
    } catch (error) {
      console.error('Error saving colors:', error)
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het opslaan van de kleuren.",
        variant: "destructive",
      })
    }
  }

  // Reset to default colors
  const resetColors = () => {
    setColors(DEFAULT_COLORS)
    setHasChanges(true)
    applyColors(DEFAULT_COLORS)
    toast({
      title: "Kleuren gereset",
      description: "De kleuren zijn teruggezet naar de standaardwaarden.",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-mainAccent/10 p-2 rounded-lg">
              <Palette className="h-6 w-6 text-mainAccent" />
            </div>
            <div>
              <CardTitle>Kleuren Instellingen</CardTitle>
              <CardDescription>
                Pas de hoofdkleuren van de website aan. Wijzigingen worden direct toegepast.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Accent Color */}
          <div className="space-y-3">
            <Label htmlFor="mainAccent" className="text-base font-medium">
              Hoofdkleur (Main Accent)
            </Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Input
                  id="mainAccent"
                  type="color"
                  value={colors.mainAccent}
                  onChange={(e) => handleColorChange('mainAccent', e.target.value)}
                  className="w-16 h-10 p-1 border-2 border-gray-300 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.mainAccent}
                  onChange={(e) => handleColorChange('mainAccent', e.target.value)}
                  className="font-mono text-sm"
                  placeholder="#deb71d"
                />
              </div>
              <div 
                className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: colors.mainAccent }}
                title="Voorvertoning hoofdkleur"
              />
            </div>
            <p className="text-sm text-gray-600">
              Deze kleur wordt gebruikt voor knoppen, links en accenten door de hele website.
            </p>
          </div>

          {/* Main Accent Dark Color */}
          <div className="space-y-3">
            <Label htmlFor="mainAccentDark" className="text-base font-medium">
              Donkere Hoofdkleur (Main Accent Dark)
            </Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Input
                  id="mainAccentDark"
                  type="color"
                  value={colors.mainAccentDark}
                  onChange={(e) => handleColorChange('mainAccentDark', e.target.value)}
                  className="w-16 h-10 p-1 border-2 border-gray-300 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.mainAccentDark}
                  onChange={(e) => handleColorChange('mainAccentDark', e.target.value)}
                  className="font-mono text-sm"
                  placeholder="#d4ae17"
                />
              </div>
              <div 
                className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: colors.mainAccentDark }}
                title="Voorvertoning donkere hoofdkleur"
              />
            </div>
            <p className="text-sm text-gray-600">
              Deze kleur wordt gebruikt voor hover effecten en donkere varianten van de hoofdkleur.
            </p>
          </div>

          {/* Selection Colors */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="selectionColor" className="text-base font-medium">
                Selectie Achtergrondkleur
              </Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Input
                    id="selectionColor"
                    type="color"
                    value={colors.selectionColor}
                    onChange={(e) => handleColorChange('selectionColor', e.target.value)}
                    className="w-16 h-10 p-1 border-2 border-gray-300 rounded cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={colors.selectionColor}
                    onChange={(e) => handleColorChange('selectionColor', e.target.value)}
                    className="font-mono text-sm"
                    placeholder="#deb71d"
                  />
                </div>
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                  style={{ backgroundColor: colors.selectionColor }}
                  title="Voorvertoning selectie achtergrond"
                />
              </div>
              <p className="text-sm text-gray-600">
                De achtergrondkleur wanneer tekst wordt geselecteerd.
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="selectionTextColor" className="text-base font-medium">
                Selectie Tekstkleur
              </Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Input
                    id="selectionTextColor"
                    type="color"
                    value={colors.selectionTextColor}
                    onChange={(e) => handleColorChange('selectionTextColor', e.target.value)}
                    className="w-16 h-10 p-1 border-2 border-gray-300 rounded cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={colors.selectionTextColor}
                    onChange={(e) => handleColorChange('selectionTextColor', e.target.value)}
                    className="font-mono text-sm"
                    placeholder="#FAF7F0"
                  />
                </div>
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                  style={{ backgroundColor: colors.selectionTextColor }}
                  title="Voorvertoning selectie tekst"
                />
              </div>
              <p className="text-sm text-gray-600">
                De tekstkleur wanneer tekst wordt geselecteerd.
              </p>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Voorvertoning</Label>
            <div className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button 
                    className="bg-mainAccent hover:bg-mainAccentDark text-white"
                    size="sm"
                  >
                    Voorbeeld Knop
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-mainAccent text-mainAccent hover:bg-mainAccent hover:text-white"
                    size="sm"
                  >
                    Outline Knop
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-mainAccent rounded-full"></div>
                  <span className="text-sm">Accent punt</span>
                </div>
                <div className="text-mainAccent font-medium">
                  Tekst in hoofdkleur
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Selectie voorvertoning:</p>
                  <div 
                    className="p-2 rounded text-sm font-medium"
                    style={{ 
                      backgroundColor: colors.selectionColor,
                      color: colors.selectionTextColor
                    }}
                  >
                    Selecteer deze tekst om de kleuren te zien
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={saveColors}
              disabled={!hasChanges}
              className="bg-mainAccent hover:bg-mainAccentDark text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Opslaan
            </Button>
            <Button 
              onClick={resetColors}
              variant="outline"
              className="border-mainAccent text-mainAccent hover:bg-mainAccent hover:text-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset naar Standaard
            </Button>
          </div>

          {hasChanges && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Onopgeslagen wijzigingen:</strong> Vergeet niet om je wijzigingen op te slaan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

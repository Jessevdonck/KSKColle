"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react"

interface CloseTournamentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentName: string
  onConfirm: (updateRatings: boolean) => Promise<void>
  isLoading?: boolean
  ratingEnabled?: boolean
}

export default function CloseTournamentDialog({
  open,
  onOpenChange,
  tournamentName,
  onConfirm,
  isLoading = false,
  ratingEnabled = true,
}: CloseTournamentDialogProps) {
  const [updateRatings, setUpdateRatings] = useState<"yes" | "no">("yes")

  const handleConfirm = async () => {
    // Als rating niet enabled is, altijd false sturen
    await onConfirm(ratingEnabled ? updateRatings === "yes" : false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Toernooi Afsluiten
          </DialogTitle>
          <DialogDescription>
            Je staat op het punt om het toernooi &quot;{tournamentName}&quot; af te sluiten.
            Dit kan niet ongedaan gemaakt worden.
          </DialogDescription>
        </DialogHeader>

        {ratingEnabled ? (
          <div className="py-4">
            <h4 className="text-sm font-medium mb-3">ELO Rating Verwerking</h4>
            <RadioGroup
              value={updateRatings}
              onValueChange={(value) => setUpdateRatings(value as "yes" | "no")}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-green-200 bg-green-50/50">
                <RadioGroupItem value="yes" id="with-ratings" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="with-ratings" className="cursor-pointer">
                    <div className="flex items-center gap-2 font-medium text-green-700">
                      <TrendingUp className="h-4 w-4" />
                      Met ELIO verwerking
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      De ELIO ratings van alle spelers worden bijgewerkt op basis van hun prestaties
                      in dit toernooi.
                    </p>
                  </Label>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 bg-gray-50/50">
                <RadioGroupItem value="no" id="without-ratings" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="without-ratings" className="cursor-pointer">
                    <div className="flex items-center gap-2 font-medium text-gray-700">
                      <TrendingDown className="h-4 w-4" />
                      Zonder ELIO verwerking
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Het toernooi wordt afgesloten maar de ELIO ratings blijven ongewijzigd.
                    </p>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        ) : (
          <div className="py-4">
            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50">
              <p className="text-sm text-blue-800">
                <strong>Let op:</strong> Dit toernooi heeft ELIO rating uitgeschakeld. 
                Ratings worden niet bijgewerkt bij het afsluiten.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Annuleren
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-mainAccent hover:bg-mainAccentDark"
          >
            {isLoading ? "Bezig met afsluiten..." : "Toernooi Afsluiten"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


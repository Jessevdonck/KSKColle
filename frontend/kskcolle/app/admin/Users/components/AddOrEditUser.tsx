"use client"

import { useState } from "react"
import CreateUserForm from "../../../components/CreateUserForm"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AddOrEditUserProps {
  onRefresh?: () => void
}

export default function AddOrEditUser({ onRefresh }: AddOrEditUserProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="accent">
        <UserPlus className="h-4 w-4 mr-2" />
        Nieuwe Speler Aanmaken
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-4 w-4 text-mainAccent" />
              Nieuwe Speler Toevoegen
            </DialogTitle>
          </DialogHeader>
          <CreateUserForm
            onSuccess={() => {
              setOpen(false)
              onRefresh?.()
            }}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

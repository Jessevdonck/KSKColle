"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, User, Mail, Trophy, Shield } from "lucide-react"
import useSWRMutation from "swr/mutation"
import { save } from "../../../../api/index"
import { Checkbox } from "@/components/ui/checkbox"

const validationRules = {
  voornaam: {
    required: "Voornaam is vereist!",
  },
  achternaam: {
    required: "Achternaam is vereist!",
  },
  schaakrating_elo: {
    required: "Clubrating is vereist!",
    min: { value: 100, message: "Minimale rating is 100" },
    max: { value: 5000, message: "Maximale rating is 5000" },
  },
  email: {
    required: "Email is required!",
  },
  tel_nummer: {
    required: "Telefoonnummer is required!",
  },
}

interface FormData {
  voornaam: string
  achternaam: string
  geboortedatum?: string
  schaakrating_elo: number
  fide_id?: number
  schaakrating_max?: number
  lid_sinds?: string
  email: string
  tel_nummer: string
  roles: string[]
}

const toDateInputString = (date: Date) => {
  if (date instanceof Date) {
    return date.toISOString().split("T")[0]
  }
  return date ? new Date(date).toISOString().split("T")[0] : ""
}

interface EditFormProps {
  user
  onClose: () => void
}

export default function EditForm({ user, onClose }: EditFormProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const { trigger: saveUser, isMutating } = useSWRMutation("users", save)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    getValues,
    setValue,
  } = useForm<FormData>({
    mode: "onBlur",
    defaultValues: {
      voornaam: user.voornaam,
      achternaam: user.achternaam,
      geboortedatum: toDateInputString(user.geboortedatum),
      email: user.email,
      tel_nummer: user.tel_nummer,
      lid_sinds: toDateInputString(user.lid_sinds),
      schaakrating_elo: user.schaakrating_elo,
      fide_id: user.fide_id,
      schaakrating_max: user.schaakrating_max,
      roles: user.roles || [],
    },
  })

  const onSubmit = async (values: FormData) => {
    if (!isValid) return

    const formattedValues = {
      ...values,
      id: user.user_id,
      geboortedatum: values.geboortedatum ? new Date(values.geboortedatum).toISOString() : null,
      lid_sinds: values.lid_sinds ? new Date(values.lid_sinds).toISOString() : null,
      schaakrating_elo: Number(values.schaakrating_elo),
      fide_id: values.fide_id ? Number(values.fide_id) : null,
      schaakrating_max: values.schaakrating_max ? Number(values.schaakrating_max) : null,
      roles: Array.isArray(values.roles) ? values.roles : JSON.parse(values.roles as string),
    }

    try {
      await saveUser(formattedValues, {
        onSuccess: () => {
          reset()
          setSuccessMessage("Speler correct gewijzigd")
          setTimeout(() => {
            setSuccessMessage(null)
            onClose()
          }, 2000)
        },
      })
    } catch (error) {
      console.error("Error saving user:", error)
      setSuccessMessage("Er is een fout opgetreden bij het opslaan van de speler")
    }
  }

  return (
    <div className="w-full">
      {successMessage && (
        <Alert
          className={`mb-3 ${successMessage.includes("fout") ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
        >
          <CheckCircle2 className={`h-3 w-3 ${successMessage.includes("fout") ? "text-red-600" : "text-green-600"}`} />
          <AlertTitle className={`${successMessage.includes("fout") ? "text-red-700" : "text-green-700"} text-sm`}>
            {successMessage.includes("fout") ? "Fout" : "Succes"}
          </AlertTitle>
          <AlertDescription
            className={`${successMessage.includes("fout") ? "text-red-600" : "text-green-600"} text-sm`}
          >
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Personal Information */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <User className="h-3 w-3" />
            Persoonlijke Gegevens
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="voornaam" className="text-xs font-medium text-gray-700">
                Voornaam
              </Label>
              <Input
                {...register("voornaam", validationRules.voornaam)}
                id="voornaam"
                placeholder="Voornaam"
                className="mt-1 text-sm"
              />
              {errors.voornaam && <p className="text-red-500 text-xs mt-1">{errors.voornaam.message}</p>}
            </div>
            <div>
              <Label htmlFor="achternaam" className="text-xs font-medium text-gray-700">
                Achternaam
              </Label>
              <Input
                {...register("achternaam", validationRules.achternaam)}
                id="achternaam"
                placeholder="Achternaam"
                className="mt-1 text-sm"
              />
              {errors.achternaam && <p className="text-red-500 text-xs mt-1">{errors.achternaam.message}</p>}
            </div>
            <div>
              <Label htmlFor="geboortedatum" className="text-xs font-medium text-gray-700">
                Geboortedatum
              </Label>
              <Input {...register("geboortedatum")} id="geboortedatum" type="date" className="mt-1 text-sm" />
              {errors.geboortedatum && <p className="text-red-500 text-xs mt-1">{errors.geboortedatum.message}</p>}
            </div>
            <div>
              <Label htmlFor="lid_sinds" className="text-xs font-medium text-gray-700">
                Lid Sinds
              </Label>
              <Input {...register("lid_sinds")} id="lid_sinds" type="date" className="mt-1 text-sm" />
              {errors.lid_sinds && <p className="text-red-500 text-xs mt-1">{errors.lid_sinds.message}</p>}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
          <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
            <Mail className="h-3 w-3" />
            Contactgegevens
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email" className="text-xs font-medium text-gray-700">
                Email
              </Label>
              <Input
                {...register("email", validationRules.email)}
                id="email"
                placeholder="Email"
                className="mt-1 text-sm"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="tel_nummer" className="text-xs font-medium text-gray-700">
                Telefoonnummer
              </Label>
              <Input
                {...register("tel_nummer", validationRules.tel_nummer)}
                id="tel_nummer"
                placeholder="Telefoonnummer"
                className="mt-1 text-sm"
              />
              {errors.tel_nummer && <p className="text-red-500 text-xs mt-1">{errors.tel_nummer.message}</p>}
            </div>
          </div>
        </div>

        {/* Chess Information */}
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200">
          <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <Trophy className="h-3 w-3" />
            Schaakgegevens
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="schaakrating_elo" className="text-xs font-medium text-gray-700">
                Clubrating
              </Label>
              <Input
                {...register("schaakrating_elo", {
                  ...validationRules.schaakrating_elo,
                  valueAsNumber: true,
                })}
                id="schaakrating_elo"
                type="number"
                placeholder="Clubrating"
                className="mt-1 text-sm"
              />
              {errors.schaakrating_elo && (
                <p className="text-red-500 text-xs mt-1">{errors.schaakrating_elo.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="fide_id" className="text-xs font-medium text-gray-700">
                FIDE ID
              </Label>
              <Input
                {...register("fide_id", { valueAsNumber: true })}
                id="fide_id"
                type="number"
                placeholder="FIDE ID"
                className="mt-1 text-sm"
              />
              {errors.fide_id && <p className="text-red-500 text-xs mt-1">{errors.fide_id.message}</p>}
            </div>
            <div>
              <Label htmlFor="schaakrating_max" className="text-xs font-medium text-gray-700">
                Max Rating
              </Label>
              <Input
                {...register("schaakrating_max", { valueAsNumber: true })}
                id="schaakrating_max"
                type="number"
                placeholder="Max Rating"
                className="mt-1 text-sm"
              />
              {errors.schaakrating_max && (
                <p className="text-red-500 text-xs mt-1">{errors.schaakrating_max.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Admin Rights */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="isAdmin"
              checked={watch("roles").includes("admin")}
              onCheckedChange={(checked) => {
                const currentRoles = getValues("roles")
                const updatedRoles = Array.isArray(currentRoles) ? currentRoles : JSON.parse(currentRoles as string)
                if (checked) {
                  setValue("roles", [...updatedRoles, "admin"])
                } else {
                  setValue(
                    "roles",
                    updatedRoles.filter((role) => role !== "admin"),
                  )
                }
              }}
              className="data-[state=checked]:bg-mainAccent data-[state=checked]:border-mainAccent"
            />
            <Label htmlFor="isAdmin" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Shield className="h-3 w-3" />
              Is Admin
            </Label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-2">
          <Button type="submit" disabled={isMutating} className="flex-1 bg-mainAccent hover:bg-mainAccentDark text-sm">
            {isMutating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                Wijzigen...
              </div>
            ) : (
              "Wijzig"
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="px-4 text-sm bg-transparent">
            Annuleer
          </Button>
        </div>
      </form>
    </div>
  )
}

"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { parseRoles } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, User, Mail, Trophy, Shield, Globe, MapPin, Hash, Mailbox, LandPlot, Phone } from "lucide-react"
import useSWRMutation from "swr/mutation"
import { save } from "../../../../api/index"
import { Checkbox } from "@/components/ui/checkbox"
import GeneratePasswordButton from "../../../../components/GeneratePasswordButton"

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

  adres_straat: {
    required: false,
  },
  adres_nummer: {
    required: false,
  },
  adres_postcode: {
    required: false,
  },
  adres_gemeente: {
    required: false,
  },
  adres_land: {
    required: false,
  },
}

interface FormData {
  voornaam: string
  achternaam: string
  geboortedatum?: string
  email: string
  tel_nummer: string
  vast_nummer?: string;
  schaakrating_elo: number
  fide_id?: number
  schaakrating_max?: number
  is_youth?: boolean
  lid_sinds?: string
  roles: string[]
  adres_straat?: string;      
  adres_nummer?: string;   
  adres_bus?: string;          
  adres_postcode?: string;      
  adres_gemeente?: string;       
  adres_land?: string; 
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
      vast_nummer: user.vast_nummer,
      lid_sinds: toDateInputString(user.lid_sinds),
      schaakrating_elo: user.schaakrating_elo,
      fide_id: user.fide_id,
      schaakrating_max: user.schaakrating_max,
      is_youth: user.is_youth || false,
      roles: user.roles || [],

      adres_straat: user.adres_straat ?? "",
      adres_nummer: user.adres_nummer ?? "",
      adres_bus: user.adres_bus ?? "",
      adres_postcode: user.adres_postcode ?? "",
      adres_gemeente: user.adres_gemeente ?? "",
      adres_land: user.adres_land ?? "",
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
      fide_id: values.fide_id ? Number(values.fide_id) : undefined,
      schaakrating_max: values.schaakrating_max ? Number(values.schaakrating_max) : undefined,
      vast_nummer: values.vast_nummer?.trim() || undefined,
      is_youth: values.is_youth || false,
      roles: parseRoles(values.roles),
      // Filter out empty address fields
      adres_straat: values.adres_straat?.trim() || undefined,
      adres_nummer: values.adres_nummer?.trim() || undefined,
      adres_bus: values.adres_bus?.trim() || undefined,
      adres_postcode: values.adres_postcode?.trim() || undefined,
      adres_gemeente: values.adres_gemeente?.trim() || undefined,
      adres_land: values.adres_land?.trim() || undefined,
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
    } catch (error: any) {
      console.error("Error saving user:", error)
      console.error("Error response data:", error.response?.data)
      console.error("Validation details:", error.response?.data?.details)
      console.error("Formatted values sent:", formattedValues)
      const errorMessage = error.response?.data?.details ? 
        `Validatie fout: ${JSON.stringify(error.response.data.details)}` :
        error.response?.data?.error || error.message
      setSuccessMessage(`Er is een fout opgetreden: ${errorMessage}`)
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
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200 flex flex-col gap-y-3">
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
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
        <h3 className="text-base font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Adresgegevens
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="adres_straat" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              Straat
            </Label>
            <Input
              {...register("adres_straat", validationRules.adres_straat)}
              id="adres_straat"
              placeholder="Straatnaam"
              data-cy="adres_straat"
              className="mt-1 text-sm"
            />
            {errors.adres_straat && <p className="text-red-500 text-xs mt-1">{errors.adres_straat.message}</p>}
          </div>
          <div>
            <Label htmlFor="adres_nummer" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Hash className="h-3 w-3" />
              Nummer
            </Label>
            <Input
              {...register("adres_nummer", validationRules.adres_nummer)}
              id="adres_nummer"
              placeholder="Huisnummer"
              data-cy="adres_nummer"
              className="mt-1 text-sm"
            />
            {errors.adres_nummer && <p className="text-red-500 text-xs mt-1">{errors.adres_nummer.message}</p>}
          </div>
          <div>
            <Label htmlFor="adres_bus" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Mailbox className="h-3 w-3" />
              Bus
            </Label>
            <Input
              {...register("adres_bus")}
              id="adres_bus"
              placeholder="Bus"
              data-cy="adres_bus"
              className="mt-1 text-sm"
            />
            {errors.adres_bus && <p className="text-red-500 text-xs mt-1">{errors.adres_bus.message}</p>}
          </div>
          <div>
            <Label htmlFor="adres_postcode" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Hash className="h-3 w-3" />
              Postcode
            </Label>
            <Input
              {...register("adres_postcode", validationRules.adres_postcode)}
              id="adres_postcode"
              placeholder="Postcode"
              data-cy="adres_postcode"
              className="mt-1 text-sm"
            />
            {errors.adres_postcode && <p className="text-red-500 text-xs mt-1">{errors.adres_postcode.message}</p>}
          </div>
          <div>
            <Label htmlFor="adres_gemeente" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <LandPlot className="h-3 w-3" />
              Gemeente
            </Label>
            <Input
              {...register("adres_gemeente", validationRules.adres_gemeente)}
              id="adres_gemeente"
              placeholder="Gemeente"
              data-cy="adres_gemeente"
              className="mt-1 text-sm"
            />
            {errors.adres_gemeente && <p className="text-red-500 text-xs mt-1">{errors.adres_gemeente.message}</p>}
          </div>
          <div>
            <Label htmlFor="adres_land" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Globe className="h-3 w-3" />
              Land
            </Label>
            <Input
              {...register("adres_land", validationRules.adres_land)}
              id="adres_land"
              placeholder="Land"
              data-cy="adres_land"
              className="mt-1 text-sm"
            />
            {errors.adres_land && <p className="text-red-500 text-xs mt-1">{errors.adres_land.message}</p>}
          </div>
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
                GSM
              </Label>
              <Input
                {...register("tel_nummer", validationRules.tel_nummer)}
                id="tel_nummer"
                placeholder="GSM"
                className="mt-1 text-sm"
              />
              {errors.tel_nummer && <p className="text-red-500 text-xs mt-1">{errors.tel_nummer.message}</p>}
            </div>
            <div>
            <Label htmlFor="vast_nummer" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Phone className="h-3 w-3" />
              Telefoonnummer
            </Label>
            <Input
              {...register("vast_nummer")}
              id="vast_nummer"
              placeholder="Telefoonnummer"
              data-cy="vastnr"
              className="mt-1 text-sm"
            />
            {errors.vast_nummer && <p className="text-red-500 text-xs mt-1">{errors.vast_nummer.message}</p>}
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
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="isAdmin"
                  checked={watch("roles").includes("admin")}
                  onCheckedChange={(checked) => {
                    const currentRoles = getValues("roles")
                    const updatedRoles = parseRoles(currentRoles)
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
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="isYouth"
                  checked={watch("is_youth")}
                  onCheckedChange={(checked) => {
                    setValue("is_youth", checked as boolean)
                  }}
                  className="data-[state=checked]:bg-mainAccent data-[state=checked]:border-mainAccent"
                />
                <Label htmlFor="isYouth" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Trophy className="h-3 w-3" />
                  Is Jeugdspeler
                </Label>
              </div>
            </div>
            
            {/* Password Management */}
            <div className="border-t border-purple-200 pt-4">
              <h4 className="text-sm font-medium text-purple-800 mb-3 flex items-center gap-2">
                <Shield className="h-3 w-3" />
                Wachtwoord Beheer
              </h4>
              <GeneratePasswordButton 
                userId={user.user_id} 
                userName={`${user.voornaam} ${user.achternaam}`}
                onSuccess={() => {
                  // Optioneel: toon een success message
                }}
              />
            </div>
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

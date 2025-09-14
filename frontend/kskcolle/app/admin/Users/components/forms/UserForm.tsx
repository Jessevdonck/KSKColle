"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, User, Mail, Phone, Trophy, Calendar, Shield, Key, MapPin, Hash, Building, Globe, LandPlot, Mailbox } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

const EMPTY_USER = {
  voornaam: "",
  achternaam: "",
  geboortedatum: null,
  email: "",
  tel_nummer: "",
  vast_nummer: "",
  schaakrating_elo: 0,
  fide_id: 0,
  schaakrating_max: 0,
  is_youth: false,
  lid_sinds: new Date(),
  roles: [],
  adres_straat: "",       
  adres_nummer: "" ,   
  adres_bus: "",           
  adres_postcode: "",       
  adres_gemeente: "",       
  adres_land: ""
}

const validationRules = {
  voornaam: {
    required: "Voornaam is vereist!",
  },
  achternaam: {
    required: "Achternaam is vereist!",
  },
  schaakrating_elo: {
    required: "Clubrating is vereist!",
    min: { value: 0, message: "Minimale rating is 0" },
    max: { value: 5000, message: "Maximale rating is 5000" },
  },
  email: {
    required: "Email is required!",
  },
  tel_nummer: {
    required: "Telefoonnummer is required!",
  },

  adres_straat: {
    required: "Straat is vereist!",
  },
  adres_nummer: {
    required: "Huisnummer is vereist!",
  },
  adres_postcode: {
    required: "Postcode is vereist!",
  },
  adres_gemeente: {
    required: "Gemeente is vereist!",
  },
  adres_land: {
    required: "Land is vereist!",
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
  is_youth: boolean
  lid_sinds?: string
  roles: string[]
  adres_straat: string;      
  adres_nummer: string;   
  adres_bus: string;          
  adres_postcode: string;      
  adres_gemeente: string;       
  adres_land: string; 
}

const toDateInputString = (date: Date | undefined) => {
  return date ? date.toISOString().split("T")[0] : ""
}

export default function UserForm({ user = EMPTY_USER, saveUser, isEditing = false, isMutating = false }) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    getValues,
    watch,
  } = useForm<FormData>({
    mode: "onBlur",
    defaultValues: {
      voornaam: user.voornaam,
      achternaam: user.achternaam,
      geboortedatum: user.geboortedatum ? toDateInputString(user.geboortedatum) : "",
      email: user.email || "",
      tel_nummer: user.tel_nummer,
      vast_nummer: user.vast_nummer ?? "",
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

    console.log(values)
    const formattedValues = {
      ...values,
      geboortedatum: values.geboortedatum ? new Date(values.geboortedatum).toISOString() : null,
      lid_sinds: values.lid_sinds ? new Date(values.lid_sinds).toISOString() : null,
      schaakrating_elo: Number(values.schaakrating_elo),
      fide_id: values.fide_id ? Number(values.fide_id) : null,
      schaakrating_max: values.schaakrating_max ? Number(values.schaakrating_max) : null,
      is_youth: values.is_youth,
      roles: values.roles,
    }

    await saveUser(formattedValues, {
      throwOnError: false,
      onSuccess: () => {
        reset()
        window.scrollTo(0, 0)
        setSuccessMessage(isEditing ? "Speler correct gewijzigd" : "Speler correct toegevoegd")
        setTimeout(() => setSuccessMessage(null), 5000)
      },
    })
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {successMessage && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          <AlertTitle className="text-green-700 text-sm">Succes</AlertTitle>
          <AlertDescription className="text-green-600 text-sm">{successMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Personal Information */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 flex flex-col gap-y-3">
          <h3 className="text-base font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Persoonlijke Gegevens
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="voornaam" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-3 w-3" />
                Voornaam
              </Label>
              <Input
                {...register("voornaam", validationRules.voornaam)}
                id="voornaam"
                placeholder="Voornaam"
                data-cy="voornaam"
                className="mt-1 text-sm"
              />
              {errors.voornaam && (
                <p className="text-red-500 text-xs mt-1" data-cy="error_voornaam">
                  {errors.voornaam.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="achternaam" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-3 w-3" />
                Achternaam
              </Label>
              <Input
                {...register("achternaam", validationRules.achternaam)}
                id="achternaam"
                placeholder="Achternaam"
                data-cy="achternaam"
                className="mt-1 text-sm"
              />
              {errors.achternaam && (
                <p className="text-red-500 text-xs mt-1" data-cy="error_achternaam">
                  {errors.achternaam.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="geboortedatum" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Geboortedatum
              </Label>
              <Input
                {...register("geboortedatum")}
                id="geboortedatum"
                type="date"
                placeholder="Geboortedatum"
                data-cy="birthdate"
                className="mt-1 text-sm"
              />
              {errors.geboortedatum && (
                <p className="text-red-500 text-xs mt-1" data-cy="error_birthdate">
                  {errors.geboortedatum.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="lid_sinds" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Lid Sinds
              </Label>
              <Input
                {...register("lid_sinds")}
                id="lid_sinds"
                type="date"
                placeholder="Lid Sinds"
                data-cy="startdate"
                className="mt-1 text-sm"
              />
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
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <h3 className="text-base font-semibold text-green-800 mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Contactgegevens
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="h-3 w-3" />
                Email
              </Label>
              <Input
                {...register("email", validationRules.email)}
                id="email"
                placeholder="Email"
                data-cy="email"
                className="mt-1 text-sm"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1" data-cy="error_email">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="telefoon" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="h-3 w-3" />
                GSM
              </Label>
              <Input
                {...register("tel_nummer", validationRules.tel_nummer)}
                id="telefoon"
                placeholder="Telefoon"
                data-cy="telnr"
                className="mt-1 text-sm"
              />
              {errors.tel_nummer && (
                <p className="text-red-500 text-xs mt-1" data-cy="error_telnr">
                  {errors.tel_nummer.message}
                </p>
              )}
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
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
          <h3 className="text-base font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Schaakgegevens
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="schaakrating_elo" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Trophy className="h-3 w-3" />
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
                data-cy="rating"
                className="mt-1 text-sm"
              />
              {errors.schaakrating_elo && (
                <p className="text-red-500 text-xs mt-1" data-cy="error_rating">
                  {errors.schaakrating_elo.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="fide_id" className="text-sm font-medium text-gray-700">
                FIDE ID
              </Label>
              <Input
                {...register("fide_id", { valueAsNumber: true })}
                id="fide_id"
                type="number"
                placeholder="FIDE ID"
                data-cy="fide"
                className="mt-1 text-sm"
              />
              {errors.fide_id && <p className="text-red-500 text-xs mt-1">{errors.fide_id.message}</p>}
            </div>
            <div>
              <Label htmlFor="schaakrating_max" className="text-sm font-medium text-gray-700">
                Max Rating
              </Label>
              <Input
                {...register("schaakrating_max", { valueAsNumber: true })}
                id="schaakrating_max"
                type="number"
                placeholder="Max Rating"
                data-cy="max_rating"
                className="mt-1 text-sm"
              />
              {errors.schaakrating_max && (
                <p className="text-red-500 text-xs mt-1">{errors.schaakrating_max.message}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                {...register("is_youth")}
                id="is_youth"
                data-cy="is_youth"
              />
              <Label htmlFor="is_youth" className="text-sm font-medium text-gray-700">
                Jeugdspeler
              </Label>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <h3 className="text-base font-semibold text-purple-800 mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Beveiliging & Rechten
          </h3>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-800 text-sm">
                <Key className="h-4 w-4" />
                <span className="font-medium">Wachtwoord</span>
              </div>
              <p className="text-blue-700 text-xs mt-1">
                Er wordt automatisch een veilig wachtwoord gegenereerd en naar het opgegeven emailadres gestuurd.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="isAdmin"
                  data-cy="admin"
                  checked={watch("roles").includes("admin")}
                  onCheckedChange={(checked) => {
                    const currentRoles = getValues("roles")
                    if (checked) {
                      setValue("roles", [...currentRoles, "admin"])
                    } else {
                      setValue(
                        "roles",
                        currentRoles.filter((role) => role !== "admin"),
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
                  id="isBestuurslid"
                  data-cy="bestuurslid"
                  checked={watch("roles").includes("bestuurslid")}
                  onCheckedChange={(checked) => {
                    const currentRoles = getValues("roles")
                    if (checked) {
                      setValue("roles", [...currentRoles, "bestuurslid"])
                    } else {
                      setValue(
                        "roles",
                        currentRoles.filter((role) => role !== "bestuurslid"),
                      )
                    }
                  }}
                  className="data-[state=checked]:bg-mainAccent data-[state=checked]:border-mainAccent"
                />
                <Label htmlFor="isBestuurslid" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building className="h-3 w-3" />
                  Bestuurslid
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="isExlid"
                  data-cy="exlid"
                  checked={watch("roles").includes("exlid")}
                  onCheckedChange={(checked) => {
                    const currentRoles = getValues("roles")
                    if (checked) {
                      setValue("roles", [...currentRoles, "exlid"])
                    } else {
                      setValue(
                        "roles",
                        currentRoles.filter((role) => role !== "exlid"),
                      )
                    }
                  }}
                  className="data-[state=checked]:bg-mainAccent data-[state=checked]:border-mainAccent"
                />
                <Label htmlFor="isExlid" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="h-3 w-3" />
                  Ex-lid
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isMutating}
          className="w-full bg-mainAccent hover:bg-mainAccentDark py-2"
          data-cy="submit_user"
        >
          {isMutating ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              {isEditing ? "Wijzigen..." : "Toevoegen..."}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              {isEditing ? "Wijzig" : "Voeg toe"}
            </div>
          )}
        </Button>
      </form>
    </div>
  )
}

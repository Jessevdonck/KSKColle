'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { createUserWithPassword } from '../api';
import { CreateUserRequest } from '../../data/types';
import { Calendar, UserPlus, CheckCircle, AlertCircle, User, Mail, Trophy, Shield, MapPin, Building } from 'lucide-react';

const validationRules = {
  voornaam: {
    required: 'Voornaam is vereist',
  },
  achternaam: {
    required: 'Achternaam is vereist',
  },
  email: {
    required: 'Email is vereist',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Ongeldig emailadres',
    },
  },
  geboortedatum: {
    validate: (value: string) => {
      if (!value) return true; // Optional
      const date = new Date(value);
      if (isNaN(date.getTime())) return 'Ongeldige datum';
      if (date > new Date()) return 'Geboortedatum kan niet in de toekomst liggen';
      return true;
    },
  },
  tel_nummer: {
    required: 'Telefoonnummer is vereist',
  },
  schaakrating_elo: {
    min: {
      value: 0,
      message: 'Schaakrating moet minimaal 0 zijn',
    },
  },
  fide_id: {
    validate: (value: number | undefined) => {
      if (value !== undefined && value !== null && value < 1) {
        return 'FIDE ID moet minimaal 1 zijn als ingevuld';
      }
      return true;
    },
  },
};

interface CreateUserFormProps {
  onSuccess?: (userId: number) => void;
  onClose: () => void;
}

export default function CreateUserForm({ onSuccess, onClose }: CreateUserFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm<CreateUserRequest>({
    defaultValues: {
      voornaam: '',
      achternaam: '',
      email: '',
      geboortedatum: '',
      tel_nummer: '',
      vast_nummer: '',
      schaakrating_elo: undefined,
      fide_id: undefined,
      is_admin: false,
      is_youth: false,
      lid_sinds: new Date().toISOString().split('T')[0],
      adres_straat: '',
      adres_nummer: '',
      adres_bus: '',
      adres_postcode: '',
      adres_gemeente: '',
      adres_land: 'Belgium',
      roles: [],
    },
  });

  const handleSubmitForm = async (data: CreateUserRequest) => {
    setLoading(true);
    setError(null);

    try {
      // Clean up data - remove undefined values and empty strings for optional fields
      const cleanData = {
        ...data,
        schaakrating_elo: data.schaakrating_elo || undefined,
        fide_id: data.fide_id || undefined,
        vast_nummer: data.vast_nummer || undefined,
        adres_straat: data.adres_straat || undefined,
        adres_nummer: data.adres_nummer || undefined,
        adres_bus: data.adres_bus || undefined,
        adres_postcode: data.adres_postcode || undefined,
        adres_gemeente: data.adres_gemeente || undefined,
      };

      const response = await createUserWithPassword('user-management', { arg: cleanData });
      setSuccess(true);
      onSuccess?.(response.userId);
      
      // Reset form na 3 seconden
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Er is een fout opgetreden bij het aanmaken van de gebruiker.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex justify-center">
        <div className="space-y-6 w-full max-w-2xl text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8">
            <div className="bg-green-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-green-800 mb-2">Gebruiker Succesvol Aangemaakt!</h3>
            <p className="text-green-700 mb-6">
              Het wachtwoord is automatisch gegenereerd en naar het opgegeven emailadres gestuurd.
            </p>
            <Button 
              onClick={onClose} 
              variant="outline"
              className="px-6 py-2"
            >
              Sluiten
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6 w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <UserPlus className="h-8 w-8 text-mainAccent" />
            <h2 className="text-3xl font-bold text-textColor">Nieuwe Gebruiker Aanmaken</h2>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Vul de gegevens in om een nieuwe gebruiker aan te maken. Het wachtwoord wordt automatisch gegenereerd en via email verzonden.
          </p>
        </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Persoonlijke Gegevens - Eerste rij */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Persoonlijke Gegevens
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="voornaam" className="text-sm font-medium text-gray-700">Voornaam *</Label>
            <Input
              id="voornaam"
              {...register('voornaam', validationRules.voornaam)}
              data-cy="create_user_voornaam_input"
              className="text-sm"
            />
            {errors.voornaam && <p className="text-sm text-red-500">{errors.voornaam.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="achternaam" className="text-sm font-medium text-gray-700">Achternaam *</Label>
            <Input
              id="achternaam"
              {...register('achternaam', validationRules.achternaam)}
              data-cy="create_user_achternaam_input"
              className="text-sm"
            />
            {errors.achternaam && <p className="text-sm text-red-500">{errors.achternaam.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="geboortedatum" className="text-sm font-medium text-gray-700">Geboortedatum</Label>
            <Input
              id="geboortedatum"
              type="date"
              {...register('geboortedatum', validationRules.geboortedatum)}
              data-cy="create_user_geboortedatum_input"
              className="text-sm"
            />
            {errors.geboortedatum && <p className="text-sm text-red-500">{errors.geboortedatum.message}</p>}
          </div>
        </div>
      </div>

      {/* Contactgegevens - Tweede rij */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
        <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Contactgegevens
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email', validationRules.email)}
              data-cy="create_user_email_input"
              className="text-sm"
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tel_nummer" className="text-sm font-medium text-gray-700">Telefoonnummer *</Label>
            <Input
              id="tel_nummer"
              {...register('tel_nummer', validationRules.tel_nummer)}
              data-cy="create_user_tel_nummer_input"
              className="text-sm"
            />
            {errors.tel_nummer && <p className="text-sm text-red-500">{errors.tel_nummer.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vast_nummer" className="text-sm font-medium text-gray-700">Vast Nummer</Label>
            <Input
              id="vast_nummer"
              {...register('vast_nummer')}
              data-cy="create_user_vast_nummer_input"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lid_sinds" className="text-sm font-medium text-gray-700">Lid Sinds</Label>
            <Input
              id="lid_sinds"
              type="date"
              {...register('lid_sinds')}
              data-cy="create_user_lid_sinds_input"
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Schaakgegevens - Derde rij */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-6 border border-amber-200">
        <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Schaakgegevens
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="schaakrating_elo" className="text-sm font-medium text-gray-700">Schaakrating ELO</Label>
            <Input
              id="schaakrating_elo"
              type="number"
              {...register('schaakrating_elo', { 
                valueAsNumber: true, 
                ...validationRules.schaakrating_elo 
              })}
              data-cy="create_user_schaakrating_input"
              className="text-sm"
              placeholder="0"
            />
            {errors.schaakrating_elo && <p className="text-sm text-red-500">{errors.schaakrating_elo.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fide_id" className="text-sm font-medium text-gray-700">FIDE ID</Label>
            <Input
              id="fide_id"
              type="number"
              {...register('fide_id', { 
                valueAsNumber: true,
                ...validationRules.fide_id 
              })}
              data-cy="create_user_fide_id_input"
              className="text-sm"
              placeholder="Optioneel"
            />
            {errors.fide_id && <p className="text-sm text-red-500">{errors.fide_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="is_youth" className="text-sm font-medium text-gray-700">Jeugdspeler</Label>
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                id="is_youth"
                {...register('is_youth')}
                data-cy="create_user_is_youth_checkbox"
              />
              <Label htmlFor="is_youth" className="text-sm">Ja</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Account Rechten - Vierde rij */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Account Rechten
        </h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="is_admin"
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
              data-cy="create_user_is_admin_checkbox"
            />
            <Label htmlFor="is_admin" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Shield className="h-3 w-3" />
              Admin Gebruiker
            </Label>
          </div>
          
          <div className="flex items-center space-x-3">
            <Checkbox
              id="is_bestuurslid"
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
              data-cy="create_user_is_bestuurslid_checkbox"
            />
            <Label htmlFor="is_bestuurslid" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Building className="h-3 w-3" />
              Bestuurslid
            </Label>
          </div>
          
          <div className="flex items-center space-x-3">
            <Checkbox
              id="is_exlid"
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
              data-cy="create_user_is_exlid_checkbox"
            />
            <Label htmlFor="is_exlid" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <User className="h-3 w-3" />
              Ex-lid
            </Label>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          Selecteer de gewenste rollen voor deze gebruiker. Admin gebruikers hebben toegang tot alle beheerfuncties.
        </p>
      </div>

      {/* Adres Gegevens - Vijfde rij */}
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-6 border border-indigo-200">
        <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Adres Gegevens
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="adres_straat" className="text-sm font-medium text-gray-700">Straat</Label>
            <Input
              id="adres_straat"
              {...register('adres_straat')}
              data-cy="create_user_adres_straat_input"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adres_nummer" className="text-sm font-medium text-gray-700">Nummer</Label>
            <Input
              id="adres_nummer"
              {...register('adres_nummer')}
              data-cy="create_user_adres_nummer_input"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adres_bus" className="text-sm font-medium text-gray-700">Bus</Label>
            <Input
              id="adres_bus"
              {...register('adres_bus')}
              data-cy="create_user_adres_bus_input"
              className="text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="adres_postcode" className="text-sm font-medium text-gray-700">Postcode</Label>
            <Input
              id="adres_postcode"
              {...register('adres_postcode')}
              data-cy="create_user_adres_postcode_input"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adres_gemeente" className="text-sm font-medium text-gray-700">Gemeente</Label>
            <Input
              id="adres_gemeente"
              {...register('adres_gemeente')}
              data-cy="create_user_adres_gemeente_input"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adres_land" className="text-sm font-medium text-gray-700">Land</Label>
            <Input
              id="adres_land"
              {...register('adres_land')}
              data-cy="create_user_adres_land_input"
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Info Sectie */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="bg-blue-500 rounded-full p-2 flex-shrink-0">
            <UserPlus className="h-4 w-4 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Automatische Wachtwoord Generatie</h4>
            <p className="text-sm text-blue-700">
              Er wordt automatisch een veilig wachtwoord gegenereerd en naar het opgegeven emailadres gestuurd. 
              De gebruiker kan dit wachtwoord gebruiken om in te loggen en kan het later wijzigen.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-center space-x-4 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          data-cy="cancel_create_user_button"
          className="px-8 py-3 text-base"
        >
          Annuleer
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="bg-mainAccent hover:bg-mainAccentDark text-neutral-50 px-8 py-3 text-base"
          data-cy="submit_create_user_button"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Aanmaken...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Gebruiker Aanmaken</span>
            </div>
          )}
        </Button>
      </div>
    </form>
    </div>
  );
}

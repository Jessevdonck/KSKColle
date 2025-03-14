'use client'

import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2 } from 'lucide-react'
import useSWRMutation from 'swr/mutation'
import { save } from '../../../../api/index'
import { Checkbox } from "@/components/ui/checkbox"

const validationRules = {
  voornaam: {
    required: 'Voornaam is vereist!',
  },
  achternaam: {
    required: 'Achternaam is vereist!',
  },
  schaakrating_elo: {
    required: 'Clubrating is vereist!',
    min: { value: 100, message: 'Minimale rating is 100' },
    max: { value: 5000, message: 'Maximale rating is 5000' }
  },
  email: {
    required: 'Email is required!',
  },
  tel_nummer: {
    required: 'Telefoonnummer is required!',
  },
};

interface FormData {
  voornaam: string;
  achternaam: string;
  geboortedatum?: string;
  schaakrating_elo: number;
  fide_id?: number;
  schaakrating_max?: number;
  lid_sinds?: string;
  email: string;
  tel_nummer: string;
  roles: string[];
}

const toDateInputString = (date: Date) => {
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return date ? new Date(date).toISOString().split('T')[0] : '';
};

interface EditFormProps {
  user;
  onClose: () => void;
}

export default function EditForm({ user, onClose }: EditFormProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { trigger: saveUser } = useSWRMutation('users', save)

  const { register, handleSubmit, formState: { errors, isValid }, reset, watch, getValues, setValue } = useForm<FormData>({
    mode: 'onBlur',
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
      roles: user.roles || []
    }
  });

  const onSubmit = async (values: FormData) => {
    if (!isValid) return;
  
    const formattedValues = {
      ...values,
      id: user.user_id,
      geboortedatum: values.geboortedatum ? new Date(values.geboortedatum).toISOString() : null,
      lid_sinds: values.lid_sinds ? new Date(values.lid_sinds).toISOString() : null,
      schaakrating_elo: Number(values.schaakrating_elo),
      fide_id: values.fide_id ? Number(values.fide_id) : null,
      schaakrating_max: values.schaakrating_max ? Number(values.schaakrating_max) : null,
      roles: Array.isArray(values.roles) ? values.roles : JSON.parse(values.roles as string),
    };
  
    try {
      await saveUser(formattedValues, {
        onSuccess: () => {
          reset();
          setSuccessMessage("Speler correct gewijzigd");
          setTimeout(() => {
            setSuccessMessage(null);
            onClose();
          }, 2000);
        },
      });
    } catch (error) {
      console.error('Error saving user:', error);
      setSuccessMessage("Er is een fout opgetreden bij het opslaan van de speler");
    }
  };

  return (
    <form className="w-full max-w-lg" onSubmit={handleSubmit(onSubmit)}>
      {successMessage && (
        <Alert className="mb-4">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle className={successMessage.includes("fout") ? 'text-red-500' : 'text-green-500'}>
            {successMessage.includes("fout") ? 'Fout' : 'Succes'}
          </AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="voornaam" className="block text-sm font-semibold text-textColor">
            Voornaam
          </Label>
          <Input
            {...register('voornaam', validationRules.voornaam)}
            id="voornaam"
            placeholder="Voornaam"
          />
          {errors.voornaam && <p className="text-red-500 text-xs italic">{errors.voornaam.message}</p>}
        </div>

        <div>
          <Label htmlFor="achternaam" className="block text-sm font-semibold text-textColor">
            Achternaam
          </Label>
          <Input
            {...register('achternaam', validationRules.achternaam)}
            id="achternaam"
            placeholder="Achternaam"
          />
          {errors.achternaam && <p className="text-red-500 text-xs italic">{errors.achternaam.message}</p>}
        </div>

        <div>
          <Label htmlFor="geboortedatum" className="block text-sm font-semibold text-textColor">
            Geboortedatum
          </Label>
          <Input
            {...register('geboortedatum')}
            id="geboortedatum"
            type="date"
            placeholder="Geboortedatum"
          />
          {errors.geboortedatum && <p className="text-red-500 text-xs italic">{errors.geboortedatum.message}</p>}
        </div>

        <div>
          <Label htmlFor="email" className="block text-sm font-semibold text-textColor">
            Email
          </Label>
          <Input
            {...register('email', validationRules.email)}
            id="email"
            placeholder="Email"
          />
          {errors.email && <p className="text-red-500 text-xs italic">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="tel_nummer" className="block text-sm font-semibold text-textColor">
            Telefoonnummer
          </Label>
          <Input
            {...register('tel_nummer', validationRules.tel_nummer)}
            id="tel_nummer"
            placeholder="Telefoonnummer"
          />
          {errors.tel_nummer && <p className="text-red-500 text-xs italic">{errors.tel_nummer.message}</p>}
        </div>

        <div>
          <Label htmlFor="schaakrating_elo" className="block text-sm font-semibold text-textColor">
            Clubrating
          </Label>
          <Input
            {...register('schaakrating_elo', {
              ...validationRules.schaakrating_elo,
              valueAsNumber: true,
            })}
            id="schaakrating_elo"
            type="number"
            placeholder="Clubrating"
          />
          {errors.schaakrating_elo && <p className="text-red-500 text-xs italic">{errors.schaakrating_elo.message}</p>}
        </div>

        <div>
          <Label htmlFor="fide_id" className="block text-sm font-semibold text-textColor">
            FIDE ID
          </Label>
          <Input
            {...register('fide_id', { valueAsNumber: true })}
            id="fide_id"
            type="number"
            placeholder="FIDE ID"
          />
          {errors.fide_id && <p className="text-red-500 text-xs italic">{errors.fide_id.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="schaakrating_max" className="block text-sm font-semibold text-textColor">
            Max Rating
          </Label>
          <Input
            {...register('schaakrating_max', { valueAsNumber: true })}
            id="schaakrating_max"
            type="number"
            placeholder="Max Rating"
          />
          {errors.schaakrating_max && <p className="text-red-500 text-xs italic">{errors.schaakrating_max.message}</p>}
        </div>

        <div>
          <Label htmlFor="lid_sinds" className="block text-sm font-semibold text-textColor">
            Lid Sinds
          </Label>
          <Input
            {...register('lid_sinds')}
            id="lid_sinds"
            type="date"
            placeholder="Lid Sinds"
          />
          {errors.lid_sinds && <p className="text-red-500 text-xs italic">{errors.lid_sinds.message}</p>}
        </div>
      </div>
      <div className="flex items-center space-x-2 mb-4">
        <Checkbox 
          id="isAdmin" 
          checked={watch('roles').includes('admin')}
          onCheckedChange={(checked) => {
            const currentRoles = getValues('roles');
            const updatedRoles = Array.isArray(currentRoles) ? currentRoles : JSON.parse(currentRoles as string);
            if (checked) {
              setValue('roles', [...updatedRoles, 'admin']);
            } else {
              setValue('roles', updatedRoles.filter(role => role !== 'admin'));
            }
          }}
        />
        <Label htmlFor="isAdmin" className="text-sm font-semibold text-textColor">
          Is Admin
        </Label>
      </div>
      <Button type="submit" className="bg-mainAccent text-white hover:bg-mainAccentDark">
        Wijzig
      </Button>
    </form>
  );
}


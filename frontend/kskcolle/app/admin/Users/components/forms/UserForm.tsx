import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2 } from 'lucide-react'
import { Checkbox } from "@/components/ui/checkbox"

const EMPTY_USER = {
  voornaam: "",
  achternaam: "",
  geboortedatum: new Date(),
  email:"",
  tel_nummer:"",
  schaakrating_elo: 0,
  fide_id: 0,
  schaakrating_max: 0,
  lid_sinds: new Date(),
  roles: [],
};

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
  password: {
    required: false, // Make password optional
  },
};

interface FormData {
  voornaam: string;
  achternaam: string;
  geboortedatum?: string;
  email: string;
  tel_nummer: string;
  schaakrating_elo: number;
  fide_id?: number;
  schaakrating_max?: number;
  lid_sinds?: string;
  password: string;
  roles: string[];
}

const toDateInputString = (date: Date | undefined) => {
  return date ? date.toISOString().split('T')[0] : '';
};

export default function UserForm({ user = EMPTY_USER, saveUser, isEditing = false }) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isValid }, reset, setValue, getValues, watch } = useForm<FormData>({
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
      roles: user.roles || [],
    }
  });

  const onSubmit = async (values: FormData) => {
    if (!isValid) return;

    console.log(values);

    const formattedValues = {
      ...values,
      geboortedatum: values.geboortedatum ? new Date(values.geboortedatum).toISOString() : null,
      lid_sinds: values.lid_sinds ? new Date(values.lid_sinds).toISOString() : null,
      schaakrating_elo: Number(values.schaakrating_elo),
      fide_id: values.fide_id ? Number(values.fide_id) : null,
      schaakrating_max: values.schaakrating_max ? Number(values.schaakrating_max) : null,
      roles: values.roles,
    };

    await saveUser(formattedValues,
      {
        throwOnError: false,
        onSuccess: () => {
          reset();
          window.scrollTo(0, 0);
          setSuccessMessage(isEditing ? "Speler correct gewijzigd" : "Speler correct toegevoegd");
          setTimeout(() => setSuccessMessage(null), 5000); 
        },
      }
    );
  };

  return (
    <form className="w-full max-w-lg flex flex-col" onSubmit={handleSubmit(onSubmit)}>
      {successMessage && (
        <Alert className="mb-4">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle className='text-green-500'>Succes</AlertTitle>
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
          <Label htmlFor="password" className="block text-sm font-semibold text-textColor">
            Wachtwoord
          </Label>
          <Input
            {...register('password', validationRules.password)}
            id="password"
            type="password"
            placeholder="Wachtwoord"
          />
          {errors.password && <p className="text-red-500 text-xs italic">{errors.password.message}</p>}
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
          <Label htmlFor="telefoon" className="block text-sm font-semibold text-textColor">
            Telefoon Nummer
          </Label>
          <Input
            {...register('tel_nummer', validationRules.tel_nummer)}
            id="telefoon"
            placeholder="Telefoon"
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
            if (checked) {
              setValue('roles', [...currentRoles, 'admin']);
            } else {
              setValue('roles', currentRoles.filter(role => role !== 'admin'));
            }
          }}
        />
        <Label htmlFor="isAdmin" className="text-sm font-semibold text-textColor">
          Is Admin
        </Label>
      </div>
      <Button type="submit" className="bg-mainAccent text-white hover:bg-mainAccentDark">
        {isEditing ? "Wijzig" : "Voeg toe"}
      </Button>
    </form>
  );
}


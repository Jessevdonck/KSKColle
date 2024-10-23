import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMPTY_USER = {
  voornaam: "",
  achternaam: "",
  geboortedatum: new Date(),
  schaakrating_elo: 0,
  fide_id: 0,
  nationaal_id: 0,
  schaakrating_max: 0,
  lid_sinds: new Date(),
};

const validationRules = {
  naam: {
    required: 'Voornaam is verplicht!',
  },
  schaakrating_elo: {
    required: 'Clubrating is verplicht!',
    min: { value: 100, message: 'Minimale rating is 100' },
    max: { value: 3000, message: 'Maximale rating is 3000' }
  }
};

interface FormData {
  voornaam: string;
  achternaam: string;
  geboortedatum?: string;
  schaakrating_elo: number;
  fide_id?: number;
  nationaal_id?: number;
  schaakrating_max?: number;
  lid_sinds?: string;
}

const toDateInputString = (date: Date | undefined) => {
  return date ? date.toISOString().split('T')[0] : '';
};

export default function UserForm({ saveUser }: { saveUser: (data: FormData) => Promise<void> }) {
  const user = EMPTY_USER;

  const { register, handleSubmit, formState: { errors, isValid }, reset } = useForm<FormData>({
    mode: 'onBlur',
    defaultValues: {
      geboortedatum: toDateInputString(user.geboortedatum),
      lid_sinds: toDateInputString(user.lid_sinds),
      schaakrating_elo: user.schaakrating_elo,
      fide_id: user.fide_id,
      nationaal_id: user.nationaal_id,
      schaakrating_max: user.schaakrating_max,
    }
  });

  const onSubmit = async (values: FormData) => {
    if (!isValid) return;

    const formattedValues = {
      ...values,
      geboortedatum: values.geboortedatum ? new Date(values.geboortedatum).toISOString() : null,
      lid_sinds: values.lid_sinds ? new Date(values.lid_sinds).toISOString() : null,
      schaakrating_elo: Number(values.schaakrating_elo),
      fide_id: values.fide_id ? Number(values.fide_id) : null,
      nationaal_id: values.nationaal_id ? Number(values.nationaal_id) : null,
      schaakrating_max: values.schaakrating_max ? Number(values.schaakrating_max) : null,
    };

    await saveUser(formattedValues);
    reset();
  };

  return (
    <form className="w-full max-w-lg" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="voornaam" className="block text-sm font-semibold text-textColor">
            Voornaam
          </Label>
          <Input
            {...register('voornaam', validationRules.naam)}
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
            {...register('achternaam', validationRules.naam)}
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
          <Label htmlFor="nationaal_id" className="block text-sm font-semibold text-textColor">
            Nationaal ID
          </Label>
          <Input
            {...register('nationaal_id', { valueAsNumber: true })}
            id="nationaal_id"
            type="number"
            placeholder="Nationaal ID"
          />
          {errors.nationaal_id && <p className="text-red-500 text-xs italic">{errors.nationaal_id.message}</p>}
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
      
      <Button type="submit" className="bg-mainAccent text-white hover:bg-mainAccentDark">
        Voeg toe
      </Button>
    </form>
  );
}
import React from 'react'
import { useForm } from 'react-hook-form'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User } from '@/data/types'

interface EditUserFormProps {
  user: User
  onSubmit: (data: User) => void
}

export default function EditForm({ user, onSubmit }: EditUserFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<User>({
    defaultValues: user
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">Edit User</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="voornaam" className="block text-sm font-semibold text-textColor">
            Voornaam
          </label>
          <Input
            id="voornaam"
            {...register('voornaam', { required: 'Voornaam is required' })}
          />
          {errors.voornaam && <p className="text-red-500 text-xs italic">{errors.voornaam.message}</p>}
        </div>

        <div>
          <label htmlFor="achternaam" className="block text-sm font-semibold text-textColor">
            Achternaam
          </label>
          <Input
            id="achternaam"
            {...register('achternaam', { required: 'Achternaam is required' })}
          />
          {errors.achternaam && <p className="text-red-500 text-xs italic">{errors.achternaam.message}</p>}
        </div>

        <div>
          <label htmlFor="geboortedatum" className="block text-sm font-semibold text-textColor">
            Geboortedatum
          </label>
          <Input
            id="geboortedatum"
            type="date"
            {...register('geboortedatum', { required: 'Geboortedatum is required' })}
          />
          {errors.geboortedatum && <p className="text-red-500 text-xs italic">{errors.geboortedatum.message}</p>}
        </div>

        <div>
          <label htmlFor="schaakrating_elo" className="block text-sm font-semibold text-textColor">
            Clubrating
          </label>
          <Input
            id="schaakrating_elo"
            type="number"
            {...register('schaakrating_elo', { 
              required: 'Clubrating is required',
              min: { value: 100, message: 'Minimum rating is 100' },
              max: { value: 3000, message: 'Maximum rating is 3000' }
            })}
          />
          {errors.schaakrating_elo && <p className="text-red-500 text-xs italic">{errors.schaakrating_elo.message}</p>}
        </div>

        <div>
          <label htmlFor="fide_id" className="block text-sm font-semibold text-textColor">
            FIDE ID
          </label>
          <Input
            id="fide_id"
            type="number"
            {...register('fide_id')}
          />
        </div>

        <div>
          <label htmlFor="schaakrating_max" className="block text-sm font-semibold text-textColor">
            Max Rating
          </label>
          <Input
            id="schaakrating_max"
            type="number"
            {...register('schaakrating_max')}
          />
        </div>

        <div>
          <label htmlFor="nationaal_id" className="block text-sm font-semibold text-textColor">
            Nationaal ID
          </label>
          <Input
            id="nationaal_id"
            type="number"
            {...register('nationaal_id')}
          />
        </div>

        <div>
          <label htmlFor="lid_sinds" className="block text-sm font-semibold text-textColor">
            Lid Sinds
          </label>
          <Input
            id="lid_sinds"
            type="date"
            {...register('lid_sinds')}
          />
        </div>
      </div>

      <Button type="submit" className="bg-mainAccent text-white hover:bg-mainAccentDark">
        Update User
      </Button>
    </form>
  )
}
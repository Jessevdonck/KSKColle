'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from "../../contexts/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle } from 'lucide-react'
import { updatePassword } from '../../api'
import useSWRMutation from 'swr/mutation'

interface PasswordChangeFormData {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export default function PasswordChangeForm() {
  const { user } = useAuth()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { trigger: changePassword } = useSWRMutation('users', updatePassword)

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<PasswordChangeFormData>({
    mode: 'onBlur'
  })

  const onSubmit = async (data: PasswordChangeFormData) => {
    if (data.newPassword !== data.confirmNewPassword) {
      setErrorMessage("Nieuwe wachtwoorden komen niet overeen")
      return
    }

    try {
      await changePassword({
        userId: user.user_id,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      })
      setSuccessMessage("Wachtwoord succesvol gewijzigd")
      reset()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setErrorMessage(error)
      setTimeout(() => setErrorMessage(null), 3000)
    }
  }

  return (
    <form className="w-full max-w-lg" onSubmit={handleSubmit(onSubmit)}>
      {successMessage && (
        <Alert className="mb-4">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Succes</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert className="mb-4" variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Fout</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-4">
        <div>
          <Label htmlFor="currentPassword">Huidig wachtwoord</Label>
          <Input
            {...register('currentPassword', { required: 'Huidig wachtwoord is vereist' })}
            id="currentPassword"
            type="password"
          />
          {errors.currentPassword && <p className="text-red-500 text-xs italic">{errors.currentPassword.message}</p>}
        </div>
        <div>
          <Label htmlFor="newPassword">Nieuw wachtwoord</Label>
          <Input
            {...register('newPassword', { 
              required: 'Nieuw wachtwoord is vereist',
              minLength: { value: 8, message: 'Wachtwoord moet minimaal 8 karakters lang zijn' }
            })}
            id="newPassword"
            type="password"
          />
          {errors.newPassword && <p className="text-red-500 text-xs italic">{errors.newPassword.message}</p>}
        </div>
        <div>
          <Label htmlFor="confirmNewPassword">Bevestig nieuw wachtwoord</Label>
          <Input
            {...register('confirmNewPassword', { 
              required: 'Bevestig nieuw wachtwoord is vereist',
              validate: (val: string) => {
                if (watch('newPassword') != val) {
                  return "Wachtwoorden komen niet overeen";
                }
              }
            })}
            id="confirmNewPassword"
            type="password"
          />
          {errors.confirmNewPassword && <p className="text-red-500 text-xs italic">{errors.confirmNewPassword.message}</p>}
        </div>
      </div>
      <Button type="submit" className="mt-4 bg-mainAccent text-white hover:bg-mainAccentDark">
        Wijzig wachtwoord
      </Button>
    </form>
  )
}


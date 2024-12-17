'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from "../../contexts/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, KeyRound } from 'lucide-react'
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
    <div className="flex justify-center items-center min-h-[calc(100vh-64px)] bg-neutral-50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <KeyRound className="w-6 h-6" />
              Wachtwoord wijzigen
            </CardTitle>
            <CardDescription>
              Vul onderstaand formulier in om uw wachtwoord te wijzigen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Huidig wachtwoord</Label>
                <Input
                  {...register('currentPassword', { required: 'Huidig wachtwoord is vereist' })}
                  id="currentPassword"
                  type="password"
                  className="w-full"
                />
                {errors.currentPassword && <p className="text-red-500 text-xs italic mt-1">{errors.currentPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nieuw wachtwoord</Label>
                <Input
                  {...register('newPassword', {
                    required: 'Nieuw wachtwoord is vereist',
                    minLength: { value: 8, message: 'Wachtwoord moet minimaal 8 karakters lang zijn' }
                  })}
                  id="newPassword"
                  type="password"
                  className="w-full"
                />
                {errors.newPassword && <p className="text-red-500 text-xs italic mt-1">{errors.newPassword.message}</p>}
              </div>
              <div className="space-y-2">
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
                  className="w-full"
                />
                {errors.confirmNewPassword && <p className="text-red-500 text-xs italic mt-1">{errors.confirmNewPassword.message}</p>}
              </div>
              <Button type="submit" className="w-full bg-mainAccent text-white hover:bg-mainAccentDark">
                Wijzig wachtwoord
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


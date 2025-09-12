'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resetPassword, validateResetToken } from '../api';

const validationRules = {
  newPassword: {
    required: 'Nieuw wachtwoord is vereist',
    minLength: {
      value: 8,
      message: 'Wachtwoord moet minimaal 8 karakters lang zijn',
    },
  },
  confirmPassword: {
    required: 'Bevestig wachtwoord is vereist',
    validate: (value: string, formValues: any) => {
      return value.trim() === formValues.newPassword.trim() || 'Wachtwoorden komen niet overeen';
    },
  },
};

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!token) {
      setError('Geen reset token gevonden');
      setValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await validateResetToken('password-reset', { arg: token });
        setTokenValid(response.valid);
        if (!response.valid) {
          setError('Deze reset link is ongeldig of verlopen');
        }
      } catch (error: any) {
        setError('Kon de reset link niet valideren');
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmitForm = async (data: { newPassword: string; confirmPassword: string }) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    // Trim trailing spaces from passwords
    const trimmedNewPassword = data.newPassword.trim();
    const trimmedConfirmPassword = data.confirmPassword.trim();

    try {
      await resetPassword('password-reset', { 
        arg: { token, newPassword: trimmedNewPassword } 
      });
      setSuccess(true);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Er is een fout opgetreden. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/');
  };

  if (validating) {
    return (
      <div className="space-y-4 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-textColor">Valideren...</h2>
        <p className="text-sm text-gray-600">
          We valideren uw reset link...
        </p>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="space-y-4 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-textColor">Ongeldige Link</h2>
        <Alert variant="destructive">
          <AlertDescription>
            {error || 'Deze reset link is ongeldig of verlopen. Vraag een nieuwe reset link aan.'}
          </AlertDescription>
        </Alert>
        <div className="flex justify-end">
          <Button 
            className='bg-mainAccent hover:bg-mainAccentDark text-neutral-50' 
            onClick={handleBackToLogin}
          >
            Terug naar Login
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-4 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-textColor">Wachtwoord Gereset</h2>
        <Alert>
          <AlertDescription>
            Uw wachtwoord is succesvol gereset. U kunt nu inloggen met uw nieuwe wachtwoord.
          </AlertDescription>
        </Alert>
        <div className="flex justify-end">
          <Button 
            className='bg-mainAccent hover:bg-mainAccentDark text-neutral-50' 
            onClick={handleBackToLogin}
          >
            Ga naar Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4 w-full max-w-sm">
      <h2 className="text-2xl font-bold text-textColor">Nieuw Wachtwoord Instellen</h2>
      
      <p className="text-sm text-gray-600">
        Voer uw nieuwe wachtwoord in om uw account te herstellen.
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2 text-textColor">
        <Label htmlFor="newPassword">Nieuw Wachtwoord</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="Minimaal 8 karakters"
          data-cy="reset_password_new_password_input"
          {...register('newPassword', validationRules.newPassword)}
        />
        {errors.newPassword && <p className="text-sm text-red-500">{errors.newPassword.message}</p>}
      </div>

      <div className="space-y-2 text-textColor">
        <Label htmlFor="confirmPassword">Bevestig Wachtwoord</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Herhaal uw wachtwoord"
          data-cy="reset_password_confirm_password_input"
          {...register('confirmPassword', validationRules.confirmPassword)}
        />
        {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          className='text-textColor bg-neutral-50 hover:bg-mainAccent hover:text-neutral-50' 
          type="button" 
          onClick={handleBackToLogin}
          data-cy="cancel_reset_password_button"
        >
          Annuleer
        </Button>
        <Button 
          className='bg-mainAccent hover:bg-mainAccentDark text-neutral-50' 
          type="submit" 
          disabled={loading}
          data-cy="submit_reset_password_button"
        >
          {loading ? 'Resetten...' : 'Wachtwoord Resetten'}
        </Button>
      </div>
    </form>
  );
}

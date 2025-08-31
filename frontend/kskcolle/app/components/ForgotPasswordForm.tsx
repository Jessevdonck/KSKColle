'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requestPasswordReset } from '../api';

const validationRules = {
  email: {
    required: 'Email is vereist',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Ongeldig emailadres',
    },
  },
};

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onClose: () => void;
  onBackToLogin: () => void;
}

export default function ForgotPasswordForm({ onSuccess, onClose, onBackToLogin }: ForgotPasswordFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
    },
  });

  const handleSubmitForm = async (data: { email: string }) => {
    setLoading(true);
    setError(null);

    try {
      await requestPasswordReset('password-reset', { arg: { email: data.email } });
      setSuccess(true);
      onSuccess?.();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Er is een fout opgetreden. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setSuccess(false);
    setError(null);
    onBackToLogin();
  };

  if (success) {
    return (
      <div className="space-y-4 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-textColor">Email Verzonden</h2>
        <Alert>
          <AlertDescription>
            Als het emailadres bestaat in onze database, ontvangt u een email met instructies om uw wachtwoord te resetten.
          </AlertDescription>
        </Alert>
        <div className="flex justify-end space-x-2">
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

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4 w-full max-w-sm">
      <h2 className="text-2xl font-bold text-textColor">Wachtwoord Vergeten</h2>
      
      <p className="text-sm text-gray-600">
        Voer uw emailadres in en wij sturen u een link om uw wachtwoord te resetten.
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2 text-textColor">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          data-cy="forgot_password_email_input"
          {...register('email', validationRules.email)}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          className='text-textColor bg-neutral-50 hover:bg-mainAccent hover:text-neutral-50' 
          type="button" 
          onClick={onClose}
          data-cy="cancel-forgot-password-button"
        >
          Annuleer
        </Button>
        <Button 
          className='bg-mainAccent hover:bg-mainAccentDark text-neutral-50' 
          type="submit" 
          disabled={loading}
          data-cy="submit_forgot_password_button"
        >
          {loading ? 'Versturen...' : 'Verstuur Reset Link'}
        </Button>
      </div>

      <div className="text-center">
        <Button 
          type="button"
          variant="link" 
          className="text-mainAccent hover:text-mainAccentDark"
          onClick={handleBackToLogin}
        >
          Terug naar Login
        </Button>
      </div>
    </form>
  );
}

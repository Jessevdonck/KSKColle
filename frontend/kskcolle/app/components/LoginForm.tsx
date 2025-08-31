'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/auth';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ForgotPasswordForm from './ForgotPasswordForm'

const validationRules = {
  email: {
    required: 'Email is vereist',
  },
  password: {
    required: 'Wachtwoord is vereist',
  },
};

interface LoginFormProps {
  onSuccess?: () => void;
  onClose: () => void;
}

export default function LoginForm({ onSuccess, onClose }: LoginFormProps) {
  const { error, loading, login } = useAuth();
  const router = useRouter();
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleCancel = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleShowForgotPassword = useCallback(() => {
    setShowForgotPassword(true);
  }, []);

  const handleBackToLogin = useCallback(() => {
    setShowForgotPassword(false);
  }, []);

  const handleLogin = useCallback(
    async ({ email, password }) => {
      const loggedIn = await login(email, password);
      if (loggedIn) {
        onSuccess?.();
        router.push('/');
      }
    },
    [login, router, onSuccess],
  );

  if (showForgotPassword) {
    return (
      <ForgotPasswordForm
        onSuccess={() => setShowForgotPassword(false)}
        onClose={onClose}
        onBackToLogin={handleBackToLogin}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(handleLogin)} className="space-y-4 w-full max-w-sm">
      <h2 className="text-2xl font-bold text-textColor">Log In</h2>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>Onjuist e-mailadres of wachtwoord. Probeer het opnieuw.</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2 text-textColor">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          data-cy="email_input"
          {...register('email', validationRules.email)}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>
      <div className="space-y-2 text-textColor">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          data-cy="password_input"
          {...register('password', validationRules.password)}
        />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        <div className="text-right">
          <Button
            type="button"
            variant="link"
            className="text-sm text-mainAccent hover:text-mainAccentDark p-0 h-auto"
            onClick={handleShowForgotPassword}
            data-cy="forgot_password_button"
          >
            Wachtwoord vergeten?
          </Button>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button className='text-textColor bg-neutral-50 hover:bg-mainAccent hover:text-neutral-50' type="button" onClick={handleCancel} data-cy="cancel-button">
          Annuleer
        </Button>
        <Button className='bg-mainAccent hover:bg-mainAccentDark text-neutral-50' type="submit" disabled={loading} data-cy="submit_button">
          Log in
        </Button>
      </div>
    </form>
  );
}


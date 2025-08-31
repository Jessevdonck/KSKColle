'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateNewPassword } from '../api';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface GeneratePasswordButtonProps {
  userId: number;
  userName: string;
  onSuccess?: () => void;
}

export default function GeneratePasswordButton({ userId, userName, onSuccess }: GeneratePasswordButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePassword = async () => {
    if (!confirm(`Weet je zeker dat je een nieuw wachtwoord wilt genereren voor ${userName}? Het huidige wachtwoord wordt vervangen.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await generateNewPassword('user-management', { arg: { userId } });
      setSuccess(true);
      onSuccess?.();
      
      // Reset success state na 3 seconden
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Er is een fout opgetreden bij het genereren van het wachtwoord.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Nieuw wachtwoord is gegenereerd en naar {userName} gestuurd via email.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleGeneratePassword}
        disabled={loading}
        variant="outline"
        size="sm"
        className="text-orange-600 border-orange-200 hover:bg-orange-50"
        data-cy={`generate-password-button-${userId}`}
      >
        {loading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Genereren...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Nieuw Wachtwoord
          </>
        )}
      </Button>
      
      {error && (
        <Alert variant="destructive" className="text-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

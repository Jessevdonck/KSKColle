import { Suspense } from 'react';
import ResetPasswordForm from '../components/ResetPasswordForm';

// Force dynamic rendering to avoid static generation issues with useSearchParams
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Wachtwoord Resetten</h1>
          <p className="mt-2 text-sm text-gray-600">
            Stel een nieuw wachtwoord in voor uw account
          </p>
        </div>
        
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Suspense fallback={
            <div className="space-y-4 w-full max-w-sm">
              <h2 className="text-2xl font-bold text-textColor">Laden...</h2>
              <p className="text-sm text-gray-600">
                We laden de reset pagina...
              </p>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

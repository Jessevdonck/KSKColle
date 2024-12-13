'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../contexts/auth';

export default function PrivateRoute({ children }) {
  const { ready, isAuthed } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !isAuthed) {
      router.replace(`/login?redirect=${router.asPath}`);
    }
  }, [ready, isAuthed, router]);

  if (!ready) {
    return (
      <div className='container'>
        <div className='row'>
          <div className='col-12'>
            <h1>Loading...</h1>
            <p>
              Please wait while we are checking your credentials and loading the
              application.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthed) {
    return children;
  }

  return null;
}
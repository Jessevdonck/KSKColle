'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth';
import LoginForm from './LoginForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ReAuthPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthed, isTokenExpired } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (isAuthed && token && isTokenExpired(token)) {
      setIsOpen(true);
    }
  }, [isAuthed, isTokenExpired]);

  const handleLoginSuccess = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session Expired</DialogTitle>
        </DialogHeader>
        <p className="mb-4">Your session has expired. Please log in again to continue.</p>
        <LoginForm onSuccess={handleLoginSuccess} />
      </DialogContent>
    </Dialog>
  );
}


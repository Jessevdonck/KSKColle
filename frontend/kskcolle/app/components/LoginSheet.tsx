'use client';

import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import LoginForm from "./LoginForm"
import { useAuth } from '../contexts/auth';

export default function LoginSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthed } = useAuth();

  const handleLoginSuccess = useCallback(() => {
    if (isAuthed) {
      setIsOpen(false);
    }
  }, [isAuthed]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="bg-mainAccent text-neutral-50 font-semibold hover:bg-mainAccentDark hover:text-neutral-50" >Inloggen</Button>
      </SheetTrigger>
      <SheetContent>
        <LoginForm onSuccess={handleLoginSuccess} />
      </SheetContent>
    </Sheet>
  );
}


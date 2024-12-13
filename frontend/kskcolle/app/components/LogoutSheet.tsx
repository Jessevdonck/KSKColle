'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from '../contexts/auth'
import { useRouter } from 'next/navigation'

export default function LogoutSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push('/');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
      <Button className="bg-mainAccent text-neutral-50 font-semibold hover:bg-mainAccentDark hover:text-neutral-50" >Uitloggen</Button>
      </SheetTrigger>
      <SheetContent>
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-bold mb-4 text-textColor">Weet je zeker dat je wil uitloggen?</h2>
          <div className="flex space-x-4">
            <Button className='text-textColor' onClick={() => setIsOpen(false)} >Annuleren</Button>
            <Button className='bg-mainAccent hover:bg-mainAccentDark text-neutral-50' onClick={handleLogout}>Uitloggen</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


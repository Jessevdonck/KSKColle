'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Lock } from 'lucide-react'
import { useAuth } from "../contexts/auth"
import { useRouter } from 'next/navigation'

export default function ProfileDropdown() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>   
          <User className="text-textColor cursor-pointer hover:text-mainAccent" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profiel bekijken</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/change-password')}>
        <Lock className="mr-2 h-4 w-4" />
        <span>Wachtwoord wijzigen</span>
      </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Uitloggen</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


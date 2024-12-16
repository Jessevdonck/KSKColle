'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, Lock } from 'lucide-react'
import { useAuth } from "../contexts/auth"
import { useRouter } from 'next/navigation'

const createUrlFriendlyName = (voornaam: string, achternaam: string) => {
  return `${voornaam.toLowerCase()}_${achternaam.toLowerCase()}`.replace(/\s+/g, '_')
}

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleViewProfile = () => {
    if (user && user.voornaam && user.achternaam) {
      const profileUrl = `/profile/${createUrlFriendlyName(user.voornaam, user.achternaam)}`;
      router.push(profileUrl);
    } else {
      console.error('User information is incomplete');
      // Fallback to a generic profile page if user info is incomplete
      router.push('/profile');
    }
  };

  const roles = user?.roles ? JSON.parse(user.roles) : [];
  const isAdmin = Array.isArray(roles) && roles.includes('admin');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>   
          <User className="text-textColor cursor-pointer hover:text-mainAccent" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem className="cursor-pointer" onClick={handleViewProfile}>
          <User className="mr-2 h-4 w-4" />
          <span>Profiel bekijken</span>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/admin')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Adminpaneel</span>
          </DropdownMenuItem>
        )}

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


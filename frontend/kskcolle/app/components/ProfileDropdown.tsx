'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, Lock, FileText, Puzzle } from 'lucide-react'
import { useAuth } from "../contexts/auth"
import { useRouter } from 'next/navigation'
import { parseRoles } from "@/lib/utils"
import { isPuzzleMaster } from "@/lib/roleUtils"
import Image from 'next/image'

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

  const roles = parseRoles(user?.roles);
  const isAdmin = roles.includes('admin');
  const isBoardMember = roles.includes('bestuurslid');
  const hasAdminAccess = isAdmin || isBoardMember;
  const isPuzzlemaster = isPuzzleMaster(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild data-cy="profile_button">   
        <div className="w-10 h-10 xl:w-8 xl:h-8 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300 hover:border-mainAccent transition-colors cursor-pointer flex-shrink-0">
          {user?.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={`${user.voornaam} ${user.achternaam}`}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="text-gray-500 xl:w-5 xl:h-5 w-6 h-6" />
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem className="cursor-pointer" onClick={handleViewProfile}>
          <User className="mr-2 h-4 w-4" />
          <span>Profiel bekijken</span>
        </DropdownMenuItem>
        {hasAdminAccess && (
          <>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/admin')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Adminpaneel</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/articles')}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Artikels beheren</span>
            </DropdownMenuItem>
          </>
        )}
        {isPuzzlemaster && !hasAdminAccess && (
          <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/admin/puzzles')}>
            <Puzzle className="mr-2 h-4 w-4" />
            <span>Puzzels aanmaken</span>
          </DropdownMenuItem>
        )}

      <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/change-password')}>
        <Lock className="mr-2 h-4 w-4" />
        <span>Wachtwoord wijzigen</span>
      </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={handleLogout} data-cy="logout_button">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Uitloggen</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


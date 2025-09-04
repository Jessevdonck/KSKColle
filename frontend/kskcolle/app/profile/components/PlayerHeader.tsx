import Image from 'next/image'
import { User } from '../../../data/types'
import { Mail, Phone, Smartphone, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import AvatarUpload from '../../components/AvatarUpload'
import { useAuth } from '../../contexts/auth'
import { useState } from 'react'

export default function PlayerHeader({ player }: { player: User }) {
  const { user: currentUser } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState(player.avatar_url)
  const isOwnProfile = currentUser?.user_id === player.user_id

  const getRatingDifferenceIcon = (difference: number | null) => {
    if (!difference) return <Minus className="h-4 w-4 text-gray-400" />
    if (difference > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (difference < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getRatingDifferenceColor = (difference: number | null) => {
    if (!difference) return "text-gray-500"
    if (difference > 0) return "text-green-600 font-semibold"
    if (difference < 0) return "text-red-600 font-semibold"
    return "text-gray-500"
  }

  const ratings = [
    { name: 'Club Rating', value: player.schaakrating_elo },
    { name: 'Rating Verschil', value: player.schaakrating_difference, icon: getRatingDifferenceIcon(player.schaakrating_difference), color: getRatingDifferenceColor(player.schaakrating_difference) },
    { name: 'Hoogste Rating', value: player.schaakrating_max ? player.schaakrating_max : 'N/A' },
  ]

  return (
    <div className="bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="md:flex items-center justify-between">
          <div className="flex items-center mb-6 md:mb-0">
            <div className="flex-shrink-0 mr-6">
              {isOwnProfile ? (
                <AvatarUpload
                  currentAvatarUrl={avatarUrl}
                  userId={player.user_id}
                  onAvatarChange={setAvatarUrl}
                  size="lg"
                />
              ) : (
                <div className="h-40 w-40 rounded-full overflow-hidden border-4 border-mainAccent bg-gray-200">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl.startsWith('http') 
                        ? avatarUrl 
                        : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:9000' : 'https://kskcolle-production.up.railway.app')}${avatarUrl}`}
                      alt={`${player.voornaam} ${player.achternaam}`}
                      width={160}
                      height={160}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-gray-500">
                        {player.voornaam.charAt(0)}{player.achternaam.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <div className="uppercase tracking-wide text-sm text-mainAccent font-semibold">Speler Profiel</div>
              <h1 className="mt-1 text-4xl font-bold text-textColor">{`${player.voornaam} ${player.achternaam}`}</h1>
              
              {/* Contact Information */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-mainAccent" />
                  <span className="text-sm">
                    {player.email ?? "Onbekend"}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Smartphone className="h-4 w-4 mr-2 text-mainAccent" />
                  <span className="text-sm">
                    {player.tel_nummer && String(player.tel_nummer).trim() !== "" ? String(player.tel_nummer).trim() : "Onbekend"}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-mainAccent" />
                  <span className="text-sm">
                    {player.vast_nummer && String(player.vast_nummer).trim() !== "" ? String(player.vast_nummer).trim() : "Onbekend"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 md:mt-0">
            {ratings.map((rating) => (
              <div key={rating.name} className="bg-white p-4 rounded-lg shadow text-center">
                <p className="text-sm text-gray-600">{rating.name}</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  {rating.icon && rating.icon}
                  <p className={`text-2xl font-bold ${rating.color || 'text-mainAccent'}`}>
                    {rating.name === 'Rating Verschil' 
                      ? rating.value 
                        ? typeof rating.value === 'number' && rating.value > 0 
                          ? `+${rating.value}` 
                          : rating.value 
                        : '-'
                      : rating.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

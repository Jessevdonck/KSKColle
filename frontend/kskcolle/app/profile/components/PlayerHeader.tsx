import Image from 'next/image'
import { User } from '../../../data/types'
import { Mail, Phone, Smartphone, Lock, Award } from 'lucide-react'
import AvatarUpload from '../../components/AvatarUpload'
import { useAuth } from '../../contexts/auth'
import { canViewSensitiveInfo, canViewUserSensitiveInfo } from '../../../lib/roleUtils'
import { useState } from 'react'

export default function PlayerHeader({ player }: { player: User }) {
  const { user: currentUser } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState(player.avatar_url)
  const isOwnProfile = currentUser?.user_id === player.user_id

  const ratings = [
    { name: 'Club Rating', value: player.schaakrating_elo },
  ]

  // Alleen uitlichten in het jubileumjaar zelf. Een badge tonen bij iedereen
  // die ooit 25 jaar haalde, wekt de indruk dat zij dit jaar hun jubileum vieren.
  const jubileum = player.jubileum_dit_jaar ? player.jubileum_jaren ?? null : null

  return (
    <div className={jubileum ? "bg-gradient-to-r from-yellow-50 to-yellow-100 p-5 border-b-2 border-yellow-300" : "bg-gray-50 p-5"}>
      <div className="max-w-7xl mx-auto">
        <div className="md:flex items-center justify-between">
          <div className="flex items-center mb-3 md:mb-0">
            <div className="flex-shrink-0 mr-4">
              {isOwnProfile ? (
                <AvatarUpload
                  currentAvatarUrl={avatarUrl}
                  userId={player.user_id}
                  onAvatarChange={setAvatarUrl}
                  size="md"
                />
              ) : (
                <div className={`h-24 w-24 rounded-full overflow-hidden border-4 bg-gray-200 ${jubileum ? "border-yellow-400" : "border-mainAccent"}`}>
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={`${player.voornaam} ${player.achternaam}`}
                      width={96}
                      height={96}
                      quality={70}
                      priority
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-500">
                        {player.voornaam.charAt(0)}{player.achternaam.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <div className="uppercase tracking-wide text-xs text-mainAccent font-semibold">Speler Profiel</div>
              <h1 className="mt-0.5 text-2xl font-bold text-textColor">{`${player.voornaam} ${player.achternaam}`}</h1>
              {jubileum && (
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 px-2.5 py-1 text-xs font-semibold text-white shadow">
                  <Award className="h-3.5 w-3.5" />
                  Viert dit jaar {jubileum} jaar lidmaatschap
                </div>
              )}

              {/* Contact Information */}
              <div className="mt-2.5 space-y-1.5">
                {canViewUserSensitiveInfo(currentUser, player) ? (
                  <>
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
                  </>
                ) : (
                  <div className="flex items-center text-gray-500">
                    <Lock className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm italic">
                      {canViewSensitiveInfo(currentUser) 
                        ? "Contactgegevens van ex-leden zijn niet zichtbaar" 
                        : "Contactgegevens zijn alleen zichtbaar voor leden"
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 mt-3 md:mt-0">
            {ratings.map((rating) => (
              <div key={rating.name} className="bg-white p-3 rounded-lg shadow text-center">
                <p className="text-sm text-gray-600">{rating.name}</p>
                <p className="text-xl font-bold text-mainAccent mt-0.5">{rating.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

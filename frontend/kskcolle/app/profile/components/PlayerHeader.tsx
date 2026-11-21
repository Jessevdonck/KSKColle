import Image from 'next/image'
import type { ReactNode } from 'react'
import { User } from '../../../data/types'
import { Mail, Phone, Smartphone, Lock, Award, Trophy, Zap } from 'lucide-react'
import AvatarUpload from '../../components/AvatarUpload'
import { useAuth } from '../../contexts/auth'
import { canViewSensitiveInfo, canViewUserSensitiveInfo } from '../../../lib/roleUtils'
import { useState } from 'react'

/**
 * Spelerskaart bovenaan het profiel: foto (eigen profiel: met knoppen om te wijzigen),
 * naam, jubileum, contactgegevens en club- en blitzrating.
 */
export default function PlayerHeader({ player }: { player: User }) {
  const { user: currentUser } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState(player.avatar_url)
  const isOwnProfile = currentUser?.user_id === player.user_id

  // Alleen uitlichten in het jubileumjaar zelf. Een badge tonen bij iedereen
  // die ooit 25 jaar haalde, wekt de indruk dat zij dit jaar hun jubileum vieren.
  const jubileum = player.jubileum_dit_jaar ? player.jubileum_jaren ?? null : null
  const showContact = canViewUserSensitiveInfo(currentUser, player)
  const orUnknown = (v?: string | null) => (v && String(v).trim() !== '' ? String(v).trim() : 'Onbekend')

  return (
    <div
      className={`h-full rounded-lg p-3 ${
        jubileum ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-b-2 border-yellow-300' : 'bg-yellow-50/60'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {/* Foto */}
        <div className="flex shrink-0 justify-center rounded-lg bg-white p-3 shadow-sm sm:w-44">
          {isOwnProfile ? (
            <AvatarUpload
              currentAvatarUrl={avatarUrl}
              userId={player.user_id}
              onAvatarChange={setAvatarUrl}
              size="md"
            />
          ) : (
            <div className={`h-24 w-24 overflow-hidden rounded-full border-4 bg-gray-200 ${jubileum ? 'border-yellow-400' : 'border-mainAccent'}`}>
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
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-2xl font-bold text-gray-500">
                    {player.voornaam.charAt(0)}
                    {player.achternaam.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gegevens */}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-mainAccent">Spelersprofiel</div>
          <h1 className="mt-0.5 text-2xl font-bold leading-tight text-textColor">{`${player.voornaam} ${player.achternaam}`}</h1>
          {jubileum && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 px-2.5 py-1 text-xs font-semibold text-white shadow">
              <Award className="h-3.5 w-3.5" />
              Viert dit jaar {jubileum} jaar lidmaatschap
            </div>
          )}

          <div className="mt-2.5 space-y-1">
            {showContact ? (
              <>
                <InfoLine icon={<Mail className="h-4 w-4 text-mainAccent" />}>{player.email ?? 'Onbekend'}</InfoLine>
                <InfoLine icon={<Smartphone className="h-4 w-4 text-mainAccent" />}>{orUnknown(player.tel_nummer)}</InfoLine>
                <InfoLine icon={<Phone className="h-4 w-4 text-mainAccent" />}>{orUnknown(player.vast_nummer)}</InfoLine>
              </>
            ) : (
              <InfoLine icon={<Lock className="h-4 w-4 text-gray-400" />}>
                <span className="italic text-gray-500">
                  {canViewSensitiveInfo(currentUser)
                    ? 'Contactgegevens van ex-leden zijn niet zichtbaar'
                    : 'Contactgegevens zijn alleen zichtbaar voor leden'}
                </span>
              </InfoLine>
            )}
          </div>

          {/* Ratings */}
          <div className="mt-2.5 grid w-fit grid-cols-[auto_auto] items-baseline gap-x-3 gap-y-0.5">
            <RatingLine icon={<Trophy className="h-3.5 w-3.5 text-mainAccent" />} label="Club Rating" value={player.schaakrating_elo} />
            {player.blitz_rating ? (
              <RatingLine icon={<Zap className="h-3.5 w-3.5 text-mainAccent" />} label="Blitz Rating" value={player.blitz_rating} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoLine({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm text-gray-600">
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  )
}

function RatingLine({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <>
      <span className="flex items-center gap-1.5 text-sm text-gray-600">
        {icon}
        {label}
      </span>
      <span className="text-lg font-bold tabular-nums text-mainAccent">{value}</span>
    </>
  )
}

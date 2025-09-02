import Image from 'next/image'
import { User } from '../../../data/types'
import { Mail, Phone, Smartphone } from 'lucide-react'

export default function PlayerHeader({ player }: { player: User }) {
  const ratings = [
    { name: 'Club Rating', value: player.schaakrating_elo },
    { name: 'FIDE Rating', value: 'N/A' },
    { name: 'Hoogste Rating', value: player.schaakrating_max ? player.schaakrating_max : 'N/A' },
  ]

  return (
    <div className="bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="md:flex items-center justify-between">
          <div className="flex items-center mb-6 md:mb-0">
            <div className="flex-shrink-0 mr-6">
              <Image
                src={'/images/image_placeholder.png'}
                alt={`${player.voornaam} ${player.achternaam}`}
                width={160}
                height={160}
                className="h-40 w-40 rounded-full object-cover border-4 border-mainAccent"
              />
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
                <p className="text-2xl font-bold text-mainAccent">{rating.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

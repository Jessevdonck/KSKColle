import Image from 'next/image'
import { User } from '../../../data/types'

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

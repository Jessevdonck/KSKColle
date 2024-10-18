import Image from 'next/image'
import { Player } from '../../../data/types'

export default function PlayerHeader({ player }: { player: Player }) {
  return (
    <div className="md:flex items-center p-8">
      <div className="md:flex-shrink-0 mb-4 md:mb-0 md:mr-8">
        <Image
          src={'/images/image_placeholder.png'}
          alt={`${player.voornaam} ${player.achternaam}`}
          width={200}
          height={200}
          className="h-48 w-48 rounded-full object-cover border-4 border-mainAccent"
        />
      </div>
      <div>
        <div className="uppercase tracking-wide text-sm text-mainAccent font-semibold">Speler Profiel</div>
        <h1 className="mt-1 text-4xl font-bold text-textColor">{`${player.voornaam} ${player.achternaam}`}</h1>
      </div>
    </div>
  )
}
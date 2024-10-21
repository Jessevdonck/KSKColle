import { User } from '../../../data/types'
import { useEffect } from 'react'
import * as usersApi from '../../api/users'
import { useState } from 'react'

export default function PlayerRatings({ player }: { player: User }) {
 

  const [fideRating, setFideRating] = useState<number | null>(null)

  useEffect(() => {
    const fetchFideRating = async () => {
      if (!player.fide_id) {
        setFideRating(null)
        return
      }

  
      try {
        const data = await usersApi.getFideById(player.fide_id)
        setFideRating(data.standard_elo)
      } catch (error) {
        console.error('Error fetching FIDE rating:', error)
        setFideRating(null)
      } 
    }

    fetchFideRating()
  }, [player.fide_id])

  const ratings = [
    { name: 'Club Rating', value: player.schaakrating_elo },
    { name: 'FIDE Rating', value: fideRating },
    { name: 'Nationaal ID', value: player.nationaal_id },
  ]

  return (
    <div className="px-8 py-6 bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Ratings</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ratings.map((rating) => (
          <div key={rating.name} className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">{rating.name}</p>
            <p className="text-2xl font-bold text-mainAccent">{rating.value || 'N/A'}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-gray-600">Hoogste rating: <span className="font-semibold">{player.schaakrating_max}</span></p>
    </div>
  )
}
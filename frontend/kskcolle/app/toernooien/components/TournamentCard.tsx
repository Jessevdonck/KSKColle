"use client"

import React from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const Users = dynamic(() => import('lucide-react').then((mod) => mod.Users), { ssr: false })
const Calendar = dynamic(() => import('lucide-react').then((mod) => mod.Calendar), { ssr: false })
const ArrowRight = dynamic(() => import('lucide-react').then((mod) => mod.ArrowRight), { ssr: false })

interface TournamentCardProps {
  tournament: {
    tournament_id: number
    naam: string
    rondes: number
    participations: Array<{
      user_id: number
      voornaam: string
      achternaam: string
    }>
    class_name?: string | null
    _isMultiClass?: boolean
    _classCount?: number
  }
}

export default function TournamentCard({ tournament }: TournamentCardProps) {
  return (
    <Link href={`/toernooien/${tournament.tournament_id}`} className="block group">
      <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-mainAccent/30">
        <h2 className="text-lg font-semibold text-[#2e2c2c] mb-0.5 leading-snug">
          {tournament.naam}
        </h2>
        {tournament._isMultiClass && (
          <p className="text-sm text-mainAccent font-medium mb-2">
            {tournament._classCount} klasses
          </p>
        )}
        {tournament.class_name && !tournament._isMultiClass && (
          <p className="text-sm text-mainAccent font-medium mb-2">
            {tournament.class_name}
          </p>
        )}
        <div className="flex items-center text-[#2e2c2c] mb-1.5 mt-2 text-sm">
          <Calendar className="h-4 w-4 mr-1.5 text-mainAccent" />
          <span className="font-semibold">Rondes:</span>
          <span className="ml-1.5">{tournament.rondes}</span>
        </div>
        <div className="flex items-center text-[#2e2c2c] text-sm">
          <Users className="h-4 w-4 mr-1.5 text-mainAccent" />
          <span className="font-semibold">Deelnemers:</span>
          <span className="ml-1.5">{tournament.participations.length}</span>
        </div>
        <div className="mt-2.5 text-sm text-mainAccent font-semibold flex items-center gap-1 group-hover:text-mainAccentDark transition-colors duration-300">
          Bekijk details
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}


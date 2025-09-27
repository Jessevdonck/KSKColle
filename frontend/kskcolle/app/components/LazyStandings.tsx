"use client"

import { lazy, Suspense } from 'react'
import { LazyComponent } from '@/components/LazyComponent'

// Lazy load the Standings component
const Standings = lazy(() => import('../toernooien/components/Standings'))

interface LazyStandingsProps {
  tournament: any
  rounds: any[]
}

export function LazyStandings({ tournament, rounds }: LazyStandingsProps) {
  return (
    <LazyComponent 
      fallback={
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <Standings tournament={tournament} rounds={rounds} />
    </LazyComponent>
  )
}

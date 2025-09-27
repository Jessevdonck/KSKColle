import { createLazyComponent } from '@/components/LazyComponent'

const LazyTournamentDetails = createLazyComponent(
  () => import('../toernooien/components/TournamentDetails'),
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
)

export default LazyTournamentDetails

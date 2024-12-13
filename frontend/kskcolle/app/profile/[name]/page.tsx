import PrivateRoute from '@/app/components/PrivateRoute'
import PlayerProfile from '../components/PageProfile'

export default function PlayerProfilePage({ params }: { params: { name: string } }) {
  return (
    <PrivateRoute>
      <PlayerProfile name={params.name} />
    </PrivateRoute>
  );
}
import PlayerProfile from '../components/PageProfile'

export default function PlayerProfilePage({ params }: { params: { name: string } }) {
  return (
    <PlayerProfile name={params.name} />
  );
}
'use client';
import TournamentList from './components/TournamentList'
import PrivateRoute from "../components/PrivateRoute";

export default function TournamentsPage() {
  return (
    <PrivateRoute>
      <TournamentList />
    </PrivateRoute>
  );
}
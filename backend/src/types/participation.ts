export type Participation = {
  user_id: number;
  tournament_id: number;
  score?: number | null;
  buchholz?: number | null;
  sonnebornBerger?: number | null;
  opponents?: string | null; 
  color_history?: string | null; 
  bye_round?: number | null;
};
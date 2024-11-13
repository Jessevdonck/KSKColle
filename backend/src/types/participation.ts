export type Participation = {
  user_id: number;
  tournament_id: number;
  score: number;
  buchholz: number;
  sonnebornBerger: number;
  opponents: string; 
  color_history: string; 
  bye_round: number | null;
};
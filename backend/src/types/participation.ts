export type Participation = {
  user_id: number;
  tournament_id: number;
  score?: number | null;
  buchholz?: number | null;
  sonnebornBerger?: number | null;
  opponents?: string | null; 
  color_history?: string | null; 
  bye_round?: number | null;
  tie_break?: number | null;
  wins?: number | null;
  sevilla_initial_rating?: number | null;
  sevilla_final_rating?: number | null;
  sevilla_rating_change?: number | null;
};
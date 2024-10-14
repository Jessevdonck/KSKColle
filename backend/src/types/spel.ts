export type Spel = {
  game_id: string;
  round_id: number;
  wit_speler_id: number;
  zwart_speler_id: number;
  winnaar_id: number;
  resultaat: string;
  uitgestelde_datum?: Date;
};
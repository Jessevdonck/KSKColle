export type Speler = {
  speler_id: number;
  voornaam: string;
  achternaam: string;
  geboortedatum: Date;
  schaakrating_elo: number;
  max_rating: number;
  rating_difference: number;
  is_admin: boolean;
  fide_id: number;
  nationaal_id: number;
  lid_sinds: Date;
};
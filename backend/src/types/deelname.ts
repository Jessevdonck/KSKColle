import type { Speler } from './speler';
import type { Toernooi } from './toernooi';

export type Deelnames = {
  user_id: Pick<Speler, 'user_id' | 'voornaam' | 'achternaam' | 'schaakrating_elo'>;
  tournament_id: Pick<Toernooi, 'tournament_id' | 'naam'>;
};
  
/* scripts/recalculate-blitz-ratings.ts
 * Run: npm run recalculate-blitz-ratings
 *
 * Herberekent de aparte blitzrating (BlitzRatingHistory) volledig uit alle
 * blitz-/snelschaaktoernooien. Idempotent: vervangt de volledige tabel.
 * Raakt de ELIO (schaakrating_elo / EloHistory) niet aan.
 */
import { recalculateBlitzRatings } from '../service/blitzRatingService';
import { prisma } from '../data/index';

recalculateBlitzRatings()
  .then((r) => console.log(`Blitzrating herberekend: ${r.tournaments} toernooien, ${r.points} punten`))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

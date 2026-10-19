import { countsForElio } from '../core/ratedCompetitions';

describe('countsForElio', () => {
  it.each([
    ['Herfstcompetitie 2026-2027', null],
    ['Herfstcompetitie 2024', null],
    ['Lentecompetitie 2026', 'Eerste Klasse'],
    ['Lente 2023', 'Tweede Klasse'],
  ])('telt "%s" (%s) mee voor ELIO', (naam, className) => {
    expect(countsForElio(naam, className)).toBe(true);
  });

  it.each([
    ['Zomertoernooi 2026', null],
    ['Blitzkampioenschap 2026', 'Eerste Klasse'],
    ['Jeugdkampioenschap 2026-2027', 'Stap 3+'],
    ['Rapidtoernooi 2026', null],
  ])('telt "%s" (%s) niet mee voor ELIO', (naam, className) => {
    expect(countsForElio(naam, className)).toBe(false);
  });
});

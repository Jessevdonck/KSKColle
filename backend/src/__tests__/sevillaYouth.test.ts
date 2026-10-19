import {
  isYouthClassName,
  resolveYouthTournamentName,
  seasonOf,
  stripYouthClassSuffix,
  tournamentTypeFromSevilla,
} from '../service/sevillaYouth';

describe('sevillaYouth', () => {
  describe('isYouthClassName', () => {
    it.each(['Stap 3+', 'Stap 1', 'Stap 2', 'stap 1 & 2', 'Stap 1+2'])('herkent "%s" als reeks', (name) => {
      expect(isYouthClassName(name)).toBe(true);
    });

    it.each(['Group 1', 'Eerste Klasse', '', null, 'Stappen'])('herkent "%s" niet als reeks', (name) => {
      expect(isYouthClassName(name as string | null)).toBe(false);
    });
  });

  describe('seasonOf', () => {
    it('haalt het seizoen uit de naam, ook met spaties rond het streepje', () => {
      expect(seasonOf('Jeugdkampioenschap 2026-2027')).toBe('2026-2027');
      expect(seasonOf('Jeugdcompetitie 2024 - 2025')).toBe('2024-2025');
      expect(seasonOf('Jeugdcompetitie')).toBeNull();
    });
  });

  describe('stripYouthClassSuffix', () => {
    it('verwijdert de stap-aanduiding achteraan', () => {
      expect(stripYouthClassSuffix('Jeugdcompetitie 2026-2027 Stap 1 en 2')).toBe('Jeugdcompetitie 2026-2027');
      expect(stripYouthClassSuffix('Jeugdkampioenschap 2026-2027 - Stap 3+')).toBe('Jeugdkampioenschap 2026-2027');
      expect(stripYouthClassSuffix('Jeugdkampioenschap 2026-2027')).toBe('Jeugdkampioenschap 2026-2027');
    });
  });

  describe('resolveYouthTournamentName', () => {
    it('sluit aan bij het actieve jeugdtoernooi van hetzelfde seizoen', () => {
      expect(
        resolveYouthTournamentName('Jeugdcompetitie 2026-2027 Stap 1 en 2', [
          'Jeugdkampioenschap 2026-2027',
        ]),
      ).toBe('Jeugdkampioenschap 2026-2027');
    });

    it('negeert jeugdtoernooien uit een ander seizoen', () => {
      expect(
        resolveYouthTournamentName('Jeugdcompetitie 2026-2027 Stap 1 en 2', [
          'Jeugdkampioenschap 2025-2026',
        ]),
      ).toBe('Jeugdcompetitie 2026-2027');
    });

    it('gebruikt de naam zonder stap-aanduiding als er nog niets bestaat', () => {
      expect(resolveYouthTournamentName('Jeugdkampioenschap 2026-2027', [])).toBe('Jeugdkampioenschap 2026-2027');
    });
  });

  describe('tournamentTypeFromSevilla', () => {
    it('leest round robin uit CompData', () => {
      expect(tournamentTypeFromSevilla({ CompData: { PairingSyst: 'Round Robin' } })).toBe('ROUND_ROBIN');
    });

    it('valt terug op Zwitsers', () => {
      expect(tournamentTypeFromSevilla({ CompData: { PairingSyst: 'Swiss' } })).toBe('SWISS');
      expect(tournamentTypeFromSevilla({})).toBe('SWISS');
    });
  });
});

import { sevillaBuchholz, isAbsenceRow } from '../core/sevillaBuchholz';
import { collectTieBreakGamesFromRaw } from '../core/collectTieBreakGames';
import { isDecidedGameWithOpponentResult } from '../core/countsAsSpeeldagPartij';

// Spelers: 1..5. Uitkomsten gecontroleerd tegen de manier waarop Sevilla rekent
// (herfstcompetitie 2026-2027: Bhlz/Median/ModifiedMedian identiek voor alle spelers).
describe('sevillaBuchholz', () => {
  it('gewone partijen: score van de tegenstanders, Bhlz-W zonder de laagste', () => {
    // R1: 1-2 1-0, 3-4 ½-½ ; R2: 1-3 1-0, 2-4 0-1
    const res = sevillaBuchholz([1, 2, 3, 4], [
      { p1: 1, p2: 2, result: '1-0' },
      { p1: 3, p2: 4, result: '1/2-1/2' },
      { p1: 1, p2: 3, result: '1-0' },
      { p1: 2, p2: 4, result: '0-1' },
    ], []);
    // scores: 1=2, 2=0, 3=0.5, 4=1.5 → speler 1: tegenstanders 0 + 0.5
    expect(res.get(1)).toMatchObject({ buchholz: 0.5, buchholzWorst: 0.5 });
    expect(res.get(4)).toMatchObject({ buchholz: 0.5, buchholzWorst: 0.5 }); // tegenstanders 3 (½) en 2 (0)
  });

  it('eigen AWM of bye telt als ronde met de eigen aangepaste score', () => {
    // speler 1: R1 AWM, R2 wint van 2. Aangepaste score 1 = ½ (AWM) + 1.
    const res = sevillaBuchholz([1, 2], [{ p1: 1, p2: 2, result: '1-0' }], [{ player: 1 }, { player: 2 }]);
    // speler 2: R1 bye (½) + verlies → aangepast ½
    expect(res.get(1)!.contributions.sort()).toEqual([0.5, 1.5].sort()); // tegenstander 2 (½) + eigen (1.5)
    expect(res.get(1)).toMatchObject({ buchholz: 2, buchholzWorst: 1.5 });
  });

  it('forfaitwinst telt bij tegenstanders als ½, en voor jezelf als eigen ronde', () => {
    // R1: 1 wint forfait van 2 (0-1R vanuit 2 als wit), R2: 3 wint van 1
    const res = sevillaBuchholz([1, 2, 3], [
      { p1: 2, p2: 1, result: '0-1R' },
      { p1: 3, p2: 1, result: '1-0' },
    ], []);
    // aangepast: 1 = ½ (forfait) + 0 = ½ ; 2 = ½ ; 3 = 1
    expect(res.get(3)!.buchholz).toBe(0.5); // tegenstander 1 telt ½, niet 1
    expect(res.get(1)!.contributions.sort()).toEqual([0.5, 1].sort()); // eigen ½ (forfait) + tegenstander 3
  });

  it('½-½R (niet gespeelde remise) telt als niet-gespeelde ronde', () => {
    const res = sevillaBuchholz([1, 2, 3], [
      { p1: 1, p2: 2, result: '1/2-1/2R' },
      { p1: 1, p2: 3, result: '1-0' },
    ], []);
    // aangepast 1 = ½ + 1 = 1.5 → ronde 1 levert eigen 1.5, ronde 2 tegenstander 3 (0)
    expect(res.get(1)).toMatchObject({ buchholz: 1.5, buchholzWorst: 1.5 });
  });

  it('herkent bye- en afwezigheidsrijen, maar geen lege of uitgestelde', () => {
    expect(isAbsenceRow(null, 'ABS-0.5')).toBe(true);
    expect(isAbsenceRow(null, 'ABS-0')).toBe(true);
    expect(isAbsenceRow(null, '0.5-0')).toBe(true);
    expect(isAbsenceRow(null, null)).toBe(false);
    expect(isAbsenceRow(null, '...')).toBe(false);
    expect(isAbsenceRow(5, '1-0')).toBe(false);
  });

  it('kiest bij dubbele partij de uitslag van de gewone ronde (Sevilla) boven een inhaalrecord', () => {
    const raw = [
      { game_id: 2, original_game_id: 99, speler1_id: 1, speler2_id: 2, result: '1/2-1/2', round: { type: 'MAKEUP' as const } },
      { game_id: 3, original_game_id: null, speler1_id: 1, speler2_id: 2, result: '1/2-1/2R', round: { type: 'REGULAR' as const } },
    ];
    expect(collectTieBreakGamesFromRaw(raw, isDecidedGameWithOpponentResult, false, true)).toEqual([
      { p1: 1, p2: 2, result: '1/2-1/2R' },
    ]);
    // standaard (andere tie-breaks) blijft de inhaaldag winnen
    expect(collectTieBreakGamesFromRaw(raw, isDecidedGameWithOpponentResult, false)[0]!.result).toBe('1/2-1/2');
  });
});

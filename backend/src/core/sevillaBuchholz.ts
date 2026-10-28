import {
  isDrawResult,
  isForfeitResult,
  normalizeResultFlat,
} from "./countsAsSpeeldagPartij";

/**
 * Buchholz zoals Sevilla hem berekent (gevalideerd tegen de Sevilla-export van de
 * herfstcompetitie 2026-2027: Bhlz, MedianBhlz en ModifiedMedian kloppen voor alle
 * spelers na elke ronde).
 *
 * - "Aangepaste score" van een speler: punten uit gespeelde partijen + ½ voor elke
 *   niet-gespeelde ronde (forfait / ...R, bye, afwezig met of zonder bericht),
 *   ongeacht hoeveel punten die ronde echt opleverde.
 * - Bijdrage per ronde:
 *   - gespeelde partij: aangepaste score van de tegenstander;
 *   - niet-gespeelde ronde (forfait in eender welke richting, ½-½R, bye, AWM):
 *     de eigen aangepaste score.
 * - Nog niet gespeelde partijen tellen niet; een AWM in een al geloste, nog niet
 *   gespeelde ronde telt wél (zoals in Sevilla).
 * - Bhlz-W = Buchholz min de laagste bijdrage.
 */

/** Beslist resultaat tegen een tegenstander (zie collectTieBreakGames: één per koppel bij Zwitsers). */
export type BuchholzGame = { p1: number; p2: number; result: string };

/** Ronde zonder tegenstander (bye, afwezig) met een resultaat; één item per speler per ronde. */
export type BuchholzAbsence = { player: number };

export type BuchholzResult = {
  buchholz: number;
  buchholzWorst: number;
  contributions: number[];
};

const isUnplayedGame = (result: string): boolean => isForfeitResult(result);

/** Punten voor speler 1 en speler 2 uit een gespeelde partij. */
const playedPoints = (result: string): [number, number] => {
  const flat = normalizeResultFlat(result);
  if (flat.startsWith("1-0")) return [1, 0];
  if (flat.startsWith("0-1")) return [0, 1];
  if (isDrawResult(result)) return [0.5, 0.5];
  return [0, 0];
};

export function sevillaBuchholz(
  playerIds: number[],
  games: BuchholzGame[],
  absences: BuchholzAbsence[],
): Map<number, BuchholzResult> {
  const adjusted = new Map<number, number>(playerIds.map((id) => [id, 0]));
  const add = (id: number, value: number) =>
    adjusted.set(id, (adjusted.get(id) ?? 0) + value);

  for (const { p1, p2, result } of games) {
    if (isUnplayedGame(result)) {
      add(p1, 0.5);
      add(p2, 0.5);
    } else {
      const [a, b] = playedPoints(result);
      add(p1, a);
      add(p2, b);
    }
  }
  for (const { player } of absences) add(player, 0.5);

  const contributions = new Map<number, number[]>(playerIds.map((id) => [id, []]));
  const push = (id: number, value: number) => {
    const list = contributions.get(id);
    if (list) list.push(value);
    else contributions.set(id, [value]);
  };

  for (const { p1, p2, result } of games) {
    if (isUnplayedGame(result)) {
      push(p1, adjusted.get(p1) ?? 0);
      push(p2, adjusted.get(p2) ?? 0);
    } else {
      push(p1, adjusted.get(p2) ?? 0);
      push(p2, adjusted.get(p1) ?? 0);
    }
  }
  for (const { player } of absences) push(player, adjusted.get(player) ?? 0);

  const out = new Map<number, BuchholzResult>();
  for (const [id, list] of contributions) {
    const buchholz = list.reduce((sum, v) => sum + v, 0);
    out.set(id, {
      buchholz,
      buchholzWorst: list.length > 0 ? buchholz - Math.min(...list) : 0,
      contributions: list,
    });
  }
  return out;
}

/** Afwezigheden (bye/AWM) uit een rij partijen: geen tegenstander en een ingevuld resultaat. */
export const isAbsenceRow = (speler2: number | null | undefined, result: string | null | undefined): boolean => {
  if (speler2 != null) return false;
  const flat = normalizeResultFlat(result);
  return flat !== "" && flat !== "..." && flat !== "NOT_PLAYED" && flat !== "UITGESTELD";
};

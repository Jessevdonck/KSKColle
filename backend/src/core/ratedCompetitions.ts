/**
 * Enkel de herfst- en lentecompetitie tellen voor de clubrating (ELIO).
 * Zomertoernooi, blitz, rapid, jeugd, … worden wel in Sevilla gerate, maar mogen
 * de ELIO en de ELIO-historiek (profielgrafiek) niet wijzigen.
 */
export function countsForElio(naam: string, className?: string | null): boolean {
  const n = naam.toLowerCase();
  if (n.includes("herfst")) return true;
  if (n.includes("lentecompetitie") || n.includes("lente competitie")) return true;
  // Oudere lente-edities heetten soms gewoon "Lente 20xx" met klassen
  if (n.includes("lente") && (className ?? "").trim().length > 0) return true;
  return false;
}

/**
 * Blitz-/snelschaakkampioenschap: telt voor de aparte blitzrating
 * (zie blitzRatingService), nooit voor de ELIO.
 */
export function countsForBlitz(naam: string): boolean {
  const n = naam.toLowerCase();
  return n.includes("blitz") || n.includes("snelschaak");
}

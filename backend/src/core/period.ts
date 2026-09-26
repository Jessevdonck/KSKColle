/** Huidige periode als "YYYY-MM", voor een nieuw punt in de ELIO-historiekgrafiek. */
export function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

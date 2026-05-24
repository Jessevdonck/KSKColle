export const MIN_PLAYERS = 10;
export const MAX_PLAYERS = 11;
export const MAX_BUDGET = 1000;

export const CLASS_ORDER = [
  "Hoofdtoernooi",
  "Eerste Klasse",
  "Tweede Klasse",
  "Derde Klasse",
  "Vierde Klasse",
  "Vijfde Klasse",
  "Vierde en Vijfde Klasse",
  "Zesde Klasse",
  "Zevende Klasse",
  "Achtste Klasse",
] as const;

export type MegaschaakView =
  | "team"
  | "standings"
  | "crosstable"
  | "popular"
  | "value";

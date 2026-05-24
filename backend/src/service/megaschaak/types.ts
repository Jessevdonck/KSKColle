export interface MegaschaakConfig {
  classBonusPoints: { [key: string]: number };
  roundsPerClass: { [key: string]: number };
  correctieMultiplier: number;
  correctieSubtract: number;
  minCost: number;
  maxCost: number;
  playerCosts?: { [playerId: number]: number };
}

export const DEFAULT_CONFIG: MegaschaakConfig = {
  classBonusPoints: {
    "Eerste Klasse": 0,
    "Tweede Klasse": 110,
    "Derde Klasse": 190,
    "Vierde Klasse": 270,
    "Vijfde Klasse": 330,
    "Vierde en Vijfde Klasse": 330,
    "Zesde Klasse": 330,
    "Zevende Klasse": 330,
    "Achtste Klasse": 330,
    Hoofdtoernooi: 0,
  },
  roundsPerClass: {},
  correctieMultiplier: 1.5,
  correctieSubtract: 1800,
  minCost: 1,
  maxCost: 200,
};

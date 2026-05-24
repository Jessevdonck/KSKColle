import { RoundType } from "@prisma/client";
import { countsAsSpeeldagPartij } from "../../core/countsAsSpeeldagPartij";
import { prisma } from "../data";
import {
  gameInvolvesMegaschaakExcludedPlayer,
  getMegaschaakExcludedUserIds,
} from "./exclusions";

export const calculateGameScore = (game: any, playerId: number): number => {
  // Player not in this game
  if (game.speler1_id !== playerId && game.speler2_id !== playerId) {
    return 0;
  }

  // Forfait / import: winnaar_id staat er, maar result kan leeg of "uitgesteld" zijn — wel vóór result-parsing
  if (game.winnaar_id === playerId) {
    return 1;
  }
  if (
    game.winnaar_id != null &&
    game.speler2_id != null &&
    game.winnaar_id !== playerId
  ) {
    return 0;
  }

  const rawResult = String(game.result ?? "").trim();
  if (
    !rawResult ||
    rawResult === "not_played" ||
    rawResult === "..." ||
    rawResult === "uitgesteld"
  ) {
    return 0;
  }

  // Spaties weg voor 1-0R / 0-1R / 1-0 FF e.d.
  const resFlat = rawResult.replace(/\s+/g, "");

  // Zelfde logica als toernooi-UI: 1-0R, 1-0FF, 1-0, …
  if (resFlat.startsWith("1-0") && game.speler1_id === playerId) {
    return 1;
  }
  if (resFlat.startsWith("0-1") && game.speler2_id === playerId) {
    return 1;
  }

  // Check for draw (½-½, 1/2-1/2 of Sevilla "-")
  if (
    rawResult === "½-½" ||
    rawResult === "1/2-1/2" ||
    rawResult === "-" ||
    resFlat === "1/2-1/2"
  ) {
    return 0.5;
  }

  // Player lost
  return 0;
};

/** Of de partij meetelt voor punten/score-resolutie (incl. forfait). */
const isPlayedGame = (
  result: string | null,
  speler2_id: number | null,
  winnaar_id?: number | null,
): boolean => {
  if (speler2_id === null) return false;
  if (winnaar_id != null) return true;
  const r = typeof result === "string" ? result.trim() : result;
  if (!r || r === "not_played" || r === "..." || r === "uitgesteld")
    return false;
  if (typeof r === "string" && r.startsWith("ABS-")) return false;
  return true;
};

export function pairKeyMegaschaak(p1: number, p2: number): string {
  return p1 < p2 ? `${p1}-${p2}` : `${p2}-${p1}`;
}

export function getPlannedMegaschaakRounds(
  allClassesTournaments: Array<{
    rondes?: number | null;
    rounds?: Array<{ ronde_nummer: number }>;
  }>,
): number[] {
  const maxPlannedRounds = allClassesTournaments.reduce((max, t) => {
    const n = t.rondes;
    if (typeof n === "number" && n > max) return n;
    return max;
  }, 0);

  const roundsSet = new Set<number>();
  if (maxPlannedRounds > 0) {
    for (let i = 1; i <= maxPlannedRounds; i++) {
      roundsSet.add(i);
    }
  } else {
    for (const t of allClassesTournaments) {
      for (const r of t.rounds ?? []) {
        if (r.ronde_nummer > 0) {
          roundsSet.add(r.ronde_nummer);
        }
      }
    }
  }

  return [...roundsSet].sort((a, b) => a - b);
}

/** Inhaalpartijen op reguliere game_id — gedeeld door collect + team-detail. */
export async function buildMakeupByOriginalIdMap(
  allClassesTournaments: Array<{
    tournament_id: number;
    rounds: Array<{ type: string; ronde_nummer: number; games: any[] }>;
  }>,
): Promise<Map<number, any>> {
  const regularGameIds: number[] = [];
  for (const t of allClassesTournaments) {
    for (const r of t.rounds) {
      if (r.type !== RoundType.REGULAR && r.type !== "REGULAR") continue;
      for (const g of r.games) {
        if (g.speler2_id != null && g.game_id != null) {
          regularGameIds.push(g.game_id);
        }
      }
    }
  }

  const makeupByOriginalId = new Map<number, any>();
  if (regularGameIds.length === 0) return makeupByOriginalId;

  const makeups = await prisma.game.findMany({
    where: {
      original_game_id: { in: regularGameIds },
      round: { type: RoundType.MAKEUP },
    },
    include: {
      speler1: true,
      speler2: true,
      winnaar: true,
    },
    orderBy: { game_id: "desc" },
  });
  for (const m of makeups) {
    const oid = m.original_game_id;
    if (oid == null) continue;
    if (!makeupByOriginalId.has(oid)) makeupByOriginalId.set(oid, m);
  }
  return makeupByOriginalId;
}

/**
 * Team-detail: partij per ronde rechtstreeks uit REGULAR-ronde (geen globale dedup).
 */
export function resolveEffectiveGameForPlayerInRegularRound(
  tournament: {
    rounds?: Array<{ ronde_nummer: number; games?: any[] }>;
  },
  rondeNummer: number,
  playerId: number,
  makeupByOriginalId: Map<number, any>,
): any | null {
  const round = tournament.rounds?.find((r) => r.ronde_nummer === rondeNummer);
  if (!round?.games?.length) return null;
  const withPlayer = round.games.filter(
    (g) => g.speler1_id === playerId || g.speler2_id === playerId,
  );
  if (withPlayer.length === 0) return null;
  const raw = [...withPlayer].sort((a, b) => b.game_id - a.game_id)[0];
  return resolveRegularGameForMegaschaak(raw, makeupByOriginalId);
}

/**
 * Aantal rondes met een echte tegenstander — zelfde resolutie als getTeamDetailedScores / UI-tabel.
 * Alleen `allGames` + isPlayedGame kan te hoog uitkomen (extra rijen buiten de per-ronde bron).
 */
export function countMegaschaakGamesPlayedFromRoundResolution(
  playerId: number,
  teamTournamentId: number,
  playerCompetitionTournamentId: Map<number, number>,
  allClassesTournaments: Array<{
    tournament_id: number;
    rondes?: number | null;
    rounds?: Array<{ ronde_nummer: number; games?: any[] }>;
  }>,
  makeupByOriginalId: Map<number, any>,
  gamesByRound: Map<number, any[]>,
  roundsSorted: number[],
  requireResult: boolean = false,
): number {
  const playerTid =
    playerCompetitionTournamentId.get(playerId) ?? teamTournamentId;
  let count = 0;
  for (const rondeNummer of roundsSorted) {
    const playerTournament = allClassesTournaments.find(
      (t) => t.tournament_id === playerTid,
    );
    let effectiveGame: any | null = null;
    if (playerTournament) {
      effectiveGame = resolveEffectiveGameForPlayerInRegularRound(
        playerTournament,
        rondeNummer,
        playerId,
        makeupByOriginalId,
      );
    }
    if (!effectiveGame) {
      const games = gamesByRound.get(rondeNummer) ?? [];
      effectiveGame =
        games.find(
          (game: any) =>
            game._megaschaak_round?.tournament_id === playerTid &&
            (game.speler1_id === playerId || game.speler2_id === playerId),
        ) ??
        games.find(
          (game: any) =>
            game.speler1_id === playerId || game.speler2_id === playerId,
        ) ??
        null;
    }
    if (
      !effectiveGame ||
      effectiveGame.speler1_id == null ||
      effectiveGame.speler2_id == null
    ) {
      continue;
    }
    if (requireResult && effectiveGame.result == null) {
      continue;
    }
    if (!countsAsSpeeldagPartij(effectiveGame.result, effectiveGame.speler2_id)) {
      continue;
    }
    count += 1;
  }
  return count;
}

export function isForfeitLossForPlayer(game: any, playerId: number): boolean {
  if (!game || game.speler2_id == null) return false;
  if (game.speler1_id !== playerId && game.speler2_id !== playerId)
    return false;

  const raw = String(game.result ?? "").trim();
  const flat = raw.replace(/\s+/g, "").toUpperCase();
  const hasForfeitMarker = flat.endsWith("R") || flat.includes("FF");
  if (!hasForfeitMarker) return false;

  const playerIsSpeler1 = game.speler1_id === playerId;
  if (flat.startsWith("1-0")) return !playerIsSpeler1;
  if (flat.startsWith("0-1")) return playerIsSpeler1;
  return false;
}

export function getRawRoundGameForPlayer(
  playerId: number,
  playerTid: number,
  rondeNummer: number,
  allClassesTournaments: Array<{
    tournament_id: number;
    rounds?: Array<{ ronde_nummer: number; games?: any[] }>;
  }>,
): any | null {
  const playerTournament = allClassesTournaments.find(
    (t) => t.tournament_id === playerTid,
  );
  if (!playerTournament) return null;
  const round = playerTournament.rounds?.find(
    (r) => r.ronde_nummer === rondeNummer,
  );
  if (!round?.games?.length) return null;
  const playerGames = round.games.filter(
    (g) => g.speler1_id === playerId || g.speler2_id === playerId,
  );
  const explicitBye = playerGames.find(
    (g) => g.speler2_id == null && g.speler1_id === playerId,
  );
  if (explicitBye) return explicitBye;
  return (
    [...playerGames].sort((a, b) => b.game_id - a.game_id)[0] ?? null
  );
}

export function getMegaschaakByeRoundScore(game: any | null): number {
  if (!game || game.speler2_id != null) return 0.5;
  const raw = String(game.result ?? "").trim();
  if (!raw || raw === "..." || raw === "uitgesteld") return 0.5;
  const firstPart = raw.split("-")[0] ?? "";
  const first = parseFloat(firstPart);
  if (!Number.isNaN(first)) return first;
  return 0.5;
}

export function getMegaschaakOpponentIdFromGame(
  playerId: number,
  game: any | null,
): number | null {
  if (!game || game.speler2_id == null) return null;
  if (game.speler1_id === playerId) return game.speler2_id ?? null;
  if (game.speler2_id === playerId) return game.speler1_id ?? null;
  return null;
}

/**
 * Lentecompetitie: tegenstander was Lode Van Landeghem → toon BYE (import/bye-situatie).
 * Alleen deze hardcoded uitzondering, geen algemene bye-tegenstander-regel.
 */
export function isMegaschaakRoundVsLodeVanLandeghem(
  playerId: number,
  rawRoundGame: any | null,
  lodeUserId: number | null,
): boolean {
  if (lodeUserId == null) return false;
  const opponentId = getMegaschaakOpponentIdFromGame(playerId, rawRoundGame);
  return opponentId === lodeUserId;
}

export function resolveMegaschaakRoundByeDisplay(
  playerId: number,
  playerTid: number,
  rondeNummer: number,
  allClassesTournaments: Array<{
    tournament_id: number;
    rounds?: Array<{
      ronde_nummer: number;
      type?: string;
      games?: any[];
    }>;
  }>,
  rawRoundGame: any | null,
  lenteLodeUserId: number | null,
  isLenteCompetition: boolean,
): { isBye: true; score: number } | null {
  if (
    isMegaschaakSpeeldagBye(
      playerId,
      playerTid,
      rondeNummer,
      allClassesTournaments,
      rawRoundGame,
    )
  ) {
    return {
      isBye: true,
      score: getMegaschaakByeRoundScore(rawRoundGame),
    };
  }
  if (
    isLenteCompetition &&
    isMegaschaakRoundVsLodeVanLandeghem(playerId, rawRoundGame, lenteLodeUserId)
  ) {
    return { isBye: true, score: 0.5 };
  }
  return null;
}

export function isMegaschaakSpeeldagBye(
  playerId: number,
  playerTid: number,
  rondeNummer: number,
  allClassesTournaments: Array<{
    tournament_id: number;
    rounds?: Array<{
      ronde_nummer: number;
      type?: string;
      games?: any[];
    }>;
  }>,
  rawRoundGame: any | null,
): boolean {
  if (rawRoundGame?.speler2_id == null) {
    const result = String(rawRoundGame.result ?? "").trim();
    if (result === "uitgesteld" || result === "...") return false;
    return rawRoundGame.speler1_id === playerId;
  }
  if (rawRoundGame != null) return false;

  const playerTournament = allClassesTournaments.find(
    (t) => t.tournament_id === playerTid,
  );
  const round = playerTournament?.rounds?.find(
    (r) => r.ronde_nummer === rondeNummer,
  );
  if (!round || (round.type !== RoundType.REGULAR && round.type !== "REGULAR")) {
    return false;
  }

  const roundGames = round.games ?? [];
  const roundHasStarted = roundGames.some((g) => {
    const r = String(g.result ?? "").trim();
    return r && r !== "..." && r !== "uitgesteld";
  });
  if (!roundHasStarted) return false;

  const playerHasPostponed = roundGames.some(
    (g) =>
      (g.speler1_id === playerId || g.speler2_id === playerId) &&
      String(g.result ?? "").trim() === "uitgesteld",
  );
  if (playerHasPostponed) return false;

  const playerPlayedRealGame = roundGames.some(
    (g) =>
      (g.speler1_id === playerId || g.speler2_id === playerId) &&
      g.speler2_id != null &&
      String(g.result ?? "").trim() !== "uitgesteld",
  );
  return !playerPlayedRealGame;
}

export function isNamedPlayer(
  voornaam: string | null | undefined,
  achternaam: string | null | undefined,
  expectedVoornaam: string,
  expectedAchternaam: string,
): boolean {
  const v = (voornaam || "").trim().toLowerCase();
  const a = (achternaam || "").trim().toLowerCase();
  return (
    v === expectedVoornaam.toLowerCase() &&
    a === expectedAchternaam.toLowerCase()
  );
}

export function getRoundScoreFromRoundResolution(
  playerId: number,
  teamTournamentId: number,
  rondeNummer: number,
  playerCompetitionTournamentId: Map<number, number>,
  allClassesTournaments: Array<{
    tournament_id: number;
    rounds?: Array<{ ronde_nummer: number; games?: any[] }>;
  }>,
  makeupByOriginalId: Map<number, any>,
  gamesByRound: Map<number, any[]>,
): number | null {
  const playerTid =
    playerCompetitionTournamentId.get(playerId) ?? teamTournamentId;
  const playerTournament = allClassesTournaments.find(
    (t) => t.tournament_id === playerTid,
  );

  let effectiveGame: any | null = null;
  const rawRoundGame = getRawRoundGameForPlayer(
    playerId,
    playerTid,
    rondeNummer,
    allClassesTournaments,
  );
  if (
    rawRoundGame?.speler1_id === playerId &&
    rawRoundGame.speler2_id == null
  ) {
    return null;
  }

  if (playerTournament) {
    effectiveGame = resolveEffectiveGameForPlayerInRegularRound(
      playerTournament,
      rondeNummer,
      playerId,
      makeupByOriginalId,
    );
  }

  if (!effectiveGame) {
    const games = gamesByRound.get(rondeNummer) ?? [];
    effectiveGame =
      games.find(
        (game: any) =>
          game._megaschaak_round?.tournament_id === playerTid &&
          (game.speler1_id === playerId || game.speler2_id === playerId),
      ) ??
      games.find(
        (game: any) =>
          game.speler1_id === playerId || game.speler2_id === playerId,
      ) ??
      null;
  }

  if (!effectiveGame || effectiveGame.speler2_id === null) {
    return null;
  }
  return calculateGameScore(effectiveGame, playerId);
}

export function getJesseReserveReplacementIds(team: {
  reserve_player_id?: number | null;
  players?: Array<{
    player_id: number;
    player?: { voornaam?: string | null; achternaam?: string | null };
  }>;
}): { forfaitPlayerId: number; reservePlayerId: number } | null {
  const reservePlayerId = team.reserve_player_id ?? null;
  if (!reservePlayerId || !team.players?.length) return null;

  const hasReserveAsTeamPlayer = team.players.some(
    (tp) => tp.player_id === reservePlayerId,
  );
  if (!hasReserveAsTeamPlayer) return null;

  const forfaitPlayer = team.players.find((tp) =>
    isNamedPlayer(
      tp.player?.voornaam,
      tp.player?.achternaam,
      "Jesse",
      "Vaerendonck",
    ),
  );
  if (!forfaitPlayer) return null;

  return {
    forfaitPlayerId: forfaitPlayer.player_id,
    reservePlayerId,
  };
}

/** Som van basisspelerskosten (max 10); reservespeler niet mee — ook niet als die als 11e ploegspeler staat. */
export function megaschaakTeamPloegWaardeCost(team: {
  reserve_player_id?: number | null;
  players: Array<{ player_id: number; cost: number }>;
}): number {
  const rid = team.reserve_player_id ?? null;
  return team.players.reduce((sum, tp) => {
    if (rid != null && tp.player_id === rid) return sum;
    return sum + tp.cost;
  }, 0);
}

export function getAdjustedReserveScoreAndGamesForJesseReplacement(
  team: {
    tournament_id: number;
    reserve_player_id?: number | null;
    players?: Array<{
      player_id: number;
      player?: { voornaam?: string | null; achternaam?: string | null };
    }>;
  },
  playerCompetitionTournamentId: Map<number, number>,
  allClassesTournaments: Array<{
    tournament_id: number;
    rounds?: Array<{ ronde_nummer: number; games?: any[] }>;
  }>,
  makeupByOriginalId: Map<number, any>,
  gamesByRound: Map<number, any[]>,
  roundsSorted: number[],
): {
  forfaitPlayerId: number;
  reservePlayerId: number;
  adjustedScore: number;
  adjustedGames: number;
  adjustedForfaitGames: number;
} | null {
  const replacement = getJesseReserveReplacementIds(team);
  if (!replacement) return null;

  let adjustedScore = 0;
  let adjustedGames = 0;
  let adjustedForfaitGames = 0;
  for (const rondeNummer of roundsSorted) {
    const forfaitTid =
      playerCompetitionTournamentId.get(replacement.forfaitPlayerId) ??
      team.tournament_id;
    const forfaitRawRoundGame = getRawRoundGameForPlayer(
      replacement.forfaitPlayerId,
      forfaitTid,
      rondeNummer,
      allClassesTournaments,
    );
    const forfaitHasBye = forfaitRawRoundGame?.speler2_id == null;
    const forfaitForfeitLoss = isForfeitLossForPlayer(
      forfaitRawRoundGame,
      replacement.forfaitPlayerId,
    );
    const reserveScore = getRoundScoreFromRoundResolution(
      replacement.reservePlayerId,
      team.tournament_id,
      rondeNummer,
      playerCompetitionTournamentId,
      allClassesTournaments,
      makeupByOriginalId,
      gamesByRound,
    );
    const forfaitScore = getRoundScoreFromRoundResolution(
      replacement.forfaitPlayerId,
      team.tournament_id,
      rondeNummer,
      playerCompetitionTournamentId,
      allClassesTournaments,
      makeupByOriginalId,
      gamesByRound,
    );

    // Alleen forfait-rondes vervangen; BYE nooit vervangen.
    if (!forfaitHasBye && forfaitForfeitLoss && reserveScore !== null) {
      adjustedScore += reserveScore;
      adjustedGames += 1;
    }

    // Forfaitnederlagen van de vervangen speler tellen niet mee als gespeelde partij.
    if (forfaitScore !== null && !forfaitForfeitLoss) {
      adjustedForfaitGames += 1;
    }
  }

  return {
    forfaitPlayerId: replacement.forfaitPlayerId,
    reservePlayerId: replacement.reservePlayerId,
    adjustedScore,
    adjustedGames,
    adjustedForfaitGames,
  };
}

/**
 * Reguliere partij met echte uitslag op de speeldag, of anders de inhaalpartij
 * (zelfde koppel, zelfde geplande ronde; geen MAKEUP-rondes in de UI).
 */
export function resolveRegularGameForMegaschaak(
  reg: any,
  makeupByOriginalId: Map<number, any>,
): any | null {
  if (reg.speler2_id == null) return null;
  const m =
    reg.game_id != null ? makeupByOriginalId.get(reg.game_id) : undefined;
  const makeupPlayed = m && isPlayedGame(m.result, m.speler2_id, m.winnaar_id);
  // Geldige uitslag op de reguliere rij telt altijd (ook als uitgestelde_datum nog staat).
  if (isPlayedGame(reg.result, reg.speler2_id, reg.winnaar_id)) {
    return reg;
  }
  if (makeupPlayed) {
    return {
      ...reg,
      result: m!.result,
      winnaar_id: m!.winnaar_id,
      winnaar: m!.winnaar,
    };
  }
  return null;
}

/**
 * Alleen REGULAR-rondes; uitslagen gespeeld op inhaaldag worden via original_game_id
 * op de geplande ronde gezet. Per koppel één rij (nieuwste game_id wint bij dubbel).
 */
export async function collectDedupedMegaschaakGames(
  allClassesTournaments: Array<{
    tournament_id: number;
    rounds: Array<{
      type: string;
      ronde_nummer: number;
      games: any[];
    }>;
  }>,
  prebuiltMakeupByOriginalId?: Map<number, any>,
): Promise<any[]> {
  const excludedUserIds = await getMegaschaakExcludedUserIds();

  const makeupByOriginalId =
    prebuiltMakeupByOriginalId ??
    (await buildMakeupByOriginalIdMap(allClassesTournaments));

  type Row = { game: any; tournament_id: number; ronde_nummer: number };
  const rows: Row[] = [];
  for (const t of allClassesTournaments) {
    for (const r of t.rounds) {
      if (r.type !== RoundType.REGULAR && r.type !== "REGULAR") continue;
      for (const g of r.games) {
        const effective = resolveRegularGameForMegaschaak(
          g,
          makeupByOriginalId,
        );
        if (!effective) continue;
        if (gameInvolvesMegaschaakExcludedPlayer(effective, excludedUserIds)) {
          continue;
        }
        rows.push({
          game: effective,
          tournament_id: t.tournament_id,
          ronde_nummer: r.ronde_nummer,
        });
      }
    }
  }

  rows.sort((a, b) => b.game.game_id - a.game.game_id);
  const seen = new Set<string>();
  const out: any[] = [];
  for (const { game, tournament_id, ronde_nummer } of rows) {
    const p1 = game.speler1_id;
    const p2 = game.speler2_id!;
    const key = `${tournament_id}-${ronde_nummer}-${pairKeyMegaschaak(p1, p2)}`;
    if (seen.has(key)) continue;
    if (gameInvolvesMegaschaakExcludedPlayer(game, excludedUserIds)) continue;
    seen.add(key);
    out.push({
      ...game,
      _megaschaak_round: {
        tournament_id,
        ronde_nummer,
        type: RoundType.REGULAR,
      },
    });
  }

  const tournamentIds = [
    ...new Set(allClassesTournaments.map((t) => t.tournament_id)),
  ];
  await appendMegaschaakOrphanMakeupGames(
    out,
    seen,
    tournamentIds,
    excludedUserIds,
  );

  return out;
}

/**
 * Inhaalpartijen die (nog) niet via de reguliere rij binnenkomen — bv. ontbrekende
 * koppeling, of alleen op MAKEUP — alsnog onder het geplande rondenummer (offset 1000).
 */
export async function appendMegaschaakOrphanMakeupGames(
  out: any[],
  seen: Set<string>,
  tournamentIds: number[],
  excludedUserIds: Set<number>,
): Promise<void> {
  if (tournamentIds.length === 0) return;

  const makeups = await prisma.game.findMany({
    where: {
      speler2_id: { not: null },
      round: {
        type: RoundType.MAKEUP,
        tournament_id: { in: tournamentIds },
      },
    },
    include: {
      speler1: true,
      speler2: true,
      winnaar: true,
      round: true,
    },
    orderBy: { game_id: "desc" },
  });

  const played = makeups.filter((m) =>
    isPlayedGame(m.result, m.speler2_id, m.winnaar_id),
  );

  const origIds = [
    ...new Set(
      played
        .map((m) => m.original_game_id)
        .filter((id): id is number => id != null),
    ),
  ];
  const originals =
    origIds.length > 0
      ? await prisma.game.findMany({
          where: { game_id: { in: origIds } },
          include: {
            round: { select: { ronde_nummer: true, type: true } },
          },
        })
      : [];
  const origMap = new Map(originals.map((o) => [o.game_id, o]));

  for (const m of played) {
    const tid = m.round.tournament_id;
    const p1 = m.speler1_id;
    const p2 = m.speler2_id!;

    let displayRound: number | null = null;
    if (m.original_game_id != null) {
      const orig = origMap.get(m.original_game_id);
      if (orig?.round?.type === RoundType.REGULAR) {
        displayRound = orig.round.ronde_nummer;
      }
    }
    if (displayRound == null) {
      const rn = m.round.ronde_nummer;
      if (typeof rn === "number" && rn >= 1000) {
        displayRound = rn - 1000;
      }
    }
    if (displayRound == null) continue;

    const key = `${tid}-${displayRound}-${pairKeyMegaschaak(p1, p2)}`;
    if (seen.has(key)) continue;

    if (gameInvolvesMegaschaakExcludedPlayer(m, excludedUserIds)) continue;

    seen.add(key);
    out.push({
      ...m,
      _megaschaak_round: {
        tournament_id: tid,
        ronde_nummer: displayRound,
        type: RoundType.REGULAR,
      },
    });
  }
}

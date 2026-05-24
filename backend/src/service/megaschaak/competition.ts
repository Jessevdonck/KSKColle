import { prisma } from "../data";
import ServiceError from "../../core/serviceError";
import handleDBError from "../handleDBError";

import { activeMegaschaakTournamentInclude } from "./competitionInclude";

type MegaschaakCompetitionCandidate = {
  tournament_id: number;
  naam: string;
  finished: boolean;
  megaschaak_deadline: Date | null;
  _count: { megaschaakTeams: number };
};

type MegaschaakCompetitionGroup = {
  naam: string;
  representativeId: number;
  finished: boolean;
  megaschaak_deadline: Date | null;
  teamCount: number;
  maxTournamentId: number;
};

function buildMegaschaakCompetitionGroups(
  candidates: MegaschaakCompetitionCandidate[],
): MegaschaakCompetitionGroup[] {
  const byNaam = new Map<string, MegaschaakCompetitionCandidate[]>();
  for (const t of candidates) {
    const group = byNaam.get(t.naam) ?? [];
    group.push(t);
    byNaam.set(t.naam, group);
  }

  const groups: MegaschaakCompetitionGroup[] = [];
  for (const [naam, group] of byNaam) {
    const withTeams = group.filter((t) => t._count.megaschaakTeams > 0);
    const pool = withTeams.length > 0 ? withTeams : group;
    pool.sort((a, b) => {
      if (b._count.megaschaakTeams !== a._count.megaschaakTeams) {
        return b._count.megaschaakTeams - a._count.megaschaakTeams;
      }
      return a.tournament_id - b.tournament_id;
    });
    const rep = pool[0]!;
    groups.push({
      naam,
      representativeId: rep.tournament_id,
      finished: group.every((t) => t.finished),
      megaschaak_deadline: rep.megaschaak_deadline,
      teamCount: group.reduce((sum, t) => sum + t._count.megaschaakTeams, 0),
      maxTournamentId: Math.max(...group.map((t) => t.tournament_id)),
    });
  }

  return groups.sort((a, b) => b.maxTournamentId - a.maxTournamentId);
}

function pickCurrentMegaschaakGroup(
  groups: MegaschaakCompetitionGroup[],
): MegaschaakCompetitionGroup | null {
  if (groups.length === 0) return null;

  let selected = groups[0]!;
  for (const group of groups) {
    if (!group.finished && selected.finished) {
      selected = group;
      continue;
    }
    if (group.finished && !selected.finished) continue;
    if (group.maxTournamentId > selected.maxTournamentId) {
      selected = group;
    }
  }
  return selected;
}

/** All tournament_ids for the same competition (all classes share megaschaak teams). */
export async function getMegaschaakCompetitionTournamentIds(
  tournamentId: number,
): Promise<number[]> {
  const tournament = await prisma.tournament.findUnique({
    where: { tournament_id: tournamentId },
    select: { naam: true },
  });
  if (!tournament) {
    throw ServiceError.notFound("Toernooi niet gevonden");
  }
  const siblings = await prisma.tournament.findMany({
    where: { naam: tournament.naam },
    select: { tournament_id: true },
  });
  return siblings.map((t) => t.tournament_id);
}

/**
 * Get the megaschaak tournament to display: prefer an ongoing one, otherwise the most recent (even if finished).
 * Returns the class row that holds megaschaak teams when possible (teams are shared across classes via naam).
 */
async function loadMegaschaakCompetitionCandidates() {
  return prisma.tournament.findMany({
    where: { megaschaak_enabled: true },
    select: {
      tournament_id: true,
      naam: true,
      finished: true,
      megaschaak_deadline: true,
      _count: { select: { megaschaakTeams: true } },
    },
    orderBy: { tournament_id: "desc" },
  });
}

export const getActiveMegaschaakTournament = async () => {
  try {
    const candidates = await loadMegaschaakCompetitionCandidates();
    if (candidates.length === 0) return null;

    const groups = buildMegaschaakCompetitionGroups(candidates);
    const current = pickCurrentMegaschaakGroup(groups);
    if (!current) return null;

    return prisma.tournament.findUnique({
      where: { tournament_id: current.representativeId },
      include: activeMegaschaakTournamentInclude,
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

/** All megaschaak competitions (one entry per toernooi-naam), newest first. */
export const getMegaschaakArchive = async () => {
  try {
    const candidates = await loadMegaschaakCompetitionCandidates();
    if (candidates.length === 0) return [];

    const groups = buildMegaschaakCompetitionGroups(candidates);
    const current = pickCurrentMegaschaakGroup(groups);
    const currentNaam = current?.naam ?? null;

    return groups.map((g) => ({
      tournament_id: g.representativeId,
      naam: g.naam,
      finished: g.finished,
      megaschaak_deadline: g.megaschaak_deadline,
      team_count: g.teamCount,
      is_current: g.naam === currentNaam,
    }));
  } catch (error) {
    throw handleDBError(error);
  }
};


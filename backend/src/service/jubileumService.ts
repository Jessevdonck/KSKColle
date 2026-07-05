import { prisma } from './data';
import { isUserMember } from './lidgeldService';
import { createNotification } from './notificationService';
import { NotificationTypes } from '../types/notification';
import { getLogger } from '../core/logging';

const logger = getLogger();

export const JUBILEUM_MIJLPALEN = [25, 50] as const;

/**
 * Jubileum-mijlpaal van een lid: 50 of 25 (jaar lid) of null.
 * Onderbrekingen tellen niet mee als reset: we rekenen vanaf lid_sinds.
 * De mijlpaal blijft gelden vanaf het jubileumjaar (een 30-jarig lid toont "25 jaar").
 */
export function jubileumJaren(
  lidSinds: Date | string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!lidSinds) return null;
  const start = new Date(lidSinds);
  if (isNaN(start.getTime())) return null;
  const jaren = now.getFullYear() - start.getFullYear();
  if (jaren >= 50) return 50;
  if (jaren >= 25) return 25;
  return null;
}

/**
 * Viert dit lid dít jaar zijn jubileum (exact 25 of 50 jaar lid)?
 * Gebruikt voor de uitlichting in de spelerslijst; op het profiel
 * blijft de mijlpaal-badge (jubileumJaren) ook na het jubileumjaar staan.
 */
export function isJubileumJaar(
  lidSinds: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!lidSinds) return false;
  const start = new Date(lidSinds);
  if (isNaN(start.getTime())) return false;
  const jaren = now.getFullYear() - start.getFullYear();
  return (JUBILEUM_MIJLPALEN as readonly number[]).includes(jaren);
}

/**
 * Zoek leden die dit jaar exact 25 of 50 jaar lid zijn.
 * Voorwaarde: men moet op het moment van het jubileum effectief lid zijn
 * (geldig lidgeld/bondslidgeld/jeugdlidgeld); onderbrekingen ervoor mogen.
 */
export async function findJubilarissen(now: Date = new Date()) {
  const users = await prisma.user.findMany({
    select: {
      user_id: true,
      voornaam: true,
      achternaam: true,
      lid_sinds: true,
      lidgeld_betaald: true,
      lidgeld_periode_eind: true,
      bondslidgeld_betaald: true,
      bondslidgeld_periode_eind: true,
      jeugdlidgeld_betaald: true,
      jeugdlidgeld_periode_eind: true,
    },
  });

  const currentYear = now.getFullYear();

  return users
    .map((user) => ({
      user,
      jaren: currentYear - new Date(user.lid_sinds).getFullYear(),
    }))
    .filter(
      ({ user, jaren }) =>
        (JUBILEUM_MIJLPALEN as readonly number[]).includes(jaren) &&
        isUserMember(user),
    )
    .map(({ user, jaren }) => ({
      user_id: user.user_id,
      voornaam: user.voornaam,
      achternaam: user.achternaam,
      jaren,
    }));
}

/**
 * Bij het begin van het jaar: stuur alle admins een notificatie met de
 * jubilarissen van dat jaar. Idempotent: per jaar maximaal één melding
 * (herstart van de server maakt geen duplicaten).
 */
export async function checkJubileaAndNotifyAdmins(now: Date = new Date()): Promise<void> {
  const currentYear = now.getFullYear();

  // Al gemeld dit jaar?
  const existing = await prisma.notification.findFirst({
    where: {
      type: NotificationTypes.JUBILEUM,
      created_at: {
        gte: new Date(currentYear, 0, 1),
      },
    },
    select: { notification_id: true },
  });
  if (existing) return;

  const jubilarissen = await findJubilarissen(now);
  if (jubilarissen.length === 0) return;

  const lijst = jubilarissen
    .map((j) => `${j.voornaam} ${j.achternaam} (${j.jaren} jaar lid)`)
    .join(', ');

  // Alle admins verwittigen (is_admin of 'admin' in roles)
  const users = await prisma.user.findMany({
    select: { user_id: true, is_admin: true, roles: true },
  });
  const admins = users.filter((user) => {
    if (user.is_admin) return true;
    const roles =
      typeof user.roles === 'string'
        ? (() => {
            try {
              return JSON.parse(user.roles);
            } catch {
              return [];
            }
          })()
        : user.roles;
    return Array.isArray(roles) && roles.includes('admin');
  });

  for (const admin of admins) {
    try {
      await createNotification({
        user_id: admin.user_id,
        type: NotificationTypes.JUBILEUM,
        title: `Jubilarissen ${currentYear}`,
        message: `Dit jaar vieren we: ${lijst}. Vergeet hen niet in de bloemetjes te zetten!`,
      });
    } catch (error) {
      logger.error('Kon jubileum-notificatie niet versturen', {
        admin_id: admin.user_id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info('Jubileum-notificaties verstuurd', {
    jaar: currentYear,
    jubilarissen: jubilarissen.length,
    admins: admins.length,
  });
}

let jubileumInterval: ReturnType<typeof setInterval> | undefined;

/**
 * Dagelijkse check (en één keer bij het opstarten). De check zelf is
 * idempotent per jaar, dus dit stuurt effectief één melding per jaar,
 * kort na nieuwjaar (of bij de eerste start van de server in het nieuwe jaar).
 */
export function startJubileumScheduler(): void {
  checkJubileaAndNotifyAdmins().catch((error) => {
    logger.error('Jubileum-check bij opstarten mislukt', {
      error: error instanceof Error ? error.message : String(error),
    });
  });

  jubileumInterval = setInterval(() => {
    checkJubileaAndNotifyAdmins().catch((error) => {
      logger.error('Dagelijkse jubileum-check mislukt', {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }, 24 * 60 * 60 * 1000);
  jubileumInterval.unref?.();
}

export function stopJubileumScheduler(): void {
  if (jubileumInterval) clearInterval(jubileumInterval);
}

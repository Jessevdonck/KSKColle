import { PrismaClient } from '@prisma/client';
import { getLogger } from '../core/logging';
import config from 'config';

/**
 * Zonder expliciete limiet kiest Prisma zelf een poolgrootte op basis van het
 * aantal CPU's van de host (cores * 2 + 1). Op Railway leverde dat een piek van
 * 130 gelijktijdige verbindingen op, en elke MySQL-verbinding kost daar ~2 MB
 * aan buffers plus een thread stack. Tien verbindingen is ruim voldoende: de
 * queries duren milliseconden, dus ook bij 30-40 gelijktijdige bezoekers staat
 * er hooguit kort iets in de wachtrij.
 */
const POOL_GROOTTE = 10;

function databaseUrlMetPool(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  // Staat er al een connection_limit in de omgevingsvariabele, dan die respecteren
  if (url.includes('connection_limit=')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}connection_limit=${POOL_GROOTTE}`;
}

const prismaOptions: any = {
  log: config.get<string>('env') === 'development'
    ? ['query', 'error', 'warn']
    : ['error'], // Only log errors in production
};

const urlMetPool = databaseUrlMetPool();
if (urlMetPool) {
  prismaOptions.datasources = { db: { url: urlMetPool } };
}

export const prisma = new PrismaClient(prismaOptions);

export async function initializeData(): Promise<void> {
  const logger = getLogger();
  
  // Log database URL (mask password for security)
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
    logger.info('Connecting to database', { databaseUrl: maskedUrl });
  } else {
    logger.warn('DATABASE_URL environment variable is not set');
  }

  await prisma.$connect();

  logger.info('Succesfully connected to the database');
}

export async function shutdownData(): Promise<void> {
  getLogger().info('Shutting down database connection');

  await prisma?.$disconnect();

  getLogger().info('Database connection closed');
}
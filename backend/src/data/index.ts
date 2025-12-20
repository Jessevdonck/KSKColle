import { PrismaClient } from '@prisma/client';
import { getLogger } from '../core/logging';

export const prisma = new PrismaClient();

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
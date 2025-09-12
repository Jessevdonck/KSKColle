import { prisma } from './data';
import handleDBError from './handleDBError';
import { getLogger } from '../core/logging';

const logger = getLogger();

export interface LidgeldUpdateData {
  lidgeld_betaald?: boolean;
  lidgeld_periode_start?: Date | null;
  lidgeld_periode_eind?: Date | null;
  bondslidgeld_betaald?: boolean;
  bondslidgeld_periode_start?: Date | null;
  bondslidgeld_periode_eind?: Date | null;
}

/**
 * Update lidgeld status for a user
 */
export const updateLidgeldStatus = async (
  userId: number, 
  data: LidgeldUpdateData
): Promise<void> => {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed, so August is 7
    const currentDay = today.getDate();
    
    // If we're past August 31st this year, use next year's August 31st
    const yearForAugust31 = (currentMonth > 7 || (currentMonth === 7 && currentDay > 31)) 
      ? currentYear + 1 
      : currentYear;
    
    const august31 = new Date(yearForAugust31, 7, 31); // August 31st
    
    const updateData: any = {};
    
    // Only update fields that are provided
    if (data.lidgeld_betaald !== undefined) {
      updateData.lidgeld_betaald = data.lidgeld_betaald;
      // If marking as paid, set start to today and end to August 31st
      if (data.lidgeld_betaald === true) {
        updateData.lidgeld_periode_start = data.lidgeld_periode_start || today;
        updateData.lidgeld_periode_eind = data.lidgeld_periode_eind || august31;
      }
    }
    
    if (data.bondslidgeld_betaald !== undefined) {
      updateData.bondslidgeld_betaald = data.bondslidgeld_betaald;
      // If marking as paid, set start to today and end to August 31st
      if (data.bondslidgeld_betaald === true) {
        updateData.bondslidgeld_periode_start = data.bondslidgeld_periode_start || today;
        updateData.bondslidgeld_periode_eind = data.bondslidgeld_periode_eind || august31;
      }
    }
    
    // Update date fields if provided
    if (data.lidgeld_periode_start !== undefined) {
      updateData.lidgeld_periode_start = data.lidgeld_periode_start;
    }
    if (data.lidgeld_periode_eind !== undefined) {
      updateData.lidgeld_periode_eind = data.lidgeld_periode_eind;
    }
    if (data.bondslidgeld_periode_start !== undefined) {
      updateData.bondslidgeld_periode_start = data.bondslidgeld_periode_start;
    }
    if (data.bondslidgeld_periode_eind !== undefined) {
      updateData.bondslidgeld_periode_eind = data.bondslidgeld_periode_eind;
    }

    await prisma.user.update({
      where: { user_id: userId },
      data: updateData
    });

    logger.info('Lidgeld status updated', { userId, data: updateData });
  } catch (error) {
    logger.error('Failed to update lidgeld status', { error, userId, data });
    throw handleDBError(error);
  }
};

/**
 * Get all users with their lidgeld status
 */
export const getUsersWithLidgeldStatus = async () => {
  try {
    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        voornaam: true,
        achternaam: true,
        email: true,
        tel_nummer: true,
        lidgeld_betaald: true,
        lidgeld_periode_start: true,
        lidgeld_periode_eind: true,
        bondslidgeld_betaald: true,
        bondslidgeld_periode_start: true,
        bondslidgeld_periode_eind: true,
        roles: true
      },
      orderBy: [
        { achternaam: 'asc' },
        { voornaam: 'asc' }
      ]
    });

    return users;
  } catch (error) {
    logger.error('Failed to get users with lidgeld status', { error });
    throw handleDBError(error);
  }
};

/**
 * Check if user has valid membership (either lidgeld or bondslidgeld paid and not expired)
 */
export const isUserMember = (user: {
  lidgeld_betaald: boolean | null | undefined;
  lidgeld_periode_eind?: Date | null;
  bondslidgeld_betaald: boolean | null | undefined;
  bondslidgeld_periode_eind?: Date | null;
}): boolean => {
  const now = new Date();
  
  const lidgeldValid = Boolean(user.lidgeld_betaald === true && 
    user.lidgeld_periode_eind && 
    user.lidgeld_periode_eind > now);
    
  const bondslidgeldValid = Boolean(user.bondslidgeld_betaald === true && 
    user.bondslidgeld_periode_eind && 
    user.bondslidgeld_periode_eind > now);
    
  return lidgeldValid || bondslidgeldValid;
};

/**
 * Get membership status for a user
 */
export const getMembershipStatus = (user: {
  lidgeld_betaald: boolean | null | undefined;
  lidgeld_periode_eind?: Date | null;
  bondslidgeld_betaald: boolean | null | undefined;
  bondslidgeld_periode_eind?: Date | null;
}): {
  isMember: boolean;
  lidgeldValid: boolean;
  bondslidgeldValid: boolean;
  expiresAt?: Date;
} => {
  const now = new Date();
  
  const lidgeldValid = Boolean(user.lidgeld_betaald === true && 
    user.lidgeld_periode_eind && 
    user.lidgeld_periode_eind > now);
    
  const bondslidgeldValid = Boolean(user.bondslidgeld_betaald === true && 
    user.bondslidgeld_periode_eind && 
    user.bondslidgeld_periode_eind > now);
    
  const isMember = lidgeldValid || bondslidgeldValid;
  
  // Get the latest expiration date
  const expiresAt = [user.lidgeld_periode_eind, user.bondslidgeld_periode_eind]
    .filter(Boolean)
    .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0] as Date | undefined;
    
  return {
    isMember,
    lidgeldValid,
    bondslidgeldValid,
    expiresAt
  };
};

import { prisma } from './data';
import handleDBError from './handleDBError';
import { getLogger } from '../core/logging';
import Role from '../core/roles';

const logger = getLogger();

export interface LidgeldUpdateData {
  lidgeld_betaald?: boolean;
  lidgeld_periode_start?: Date | null;
  lidgeld_periode_eind?: Date | null;
  bondslidgeld_betaald?: boolean;
  bondslidgeld_periode_start?: Date | null;
  bondslidgeld_periode_eind?: Date | null;
  jeugdlidgeld_betaald?: boolean;
  jeugdlidgeld_periode_start?: Date | null;
  jeugdlidgeld_periode_eind?: Date | null;
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
    
    if (data.jeugdlidgeld_betaald !== undefined) {
      updateData.jeugdlidgeld_betaald = data.jeugdlidgeld_betaald;
      // If marking as paid, set start to today and end to August 31st
      if (data.jeugdlidgeld_betaald === true) {
        updateData.jeugdlidgeld_periode_start = data.jeugdlidgeld_periode_start || today;
        updateData.jeugdlidgeld_periode_eind = data.jeugdlidgeld_periode_eind || august31;
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
    if (data.jeugdlidgeld_periode_start !== undefined) {
      updateData.jeugdlidgeld_periode_start = data.jeugdlidgeld_periode_start;
    }
    if (data.jeugdlidgeld_periode_eind !== undefined) {
      updateData.jeugdlidgeld_periode_eind = data.jeugdlidgeld_periode_eind;
    }

    await prisma.user.update({
      where: { user_id: userId },
      data: updateData
    });

    // Automatically update user role based on membership status
    await updateUserRoleBasedOnMembership(userId);

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
        is_youth: true,
        lidgeld_betaald: true,
        lidgeld_periode_start: true,
        lidgeld_periode_eind: true,
        bondslidgeld_betaald: true,
        bondslidgeld_periode_start: true,
        bondslidgeld_periode_eind: true,
        jeugdlidgeld_betaald: true,
        jeugdlidgeld_periode_start: true,
        jeugdlidgeld_periode_eind: true,
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
  jeugdlidgeld_betaald?: boolean | null | undefined;
  jeugdlidgeld_periode_eind?: Date | null;
}): boolean => {
  const now = new Date();
  
  const lidgeldValid = Boolean(user.lidgeld_betaald === true && 
    user.lidgeld_periode_eind && 
    user.lidgeld_periode_eind > now);
    
  const bondslidgeldValid = Boolean(user.bondslidgeld_betaald === true && 
    user.bondslidgeld_periode_eind && 
    user.bondslidgeld_periode_eind > now);
    
  const jeugdlidgeldValid = Boolean(user.jeugdlidgeld_betaald === true && 
    user.jeugdlidgeld_periode_eind && 
    user.jeugdlidgeld_periode_eind > now);
    
  return lidgeldValid || bondslidgeldValid || jeugdlidgeldValid;
};

/**
 * Get membership status for a user
 */
export const getMembershipStatus = (user: {
  lidgeld_betaald: boolean | null | undefined;
  lidgeld_periode_eind?: Date | null;
  bondslidgeld_betaald: boolean | null | undefined;
  bondslidgeld_periode_eind?: Date | null;
  jeugdlidgeld_betaald?: boolean | null | undefined;
  jeugdlidgeld_periode_eind?: Date | null;
}): {
  isMember: boolean;
  lidgeldValid: boolean;
  bondslidgeldValid: boolean;
  jeugdlidgeldValid: boolean;
  expiresAt?: Date | undefined;
} => {
  const now = new Date();
  
  const lidgeldValid = Boolean(user.lidgeld_betaald === true && 
    user.lidgeld_periode_eind && 
    user.lidgeld_periode_eind > now);
    
  const bondslidgeldValid = Boolean(user.bondslidgeld_betaald === true && 
    user.bondslidgeld_periode_eind && 
    user.bondslidgeld_periode_eind > now);
    
  const jeugdlidgeldValid = Boolean(user.jeugdlidgeld_betaald === true && 
    user.jeugdlidgeld_periode_eind && 
    user.jeugdlidgeld_periode_eind > now);
    
  const isMember = lidgeldValid || bondslidgeldValid || jeugdlidgeldValid;
  
  // Get the latest expiration date
  const expiresAt = [user.lidgeld_periode_eind, user.bondslidgeld_periode_eind, user.jeugdlidgeld_periode_eind]
    .filter(Boolean)
    .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0] as Date | undefined;
    
  return {
    isMember,
    lidgeldValid,
    bondslidgeldValid,
    jeugdlidgeldValid,
    expiresAt
  };
};

/**
 * Automatically update user role based on membership status
 * - If user has valid membership: ensure they have 'user' role (and remove 'exlid' if present)
 * - If user has no valid membership: set role to 'exlid' (and remove other roles)
 */
const updateUserRoleBasedOnMembership = async (userId: number): Promise<void> => {
  try {
    // Get user with current lidgeld status
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        roles: true,
        lidgeld_betaald: true,
        lidgeld_periode_eind: true,
        bondslidgeld_betaald: true,
        bondslidgeld_periode_eind: true,
        jeugdlidgeld_betaald: true,
        jeugdlidgeld_periode_eind: true,
        is_admin: true
      }
    });

    if (!user) {
      logger.warn('User not found for role update', { userId });
      return;
    }

    // Parse current roles
    const currentRoles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles;
    
    // Check membership status
    const membershipStatus = getMembershipStatus({
      lidgeld_betaald: user.lidgeld_betaald,
      lidgeld_periode_eind: user.lidgeld_periode_eind,
      bondslidgeld_betaald: user.bondslidgeld_betaald,
      bondslidgeld_periode_eind: user.bondslidgeld_periode_eind,
      jeugdlidgeld_betaald: user.jeugdlidgeld_betaald,
      jeugdlidgeld_periode_eind: user.jeugdlidgeld_periode_eind
    });

    let newRoles: string[] = [];

    if (membershipStatus.isMember) {
      // User has valid membership - ensure they have 'user' role
      if (user.is_admin) {
        // Admin users keep admin + user roles
        newRoles = [Role.ADMIN, Role.USER];
      } else if (currentRoles.includes(Role.BESTUURSLID)) {
        // Bestuurslid users keep bestuurslid + user roles
        newRoles = [Role.BESTUURSLID, Role.USER];
      } else {
        // Regular users just get user role
        newRoles = [Role.USER];
      }
      
      logger.info('Membership valid - updating roles to active member', { 
        userId, 
        oldRoles: currentRoles, 
        newRoles,
        membershipStatus 
      });
    } else {
      // User has no valid membership - set to exlid
      newRoles = [Role.EXLID];
      
      logger.info('Membership expired - updating roles to exlid', { 
        userId, 
        oldRoles: currentRoles, 
        newRoles,
        membershipStatus 
      });
    }

    // Only update if roles actually changed
    const rolesChanged = JSON.stringify(currentRoles.sort()) !== JSON.stringify(newRoles.sort());
    
    if (rolesChanged) {
      await prisma.user.update({
        where: { user_id: userId },
        data: { roles: JSON.stringify(newRoles) }
      });
      
      logger.info('User roles updated successfully', { userId, newRoles });
    } else {
      logger.info('User roles unchanged', { userId, roles: newRoles });
    }

  } catch (error) {
    logger.error('Failed to update user role based on membership', { error, userId });
    throw handleDBError(error);
  }
};

/**
 * Update roles for all users based on their current membership status
 * Useful for batch processing or maintenance tasks
 */
export const updateAllUserRolesBasedOnMembership = async (): Promise<{
  updated: number;
  unchanged: number;
  errors: number;
}> => {
  try {
    logger.info('Starting batch role update for all users based on membership status');
    
    // Get all users with their membership status
    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        roles: true,
        lidgeld_betaald: true,
        lidgeld_periode_eind: true,
        bondslidgeld_betaald: true,
        bondslidgeld_periode_eind: true,
        jeugdlidgeld_betaald: true,
        jeugdlidgeld_periode_eind: true,
        is_admin: true
      }
    });

    let updated = 0;
    let unchanged = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Parse current roles
        const currentRoles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles;
        
        // Check membership status
        const membershipStatus = getMembershipStatus({
          lidgeld_betaald: user.lidgeld_betaald,
          lidgeld_periode_eind: user.lidgeld_periode_eind,
          bondslidgeld_betaald: user.bondslidgeld_betaald,
          bondslidgeld_periode_eind: user.bondslidgeld_periode_eind,
          jeugdlidgeld_betaald: user.jeugdlidgeld_betaald,
          jeugdlidgeld_periode_eind: user.jeugdlidgeld_periode_eind
        });

        let newRoles: string[] = [];

        if (membershipStatus.isMember) {
          // User has valid membership
          if (user.is_admin) {
            newRoles = [Role.ADMIN, Role.USER];
          } else if (currentRoles.includes(Role.BESTUURSLID)) {
            newRoles = [Role.BESTUURSLID, Role.USER];
          } else {
            newRoles = [Role.USER];
          }
        } else {
          // User has no valid membership
          newRoles = [Role.EXLID];
        }

        // Check if roles need to be updated
        const rolesChanged = JSON.stringify(currentRoles.sort()) !== JSON.stringify(newRoles.sort());
        
        if (rolesChanged) {
          await prisma.user.update({
            where: { user_id: user.user_id },
            data: { roles: JSON.stringify(newRoles) }
          });
          
          updated++;
          logger.info('User role updated in batch', { 
            userId: user.user_id, 
            oldRoles: currentRoles, 
            newRoles,
            membershipStatus 
          });
        } else {
          unchanged++;
        }

      } catch (error) {
        errors++;
        logger.error('Failed to update user role in batch', { error, userId: user.user_id });
      }
    }

    logger.info('Batch role update completed', { updated, unchanged, errors, total: users.length });
    
    return { updated, unchanged, errors };
  } catch (error) {
    logger.error('Failed to perform batch role update', { error });
    throw handleDBError(error);
  }
};

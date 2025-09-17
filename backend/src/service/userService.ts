import { prisma } from "./data";
import type { User, UserUpdateInput, PublicUser, RegisterUserRequest } from '../types/user';
import { hashPassword, verifyPassword } from "../core/password";
import ServiceError from "../core/serviceError";
import handleDBError from "./handleDBError";

import jwt from 'jsonwebtoken';
import { getLogger } from "../core/logging";
import { generateJWT, verifyJWT } from "../core/jwt";
import type { SessionInfo } from '../types/auth';

const makeExposedUser = ({ 
  user_id, 
  voornaam, 
  achternaam, 
  schaakrating_elo, 
  fide_id,  
  email,
  tel_nummer,
  vast_nummer,
  geboortedatum,
  max_rating,
  rating_difference,
  lid_sinds,
  roles,
  avatar_url,
  lidgeld_betaald,
  lidgeld_periode_start,
  lidgeld_periode_eind,
  bondslidgeld_betaald,
  bondslidgeld_periode_start,
  bondslidgeld_periode_eind,
  }: any): PublicUser => ({
    user_id, 
    voornaam, 
    achternaam, 
    schaakrating_elo, 
    fide_id,  
    email,
    tel_nummer,
    vast_nummer,
    geboortedatum,
    max_rating,
    rating_difference,
    lid_sinds,
    roles: typeof roles === 'string' ? JSON.parse(roles) : roles,
    avatar_url,
    lidgeld_betaald,
    lidgeld_periode_start,
    lidgeld_periode_eind,
    bondslidgeld_betaald,
    bondslidgeld_periode_start,
    bondslidgeld_periode_eind,
  } as PublicUser)

export const getAllUsers = async (): Promise<User[]> => {
  try {
    return await prisma.user.findMany();
  } catch (error) {
    throw handleDBError(error);
  }
};

export const getUsersPaginated = async (page: number = 1, limit: number = 50): Promise<{ users: User[], total: number, totalPages: number }> => {
  try {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { achternaam: 'asc' }
      }),
      prisma.user.count()
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return { users, total, totalPages };
  } catch (error) {
    throw handleDBError(error);
  }
};

export const getAllPublicUsers = async (): Promise<PublicUser[]> => {
  try {
    const users = await prisma.user.findMany();

    return users.map(makeExposedUser);
  } catch (error) {
    throw handleDBError(error);
  }
};

export const getUserById = async (user_id: number): Promise<PublicUser> => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        user_id,
      }
    });

    if (!user) {
      throw ServiceError.notFound('No user with this id exists');
    }

    return makeExposedUser(user);
  } catch (error) {
    throw handleDBError(error);
  }
};

export const getUserByNaam = async (voornaam: string, achternaam: string): Promise<PublicUser | null> => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        voornaam,
        achternaam,
      }
    });

    if (!user) {
      return null;
    }
    return makeExposedUser(user);
  } catch (error) {
    throw handleDBError(error);
  }
};

export const login = async (
  email: string,
  password: string,
): Promise<string> => {
  // Trim trailing spaces from password
  const trimmedPassword = password.trim();
  
  const user = await prisma.user.findUnique({ where: { email } }); 

  if (!user) {
    throw ServiceError.unauthorized(
      'The given email and password do not match',
    );
  }

  const passwordValid = await verifyPassword(trimmedPassword, user.password_hash);

  if (!passwordValid) {
    throw ServiceError.unauthorized(
      'The given email and password do not match',
    );
  }

  // Parse roles from JSON string if needed
  const userWithParsedRoles = {
    ...user,
    roles: typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles
  };
  
  return await generateJWT(userWithParsedRoles); 
};

export const register = async (user: RegisterUserRequest): Promise<string> => {
  try {
    const { password, roles, ...userDataWithoutPassword } = user;
    
    // Trim trailing spaces from password
    const trimmedPassword = password.trim();
    const passwordHash = await hashPassword(trimmedPassword);
    
    // Process roles according to the new logic
    let finalRoles: string[] = [];
    
    if (!roles || roles.length === 0) {
      // If no roles are selected, default to "user"
      finalRoles = ["user"];
    } else if (roles.includes("exlid")) {
      // If "exlid" is selected, only "exlid" role (no other roles)
      finalRoles = ["exlid"];
    } else {
      // If other roles are selected, add them to the array (including "user" if not already present)
      finalRoles = [...roles];
      if (!finalRoles.includes("user")) {
        finalRoles.push("user");
      }
    }

    const createdUser = await prisma.user.create({
      data: {
        ...userDataWithoutPassword,
        schaakrating_elo: user.schaakrating_elo ?? 0,
        password_hash: passwordHash,
        roles: JSON.stringify(finalRoles),
      },
    });
    
    if(!createdUser){
      throw ServiceError.internalServerError("An unexpected error occurred when creating the user");
    }
    
    // Parse roles from JSON string if needed
    const userWithParsedRoles = {
      ...createdUser,
      roles: typeof createdUser.roles === 'string' ? JSON.parse(createdUser.roles) : createdUser.roles
    };
    
    return generateJWT(userWithParsedRoles);
  } catch (error: any) {
    throw handleDBError(error);
  }
};


export const updateUser = async (user_id: number, changes: UserUpdateInput): Promise<PublicUser> => {
  try {
    const { roles, ...userDataWithoutPassword } = changes;
    
    // Process roles according to the new logic
    let finalRoles: string[] = [];
    
    if (!roles || roles.length === 0) {
      // If no roles are selected, default to "user"
      finalRoles = ["user"];
    } else if (roles.includes("exlid")) {
      // If "exlid" is selected, only "exlid" role (no other roles)
      finalRoles = ["exlid"];
    } else {
      // If other roles are selected, add them to the array (including "user" if not already present)
      finalRoles = [...roles];
      if (!finalRoles.includes("user")) {
        finalRoles.push("user");
      }
    }

    // Clean up the data - convert empty strings to null for optional fields
    const cleanedData = { ...userDataWithoutPassword };
    
    // Convert empty strings to null for optional fields
    if (cleanedData.email === '') {
      cleanedData.email = null;
    }
    if (cleanedData.tel_nummer === '') {
      cleanedData.tel_nummer = null;
    }
    if (cleanedData.vast_nummer === '') {
      cleanedData.vast_nummer = null;
    }
    if (cleanedData.fide_id === '') {
      cleanedData.fide_id = null;
    }
    if (cleanedData.schaakrating_max === '') {
      cleanedData.schaakrating_max = null;
    }

    const user = await prisma.user.update({
      where: { user_id },
      data: {
        ...cleanedData,
        roles: JSON.stringify(finalRoles),
      },
    });

    return makeExposedUser(user);
  } catch (error) {
    throw handleDBError(error);
  }
};

export const updatePassword = async (userId: number, currentPassword: string, newPassword: string): Promise<void> => {
  try {
    // Trim trailing spaces from passwords
    const trimmedCurrentPassword = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();
    
    const user = await prisma.user.findUnique({ where: { user_id: userId } });

    if (!user) {
      throw ServiceError.notFound('User not found');
    }

    const passwordValid = await verifyPassword(trimmedCurrentPassword, user.password_hash);

    if (!passwordValid) {
      throw ServiceError.unauthorized('Current password is incorrect');
    }

    const newPasswordHash = await hashPassword(trimmedNewPassword);

    await prisma.user.update({
      where: { user_id: userId },
      data: { password_hash: newPasswordHash },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const removeUser = async (user_id: number): Promise<void> => {
  try {
    // First, delete all related data to avoid foreign key constraint violations
    await prisma.$transaction(async (tx) => {
      // Delete games where user is speler1, speler2, or winnaar
      await tx.game.deleteMany({
        where: {
          OR: [
            { speler1_id: user_id },
            { speler2_id: user_id },
            { winnaar_id: user_id }
          ]
        }
      });

      // Delete participations
      await tx.participation.deleteMany({
        where: { user_id }
      });

      // Delete password reset tokens
      await tx.passwordResetToken.deleteMany({
        where: { user_id }
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { user_id }
      });
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const checkAndParseSession = async (
  authHeader?: string,
): Promise<SessionInfo> => {
  if (!authHeader) {
    throw ServiceError.unauthorized('You need to be signed in');
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw ServiceError.unauthorized('Invalid authentication token');
  }

  const authToken = authHeader.substring(7);

  try {
    const { roles, sub } = await verifyJWT(authToken); 

    // Ensure roles is always an array and parse JSON if needed
    let rolesArray: string[] = [];
    if (Array.isArray(roles)) {
      rolesArray = roles;
    } else if (typeof roles === 'string') {
      try {
        rolesArray = JSON.parse(roles);
      } catch (e) {
        rolesArray = [];
      }
    }

    return {
      userId: Number(sub),
      roles: rolesArray,
    };
  } catch (error: any) {
    getLogger().error(error.message, { error });

    if (error instanceof jwt.TokenExpiredError) {
      throw ServiceError.unauthorized('The token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw ServiceError.unauthorized(
        `Invalid authentication token: ${error.message}`,
      );
    } else {
      throw ServiceError.unauthorized(error.message);
    }
  }
};


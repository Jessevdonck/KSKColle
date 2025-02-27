import { prisma } from "./data";
import type { User, UserUpdateInput, PublicUser, RegisterUserRequest } from '../types/user';
import { hashPassword, verifyPassword } from "../core/password";
import ServiceError from "../core/serviceError";
import handleDBError from "./handleDBError";
import Role from '../core/roles';
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
  roles,
  }: User): PublicUser => ({
    user_id, 
    voornaam, 
    achternaam, 
    schaakrating_elo, 
    fide_id,  
    email,
    roles
  } as PublicUser)

export const getAllUsers = async (): Promise<User[]> => {
  try {
    return await prisma.user.findMany();
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
  const user = await prisma.user.findUnique({ where: { email } }); 

  if (!user) {
    throw ServiceError.unauthorized(
      'The given email and password do not match',
    );
  }

  const passwordValid = await verifyPassword(password, user.password_hash);

  if (!passwordValid) {
    throw ServiceError.unauthorized(
      'The given email and password do not match',
    );
  }

  return await generateJWT(user); 
};

export const register = async (user: RegisterUserRequest): Promise<string> => {
  try {
    const { password, roles, ...userDataWithoutPassword } = user;
    
    const passwordHash = await hashPassword(password);
    
    const roleList = roles.includes('admin') ? [Role.USER, Role.ADMIN] : [Role.USER];

    const createdUser = await prisma.user.create({
      data: {
        ...userDataWithoutPassword,
        password_hash: passwordHash,
        roles: JSON.stringify(roleList),
      },
    });
    
    if(!createdUser){
      throw ServiceError.internalServerError("An unexpected error occurred when creating the user");
    }
    return generateJWT(createdUser);
  } catch (error: any) {
    throw handleDBError(error);
  }
};


export const updateUser = async (user_id: number, changes: UserUpdateInput): Promise<PublicUser> => {
  try {
    const { roles, ...userDataWithoutPassword } = changes;
    
    const roleList = roles.includes('admin') ? [Role.USER, Role.ADMIN] : [Role.USER];

    const user = await prisma.user.update({
      where: { user_id },
      data: {
        ...userDataWithoutPassword,
        roles: JSON.stringify(roleList),
      },
    });

    return makeExposedUser(user);
  } catch (error) {
    throw handleDBError(error);
  }
};

export const updatePassword = async (userId: number, currentPassword: string, newPassword: string): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { user_id: userId } });

    if (!user) {
      throw ServiceError.notFound('User not found');
    }

    const passwordValid = await verifyPassword(currentPassword, user.password_hash);

    if (!passwordValid) {
      throw ServiceError.unauthorized('Current password is incorrect');
    }

    const newPasswordHash = await hashPassword(newPassword);

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
    await prisma.user.delete({
      where: {user_id,},
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

    return {
      userId: Number(sub),
      roles,
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

export const checkRole = (role: string, roles: string[]): void => {
  const hasPermission = roles.includes(role); 

  if (!hasPermission) {
    throw ServiceError.forbidden(
      'You are not allowed to view this part of the application',
    );
  }
};
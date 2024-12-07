import { prisma } from "./data/";
import type { User, UserCreateInput, UserUpdateInput } from '../types/user';
import ServiceError from "../core/serviceError";
import handleDBError from "./handleDBError";

const USER_SELECT = {
  user_id: true,
  voornaam: true,
  achternaam: true,
  geboortedatum: true,
  schaakrating_elo: true,
  schaakrating_difference: true,
  schaakrating_max: true,
  email: true,
  is_admin: true,
  fide_id: true,
  lid_sinds: true,
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    return await prisma.user.findMany();
  } catch (error) {
    throw handleDBError(error);
  }
};

export const getUserById = async (user_id: number): Promise<User> => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        user_id,
      },
      select: USER_SELECT,
    });

    if (!user) {
      throw ServiceError.notFound('No user with this id exists');
    }

    return user;
  } catch (error) {
    throw handleDBError(error);
  }
};

export const getUserByNaam = async (voornaam: string, achternaam: string): Promise<User | null> => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        voornaam,
        achternaam,
      },
      select: USER_SELECT,
    });

    if (!user) {
      return null;
    }
    return user;
  } catch (error) {
    throw handleDBError(error);
  }
};

export const createUser = async (user: UserCreateInput) => {
  try {
    return await prisma.user.create({
      data: user,
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const updateUser = async (user_id: number, changes: UserUpdateInput) => {
  try {
    return await prisma.user.update({
      where: {
        user_id,
      },
      data: changes,
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const removeUser = async (user_id: number): Promise<void> => {
  try {
    await prisma.user.delete({
      where: {
        user_id,
      },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};
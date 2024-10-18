import { prisma } from "./data/";
import type { Speler, SpelerCreateInput, SpelerUpdateInput } from '../types/speler';

const SPELER_SELECT = {
  user_id: true,
  voornaam: true,
  achternaam: true,
  geboortedatum: true,
  schaakrating_elo: true,
  schaakrating_difference: true,
  schaakrating_max: true,
  is_admin: true,
  fide_id: true,
  nationaal_id: true,
  lid_sinds: true,
  
};

export const getAllSpelers = (): Promise<Speler[]> => {
  return prisma.user.findMany();
};
  
export const getSpelerById = async (user_id: number): Promise<Speler> => {
  const user = await prisma.user.findUnique({
    where: {
      user_id,
    },
    select: SPELER_SELECT,
  });

  if (!user) {
    throw new Error('No user with this id exists');
  }

  return user;
};

export const getSpelerByNaam = async (voornaam: string, achternaam: string): Promise<Speler | null> => {
  const user = await prisma.user.findFirst({ 
    where: { 
      voornaam: voornaam,
      achternaam: achternaam,
    },
    select: SPELER_SELECT, 
  });

  if (!user) {
    return null; 
  }
  return user;
};
  
export const createSpeler = async (speler: SpelerCreateInput) => {

  return await prisma.user.create({
    data: speler,
  });
};
  
export const updateUser = async (user_id: number, changes:SpelerUpdateInput) => {

  return prisma.user.update({
    where: {
      user_id, 
    },
    data: changes,
  });
};
  
export const removeSpeler = async (user_id: number): Promise<void> => {
  await prisma.user.delete({
    where: {
      user_id,
    },
  });
};
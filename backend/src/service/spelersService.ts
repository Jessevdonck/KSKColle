import { SPELERS } from "./data/mock_data";
import { prisma } from "./data/";

export const getAllSpelers = () => {
  return prisma.user.findMany();
};
  
export const getSpelerById = async (user_id: number) => {
  const user = await prisma.user.findUnique({
    where: {
      user_id,
    },
  });

  if (!user) {
    throw new Error('No user with this id exists');
  }

  return user;
};
  
export const addSpeler = async ({ 
  voornaam,
  achternaam,
  geboortedatum, 
  schaakrating_elo, 
  schaakrating_difference, 
  schaakrating_max, 
  is_admin, fide_id, 
  nationaal_id, 
  lid_sinds}: any) => {
  return prisma.user.create({
    data: {
      voornaam,
      achternaam,
      geboortedatum,
      schaakrating_elo,
      schaakrating_difference,
      schaakrating_max,
      is_admin,
      fide_id,
      nationaal_id,
      lid_sinds,
    },
  });
};
  
export const updateUser = async (
  userId: number,
  voornaam?: string,
  achternaam?: string,
  geboortedatum?: Date,
  schaakrating_elo?: number,
  schaakrating_difference?: number,
  schaakrating_max?: number,
  is_admin?: boolean,
  fide_id?: number,
  nationaal_id?: number,
  lid_sinds?: Date,
) => {
  const updateData: any = {};

  if (voornaam !== undefined) updateData.voornaam = voornaam;
  if (achternaam !== undefined) updateData.achternaam = achternaam;
  if (geboortedatum !== undefined) updateData.geboortedatum = geboortedatum;
  if (schaakrating_elo !== undefined) updateData.schaakrating_elo = schaakrating_elo;
  if (schaakrating_difference !== undefined) updateData.schaakrating_difference = schaakrating_difference;
  if (schaakrating_max !== undefined) updateData.schaakrating_max = schaakrating_max;
  if (is_admin !== undefined) updateData.is_admin = is_admin;
  if (fide_id !== undefined) updateData.fide_id = fide_id;
  if (nationaal_id !== undefined) updateData.nationaal_id = nationaal_id;
  if (lid_sinds !== undefined) updateData.lid_sinds = lid_sinds;

  return prisma.user.update({
    where: {
      user_id: userId, 
    },
    data: updateData,
  });
};
  
export const removeSpeler = async (user_id: number) => {
  await prisma.user.delete({
    where: {
      user_id,
    },
  });
};
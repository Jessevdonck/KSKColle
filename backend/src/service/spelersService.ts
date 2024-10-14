import { prisma } from "./data/";

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

export const getUserWithAllGames = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: SPELER_SELECT,
  });

  return user;
};

export const getAllSpelers = () => {
  return prisma.user.findMany();
};
  
export const getSpelerById = async (user_id: number) => {
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

  console.log(geboortedatum);

  return await prisma.user.create({
    data: {
      voornaam,
      achternaam,
      geboortedatum: new Date(geboortedatum),
      schaakrating_elo,
      schaakrating_difference,
      schaakrating_max,
      is_admin: is_admin !== undefined ? is_admin : false, 
      fide_id: fide_id !== undefined ? fide_id : 0, 
      nationaal_id: nationaal_id !== undefined ? nationaal_id : 0, 
      lid_sinds: new Date(lid_sinds),
    },
  });
};
  
export const updateUser = async (user_id: number, changes:any) => {

  return prisma.user.update({
    where: {
      user_id, 
    },
    data: changes,
  });
};
  
export const removeSpeler = async (user_id: number) => {
  await prisma.user.delete({
    where: {
      user_id,
    },
  });
};
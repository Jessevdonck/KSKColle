import { PrismaClient } from '@prisma/client'; 

const prisma = new PrismaClient(); 

async function main() {

  await prisma.tournament.createMany({
    data: [
      {
        tournament_id: "1",
        naam: 'Herfstcompetitie',
        rondes: 8,
      },
      {
        tournament_id: "2",
        naam: 'Lentecompetitie',
        rondes: 8,
      },
      {
        tournament_id: "3",
        naam: 'Zomertoernooi',
        rondes: 8,
      },
    ],
  });

  await prisma.round.createMany({
    data: [
      {
        tournament_id: '1',
        ronde_nummer: 1,
        ronde_datum: new Date("2024-05-14"), 
      },
      {
        tournament_id: '2',
        ronde_nummer: 2,
        ronde_datum: new Date("2024-05-21"), 
      },
      {
        tournament_id: '3',
        ronde_nummer: 1,
        ronde_datum: new Date("2012-05-02"), 
      },
        
    ],
  });

  await prisma.user.createMany({
    data: [
      { 
        voornaam: "Björn",
        achternaam: "Dyckmans",
        geboortedatum: new Date("1990-01-15"),
        schaakrating_elo: 2174,
        schaakrating_difference: 0,
        schaakrating_max: 2181,
        is_admin: false,
        fide_id: 1234,
        nationaal_id: 1589,
        lid_sinds: new Date("1973-05-01"),
      },
      { 
        voornaam: "Bart",
        achternaam: "Schittekat",
        geboortedatum: new Date("1969-08-01"),
        schaakrating_elo: 2172,
        schaakrating_difference: 0,
        schaakrating_max: 2184,
        is_admin: false,
        fide_id: 9487,
        nationaal_id: 4789,
        lid_sinds: new Date("2010-05-24"),
      },
      { 
        voornaam: "Niels",
        achternaam: "Ongena",
        geboortedatum: new Date("2000-05-14"),
        schaakrating_elo: 2000,
        schaakrating_difference: 0,
        schaakrating_max: 2100,
        is_admin: true,
        fide_id: 8579,
        nationaal_id: 9587,
        lid_sinds: new Date("2021-09-01"),
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
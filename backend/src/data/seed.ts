import { PrismaClient } from '@prisma/client'; 

const prisma = new PrismaClient(); 

async function main() {

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
        fide_id: 202479,
        nationaal_id: 1234,
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
        fide_id: 201413,
        nationaal_id: 4567,
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
        fide_id: 219436,
        nationaal_id: 8901,
        lid_sinds: new Date("2021-09-01"),
      },
    ],
  });

  await prisma.tournament.createMany({
    data: [
      {
        naam: 'Herfstcompetitie',
        rondes: 8,
      },
      {
        naam: 'Lentecompetitie',
        rondes: 8,
      },
      {
        naam: 'Zomertoernooi',
        rondes: 8,
      },
    ],
  });

  await prisma.round.createMany({
    data: [
      {
        tournament_id: 1,
        ronde_nummer: 1,
        ronde_datum: new Date("2024-05-14"), 
      },
      {
        tournament_id: 2,
        ronde_nummer: 2,
        ronde_datum: new Date("2024-05-21"), 
      },
      {
        tournament_id: 3,
        ronde_nummer: 1,
        ronde_datum: new Date("2012-05-02"), 
      },
        
    ],
  });

  await prisma.game.createMany({
    data: [
      {
        round_id: 1,          
        speler1_id: 1,       
        speler2_id: 2,       
        winnaar_id: 1,      
        result: '1-0',       
        uitgestelde_datum: null, 
      },
      {
        round_id: 1,          
        speler1_id: 3,       
        speler2_id: 1,       
        winnaar_id: 3,      
        result: '0-1',      
        uitgestelde_datum: null,
      },
      {
        round_id: 2,        
        speler1_id: 2,      
        speler2_id: 3,      
        winnaar_id: null,   
        result: null,        
        uitgestelde_datum: null, 
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
import { PrismaClient } from '@prisma/client'; 
import { hashPassword } from '../core/password';

const prisma = new PrismaClient(); 

async function main() {

  const passwordHash = await hashPassword('12345678');

  await prisma.user.createMany({
    data: [
      { 
        voornaam: "Björn",
        achternaam: "Dyckmans",
        geboortedatum: new Date("1990-01-15"),
        email: "test6@test.com",
        tel_nummer: "0477186935",
        schaakrating_elo: 2174,
        schaakrating_difference: 0,
        schaakrating_max: 2181,
        is_admin: false,
        fide_id: 202479,
        lid_sinds: new Date("1973-05-01"),
        password_hash: passwordHash,
        roles: ['user'],
      },
      { 
        voornaam: "Bart",
        achternaam: "Schittekat",
        geboortedatum: new Date("1969-08-01"),
        email: "test5@test.com",
        tel_nummer: "04777196895",
        schaakrating_elo: 2172,
        schaakrating_difference: 0,
        schaakrating_max: 2184,
        is_admin: false,
        fide_id: 201413,
        lid_sinds: new Date("2010-05-24"),
        password_hash: passwordHash,
        roles: ['user'],
      },
      { 
        voornaam: "Niels",
        achternaam: "Ongena",
        geboortedatum: new Date("2000-05-14"),
        email: "test4@test.com",
        tel_nummer: "04777689193",
        schaakrating_elo: 2000,
        schaakrating_difference: 0,
        schaakrating_max: 2100,
        is_admin: true,
        fide_id: 219436,
        lid_sinds: new Date("2021-09-01"),
        password_hash: passwordHash,
        roles: ['user', 'admin'],
      },
      { 
        voornaam: "Jesse",
        achternaam: "Vaerendonck",
        geboortedatum: new Date("2003-05-14"),
        email: "test3@test.com",
        tel_nummer:"0477106938",
        schaakrating_elo: 1722,
        schaakrating_difference: 0,
        schaakrating_max: 1722,
        is_admin: false,
        fide_id: 285412,
        lid_sinds: new Date("2021-09-01"),
        password_hash: passwordHash,
        roles: ['user'],
      },
      { 
        voornaam: "Giovanni",
        achternaam: "Berniers",
        geboortedatum: new Date("2003-05-14"),
        email: "test2@test.com",
        tel_nummer: "0477782958",
        schaakrating_elo: 1803,
        schaakrating_difference: 0,
        schaakrating_max: 1926,
        is_admin: false,
        fide_id: 256927,
        lid_sinds: new Date("2021-09-01"),
        password_hash: passwordHash,
        roles: ['user'],
      },
      { 
        voornaam: "Eduardo",
        achternaam: "Semanat Planas",
        geboortedatum: new Date("2003-05-14"),
        email: "test@test.com",
        tel_nummer: "0477719849",
        schaakrating_elo: 2155,
        schaakrating_difference: 0,
        schaakrating_max: 2155,
        is_admin: false,
        fide_id: 3501930,
        lid_sinds: new Date("2021-09-01"),
        password_hash: passwordHash,
        roles: ['user'],
      },
      { 
        voornaam: "Ronny",
        achternaam: "Hanssen",
        geboortedatum: new Date("2003-05-14"),
        email: "test6@test.com",
        tel_nummer: "0477687395",
        schaakrating_elo: 2027,
        schaakrating_difference: 0,
        schaakrating_max: 2028,
        is_admin: false,
        fide_id: 208728,
        lid_sinds: new Date("2021-09-01"),
        password_hash: passwordHash,
        roles: ['user'],
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
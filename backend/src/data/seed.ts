import { PrismaClient } from '@prisma/client'; 
import { hashPassword } from '../core/password';
import Role from '../core/roles';
import { seedArticles } from './seed-articles';

const prisma = new PrismaClient(); 

async function main() {

  const passwordHash = await hashPassword("12345678");

  await prisma.user.createMany({
    data: [
      {
        user_id: 8, 
        voornaam: "Test",
        achternaam: "User",
        geboortedatum: new Date("1990-01-01"),
        email: "testuser@mail.com",
        tel_nummer: "0477123456",
        schaakrating_elo: 1500,
        schaakrating_difference: 0,
        schaakrating_max: 1500,
        is_admin: false, 
        fide_id: 123456,
        lid_sinds: new Date("2020-01-01"),
        password_hash: passwordHash,
        roles: JSON.stringify([Role.USER]) 
      },

      {
        user_id: 9, 
        voornaam: "Admin",
        achternaam: "User",
        geboortedatum: new Date("1985-12-15"),
        email: "adminuser@mail.com",
        tel_nummer: "0477654321",
        schaakrating_elo: 1800,
        schaakrating_difference: 0,
        schaakrating_max: 1800,
        is_admin: true, 
        fide_id: 654321,
        lid_sinds: new Date("2018-01-01"),
        password_hash: passwordHash, 
        roles: JSON.stringify([Role.ADMIN, Role.USER]) 
      },
      
      { user_id: 1, voornaam: "Björn", achternaam: "Dyckmans", geboortedatum: new Date("1990-01-15"), email: "test7@test.com", tel_nummer: "0477186935", schaakrating_elo: 2174, schaakrating_difference: 0, schaakrating_max: 2181, is_admin: false, fide_id: 202479, lid_sinds: new Date("1973-05-01"), password_hash: passwordHash, roles: JSON.stringify([Role.USER]) },
      { user_id: 2, voornaam: "Bart", achternaam: "Schittekat", geboortedatum: new Date("1969-08-01"), email: "test5@test.com", tel_nummer: "04777196895", schaakrating_elo: 2172, schaakrating_difference: 0, schaakrating_max: 2184, is_admin: false, fide_id: 201413, lid_sinds: new Date("2010-05-24"), password_hash: passwordHash, roles: JSON.stringify([Role.USER]) },
      { user_id: 3, voornaam: "Niels", achternaam: "Ongena", geboortedatum: new Date("2000-05-14"), email: "test4@test.com", tel_nummer: "04777689193", schaakrating_elo: 2000, schaakrating_difference: 0, schaakrating_max: 2100, is_admin: true, fide_id: 219436, lid_sinds: new Date("2021-09-01"), password_hash: passwordHash, roles: JSON.stringify([Role.USER, Role.ADMIN]) },
      { user_id: 4, voornaam: "Jesse", achternaam: "Vaerendonck", geboortedatum: new Date("2003-05-14"), email: "test3@test.com", tel_nummer:"0477106938", schaakrating_elo: 1722, schaakrating_difference: 0, schaakrating_max: 1722, is_admin: false, fide_id: 285412, lid_sinds: new Date("2021-09-01"), password_hash: passwordHash, roles: JSON.stringify([Role.USER]) },
      { user_id: 5, voornaam: "Giovanni", achternaam: "Berniers", geboortedatum: new Date("2003-05-14"), email: "test2@test.com", tel_nummer: "0477782958", schaakrating_elo: 1803, schaakrating_difference: 0, schaakrating_max: 1926, is_admin: false, fide_id: 256927, lid_sinds: new Date("2021-09-01"), password_hash: passwordHash, roles: JSON.stringify([Role.USER]) },
      { user_id: 6, voornaam: "Eduardo", achternaam: "Semanat Planas", geboortedatum: new Date("2003-05-14"), email: "test@test.com", tel_nummer: "0477719849", schaakrating_elo: 2155, schaakrating_difference: 0, schaakrating_max: 2155, is_admin: false, fide_id: 3501930, lid_sinds: new Date("2021-09-01"), password_hash: passwordHash, roles: JSON.stringify([Role.USER]) },
      { user_id: 7, voornaam: "Ronny", achternaam: "Hanssen", geboortedatum: new Date("2003-05-14"), email: "test6@test.com", tel_nummer: "0477687395", schaakrating_elo: 2027, schaakrating_difference: 0, schaakrating_max: 2028, is_admin: false, fide_id: 208728, lid_sinds: new Date("2021-09-01"), password_hash: passwordHash, roles: JSON.stringify([Role.USER]) },
    ],
  });

  // Tournaments
  await prisma.tournament.createMany({
    data: [
      { tournament_id: 1, naam: 'Herfstcompetitie', rondes: 8 },
      { tournament_id: 2, naam: 'Lentecompetitie', rondes: 8 },
      { tournament_id: 3, naam: 'Zomertoernooi', rondes: 8 },
    ],
  });

  // Rounds
  await prisma.round.createMany({
    data: [
      { round_id: 1, tournament_id: 1, ronde_nummer: 1, ronde_datum: new Date("2023-10-01") },
      { round_id: 2, tournament_id: 1, ronde_nummer: 2, ronde_datum: new Date("2023-10-08") },
      { round_id: 3, tournament_id: 2, ronde_nummer: 1, ronde_datum: new Date("2023-11-01") },
      { round_id: 4, tournament_id: 2, ronde_nummer: 2, ronde_datum: new Date("2023-11-08") },
    ],
  });

  // Games
  await prisma.game.createMany({
    data: [
      { game_id: 1, round_id: 1, speler1_id: 1, speler2_id: 2, winnaar_id: 1, result: "1-0", uitgestelde_datum: null },
      { game_id: 2, round_id: 2, speler1_id: 2, speler2_id: 1, winnaar_id: 2, result: "0-1", uitgestelde_datum: null },
      { game_id: 3, round_id: 3, speler1_id: 4, speler2_id: 3, winnaar_id: 5, result: "1-0", uitgestelde_datum: null },
      { game_id: 4, round_id: 4, speler1_id: 3, speler2_id: 4, winnaar_id: 5, result: "0-1", uitgestelde_datum: null },
    ],
  });

  // Participations
  await prisma.participation.createMany({
    data: [
      { user_id: 1, tournament_id: 1, score: 1.0, buchholz: 0.5, sonnebornBerger: 0.25, opponents: JSON.stringify([2]), color_history: JSON.stringify(["white"]), bye_round: null },
      { user_id: 2, tournament_id: 1, score: 0.0, buchholz: 0.5, sonnebornBerger: 0.0, opponents: JSON.stringify([1]), color_history: JSON.stringify(["black"]), bye_round: null },
      { user_id: 3, tournament_id: 2, score: 0.0, buchholz: 0.0, sonnebornBerger: 0.0, opponents: JSON.stringify([4]), color_history: JSON.stringify(["white"]), bye_round: null },
      { user_id: 4, tournament_id: 2, score: 1.0, buchholz: 0.5, sonnebornBerger: 0.25, opponents: JSON.stringify([3]), color_history: JSON.stringify(["black"]), bye_round: null },
    ],
  });

  // Seed articles
  await seedArticles();
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

import supertest from 'supertest'; 
import createServer from '../../src/createServer'; 
import type { Server } from '../../src/createServer'; 
import { prisma } from '../../src/data'; 

const data = {
  users: [
    {
      user_id: 1,
      voornaam: 'Jesse',
      achternaam: 'van Donck',
      geboortedatum: new Date(1995, 1, 15),
      schaakrating_elo: 2400,
      schaakrating_difference: null,
      schaakrating_max: 2500,
      is_admin: false,
      fide_id: null,
      nationaal_id: null,
      lid_sinds: new Date(2015, 5, 10),
    },
    {
      user_id: 2, 
      voornaam: 'Anna',
      achternaam: 'Meijer',
      geboortedatum: new Date(1990, 7, 25),
      schaakrating_elo: 2350,
      schaakrating_difference: null,
      schaakrating_max: 2450,
      is_admin: false,
      fide_id: 123456,
      nationaal_id: null,
      lid_sinds: new Date(2016, 3, 20),
    },
    {
      user_id: 3,
      voornaam: 'Pieter',
      achternaam: 'Janssen',
      geboortedatum: new Date(1985, 11, 30),
      schaakrating_elo: 2300,
      schaakrating_difference: null,
      schaakrating_max: 2400,
      is_admin: true,
      fide_id: null,
      nationaal_id: 789101,
      lid_sinds: new Date(2010, 1, 15),
    },
  ],
  tournaments: [
    {
      tournament_id: '1',
      naam: 'Wereldkampioenschap Schaken',
      rondes: 5,
    },
    {
      tournament_id: '2', 
      naam: 'Nationaal Toernooi',
      rondes: 4,
    },
  ],
  rounds: [
    {
      round_id: 1,
      tournament_id: '1',
      ronde_nummer: 1,
      ronde_datum: new Date(2024, 9, 1),
    },
    {
      round_id: 2,
      tournament_id: '1',
      ronde_nummer: 2,
      ronde_datum: new Date(2024, 9, 15),
    },
    {
      round_id: 3,
      tournament_id: '2',
      ronde_nummer: 1,
      ronde_datum: new Date(2024, 8, 20),
    },
  ],
  games: [
    {
      round_id: 1, 
      speler1_id: 1, 
      speler2_id: 2,
      winnaar_id: 1, 
      result: 'win',
      uitgestelde_datum: null,
    },
    {
      round_id: 2,
      speler1_id: 3, 
      speler2_id: 1, 
      winnaar_id: 3, 
      result: 'loss',
      uitgestelde_datum: null,
    },
    {
      round_id: 3,
      speler1_id: 2, 
      speler2_id: 3, 
      winnaar_id: null,
      result: 'draw',
      uitgestelde_datum: null,
    },
  ],
};

const dataToDelete = {
  users: [1, 2, 3], 
  tournaments: ['1', '2'], 
  rounds: [1, 2, 3], 
  games: ['game-1', 'game-2', 'game-3'], 
};

describe('Users', () => {
  let server: Server;
  let request: supertest.Agent;

  beforeAll(async () => {
    server = await createServer(); 
    request = supertest(server.getApp().callback());
  });

  afterAll(async () => {
    await server.stop();
  });

  const url = '/api/rondes';

  describe('GET /api/rondes', () => {

    beforeAll(async () => {
      await prisma.game.deleteMany();
      await prisma.user.deleteMany();
      await prisma.tournament.deleteMany();
      await prisma.round.deleteMany(); 

      await prisma.user.createMany({ data: data.users });
      await prisma.tournament.createMany({ data: data.tournaments });
      await prisma.round.createMany({ data: data.rounds });
      await prisma.game.createMany({ data: data.games });
    });

    afterAll(async () => {
      await prisma.game.deleteMany({
        where: {
          OR: [
            { speler1_id: { in: dataToDelete.users } },
            { speler2_id: { in: dataToDelete.users } },
            { winnaar_id: { in: dataToDelete.users } },
          ],
        },
      });
  
      await prisma.round.deleteMany({
        where: { tournament_id: { in: dataToDelete.tournaments } },
      });

      await prisma.tournament.deleteMany({
        where: { tournament_id: { in: dataToDelete.tournaments } },
      });
      
      await prisma.user.deleteMany({
        where: { user_id: { in: dataToDelete.users } },
      });
    });

    it('should 200 and return all rounds', async () => {
      const response = await request.get(url); 
      expect(response.status).toBe(200); 
      expect(response.body.items.length).toBe(3);

      expect(response.body.items).toEqual(
        expect.arrayContaining([
          {
            round_id: 1,
            tournament_id: '1',
            ronde_nummer: 1,
            ronde_datum: new Date(2024, 9, 1).toJSON(), 
          },
          {
            round_id: 2,
            tournament_id: '1',
            ronde_nummer: 2,
            ronde_datum: new Date(2024, 9, 15).toJSON(), 
          },
          {
            round_id: 3,
            tournament_id: '2',
            ronde_nummer: 1,
            ronde_datum: new Date(2024, 8, 20).toJSON(), 
          },
        ]),
      );
    });
  });

  describe('GET /api/rondes/:tournament_id/rondes/:round_id', () => {

    const url = '/api/rondes';
  
    beforeAll(async () => {
      await prisma.tournament.createMany({ data: data.tournaments });
      await prisma.round.createMany({ data: data.rounds });
      await prisma.user.createMany({ data: data.users });
    });
  
    afterAll(async () => {
      await prisma.round.deleteMany({
        where: { round_id: { in: dataToDelete.rounds } },
      });
      await prisma.tournament.deleteMany({
        where: { tournament_id: { in: dataToDelete.tournaments } },
      });
      await prisma.user.deleteMany({
        where: { user_id: { in: dataToDelete.users } },
      });
    });
  
    it('should return 200 and the requested round for the tournament', async () => {
      const response = await request.get(`${url}/1/rondes/1`);
  
      expect(response.statusCode).toBe(200);
  
      expect(response.body).toEqual({
        round_id: 1,
        tournament_id: '1',
        ronde_nummer: 1,
        ronde_datum: new Date(2024, 9, 1).toJSON(),
      });
    });
  
    it('should return 404 when requesting a non-existing round', async () => {
      const response = await request.get(`${url}/1/rondes/200`);
  
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No round with this id exists for the tournament',
      });
      expect(response.body.stack).toBeTruthy();
    });
  
    it('should return 400 for invalid round id', async () => {
      const response = await request.get(`${url}/1/rondes/invalid`);
  
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('round_id');
    });
  });
});

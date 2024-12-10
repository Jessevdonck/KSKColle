import supertest from 'supertest'; 
import { prisma } from '../../src/data'; 
import withServer from '../helpers/withServer'; // 👈 2
import { login } from '../helpers/login'; // 👈 3
import testAuthHeader from '../helpers/testAuthHeader'; // 👈 5

const data = {
  tournaments: [
    {
      tournament_id: 1,
      naam: 'Toernooi 1',
      rondes: 0,
    },
    {
      tournament_id: 2,
      naam: 'Toernooi 2',
      rondes: 0,
    },
  ],
  rounds: [
    {
      round_id: 1,
      tournament_id: 1,
      ronde_nummer: 1,
      ronde_datum: new Date(2024, 9, 1).toJSON(),
    },
    {
      round_id: 2,
      tournament_id: 1,
      ronde_nummer: 2,
      ronde_datum: new Date(2024, 9, 15).toJSON(), 
    },
    {
      round_id: 3,
      tournament_id: 2,
      ronde_nummer: 1,
      ronde_datum: new Date(2024, 8, 20).toJSON(), 
    },
  ],
};

const dataToDelete = {
  tournaments: [1, 2], 
  rounds: [1, 2, 3], 
  games: [1, 2, 3], 
};

describe('Rondes', () => {
  let request: supertest.Agent;
  let authHeader: string;

  withServer((r) => request = r); 

  beforeAll(async () => {
    authHeader = await login(request);
  });

  const baseUrl = '/api/rondes';

  describe('GET /api/rondes', () => {

    beforeAll(async () => {
      await prisma.tournament.createMany({ data: data.tournaments });
      await prisma.round.createMany({ data: data.rounds });
    });

    afterAll(async () => {
      
      await prisma.game.deleteMany({
        where: { game_id: { in: dataToDelete.games } },
      });

      await prisma.round.deleteMany({
        where: { tournament_id: { in: dataToDelete.tournaments } },
      });

      await prisma.tournament.deleteMany({
        where: { tournament_id: { in: dataToDelete.tournaments } },
      });
      
      
    });

    it('should 200 and return all rounds', async () => {
      const response = await request.get(baseUrl).set('Authorization', authHeader); 
      expect(response.status).toBe(200); 
      expect(response.body.items.length).toBe(3);

      expect(response.body.items).toEqual(
        expect.arrayContaining([
          {
            round_id: 1,
            tournament_id: 1,
            ronde_nummer: 1,
            ronde_datum: new Date(2024, 9, 1).toJSON(), 
          },
          {
            round_id: 2,
            tournament_id: 1,
            ronde_nummer: 2,
            ronde_datum: new Date(2024, 9, 15).toJSON(), 
          },
          {
            round_id: 3,
            tournament_id: 2,
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
    });
  
    afterAll(async () => {
      await prisma.round.deleteMany({
        where: { round_id: { in: dataToDelete.rounds } },
      });
      await prisma.tournament.deleteMany({
        where: { tournament_id: { in: dataToDelete.tournaments } },
      });
    });
  
    it('should return 200 and the requested round for the tournament', async () => {
      const response = await request.get(`${baseUrl}/1/rondes/1`).set('Authorization', authHeader);
  
      expect(response.statusCode).toBe(200);
  
      expect(response.body).toEqual({
        round_id: 1,
        tournament_id: 1,
        ronde_nummer: 1,
        ronde_datum: new Date(2024, 9, 1).toJSON(),
      });
    });

    testAuthHeader(() => request.get(`${url}/1/rondes/1`));
  
    it('should return 404 when requesting a non-existing round', async () => {
      const response = await request.get(`${baseUrl}/1/rondes/200`).set('Authorization', authHeader);;
  
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No round with this id exists for the tournament',
      });
      expect(response.body.stack).toBeTruthy();
    });

    testAuthHeader(() => request.get(`${url}/1/rondes/200`));
  
    it('should return 400 for invalid round id', async () => {
      const response = await request.get(`${baseUrl}/1/rondes/invalid`).set('Authorization', authHeader);;
  
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.params).toHaveProperty('round_id');
    });
  });
});

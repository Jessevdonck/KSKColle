import type supertest from 'supertest';
import { prisma } from '../../src/data';
import withServer from '../helpers/withServer';
import { login, loginAdmin } from '../helpers/login';
import testAuthHeader from '../helpers/testAuthHeader';

const data = {
  tournaments: [
    {
      tournament_id: 1,
      naam: 'Test Tournament',
      rondes: 3,
    },
  ],
  rounds: [
    {
      round_id: 1,
      tournament_id: 1,
      ronde_nummer: 1,
      ronde_datum: new Date(2021, 4, 25, 19, 40),
    },
    {
      round_id: 2,
      tournament_id: 1,
      ronde_nummer: 2,
      ronde_datum: new Date(2021, 4, 26, 19, 40),
    },
  ],
};

const dataToDelete = {
  rounds: [1, 2],
  tournaments: [1],
};

describe('Rounds', () => {
  let request: supertest.Agent;
  let authHeader: string;
  let adminAuthHeader: string;

  withServer((r) => (request = r));

  beforeAll(async () => {
    authHeader = await login(request);
    adminAuthHeader = await loginAdmin(request);
  });

  const url = '/api/rondes';

  describe('GET /api/rounds', () => {
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

    it('should 200 and return all rounds for the signed in user', async () => {
      const response = await request.get(url).set('Authorization', authHeader);
      expect(response.status).toBe(200);

      expect(response.body.items.length).toBe(2);
      expect(response.body.items).toEqual(
        expect.arrayContaining([
          {
            round_id: 1,
            tournament_id: 1,
            ronde_nummer: 1,
            ronde_datum: new Date(2021, 4, 25, 19, 40).toJSON(),
          },
          {
            round_id: 2,
            tournament_id: 1,
            ronde_nummer: 2,
            ronde_datum: new Date(2021, 4, 26, 19, 40).toJSON(),
          },
        ]),
      );
    });

    it('should 200 and return all rounds for the admin user', async () => {
      const response = await request.get(url).set('Authorization', adminAuthHeader);
      expect(response.status).toBe(200);

      expect(response.body.items.length).toBe(2);
      expect(response.body.items).toEqual(
        expect.arrayContaining([
          {
            round_id: 1,
            tournament_id: 1,
            ronde_nummer: 1,
            ronde_datum: new Date(2021, 4, 25, 19, 40).toJSON(),
          },
          {
            round_id: 2,
            tournament_id: 1,
            ronde_nummer: 2,
            ronde_datum: new Date(2021, 4, 26, 19, 40).toJSON(),
          },
        ]),
      );
    });

    it('should 400 when given an argument', async () => {
      const response = await request.get(`${url}?invalid=true`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
      expect(response.body.details.query).toHaveProperty('invalid');
    });

    testAuthHeader(() => request.get(url));
  });

  describe('GET /api/rounds/:id', () => {
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

    it('should 200 and return the requested round', async () => {
      const response = await request.get(`${url}/1`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        round_id: 1,
        tournament_id: 1,
        ronde_nummer: 1,
        ronde_datum: new Date(2021, 4, 25, 19, 40).toJSON(),
      });
    });

    it('should 404 when requesting not existing round', async () => {
      const response = await request.get(`${url}/200`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No round with this id exists',
      });
    });

    it('should 400 with invalid round id', async () => {
      const response = await request.get(`${url}/invalid`).set('Authorization', authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
    });
  });

    describe('GET /api/rondes/tournament/:id', () => {
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
  
      it('should 200 and return all rounds for a specific tournament', async () => {
        const response = await request.get(`${url}/1/rondes`).set('Authorization', authHeader);
        expect(response.status).toBe(200);
      
        expect(response.body.items).toEqual(
          expect.arrayContaining([
            {
              round_id: 1,
              tournament_id: 1,
              ronde_nummer: 1,
              ronde_datum: new Date(2021, 4, 25, 19, 40).toJSON(),
              games: [], 
            },
            {
              round_id: 2,
              tournament_id: 1,
              ronde_nummer: 2,
              ronde_datum: new Date(2021, 4, 26, 19, 40).toJSON(),
              games: [], 
            },
          ]),
        );
      });
  
      it('should 404 when no rounds exist for a given tournament', async () => {
        await prisma.round.deleteMany({
          where: { tournament_id: 1 },
        });
  
        const response = await request.get(`${url}/1234/rondes`).set('Authorization', authHeader);
        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
          code: 'NOT_FOUND',
          message: 'No tournament with this id exists',
        });
      });
  
      it('should 400 when given an invalid tournament ID', async () => {
        const response = await request.get(`${url}/invalid/rondes`).set('Authorization', authHeader);
        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe('VALIDATION_FAILED');
      });
    });

    describe('GET /api/rondes/:tournament_id/rondes/:round_id', () => {
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
      
        it('should 200 and return the specific round for a tournament', async () => {
          const response = await request.get(`${url}/1/rondes/1`).set('Authorization', authHeader);
          expect(response.status).toBe(200);
      
          expect(response.body).toEqual({
            round_id: 1,
            tournament_id: 1,
            ronde_nummer: 1,
            ronde_datum: new Date(2021, 4, 25, 19, 40).toJSON(),
          });
        });
      
        it('should 404 when the round does not exist for the given tournament', async () => {
          const response = await request.get(`${url}/1/rondes/999`).set('Authorization', authHeader);
          expect(response.status).toBe(404);
          expect(response.body).toMatchObject({
            code: 'NOT_FOUND',
            message: 'No round with this id exists for the tournament',
          });
        });
      
        it('should 400 when given an invalid round ID', async () => {
          const response = await request.get(`${url}/1/rondes/invalid`).set('Authorization', authHeader);
          expect(response.statusCode).toBe(400);
          expect(response.body.code).toBe('VALIDATION_FAILED');
        });
      
        it('should 404 when no round exists for the tournament', async () => {
          await prisma.round.deleteMany({
            where: { tournament_id: 1 },
          });
      
          const response = await request.get(`${url}/1/rondes/1`).set('Authorization', authHeader);
          expect(response.status).toBe(404);
          expect(response.body).toMatchObject({
            code: 'NOT_FOUND',
            message: 'No round with this id exists for the tournament',
          });
        });
      
        it('should 404 when the tournament ID does not exist', async () => {
          const response = await request.get(`${url}/999/rondes/1`).set('Authorization', authHeader);
          expect(response.status).toBe(404);
          expect(response.body).toMatchObject({
            code: 'NOT_FOUND',
            message: 'No round with this id exists for the tournament',
          });
        });
      });
    describe('POST /api/rondes', () => {

        let createdRoundId: number;

        beforeAll(async () => {
            await prisma.tournament.createMany({ data: data.tournaments });
        });
        
        afterAll(async () => {
            
            await prisma.game.deleteMany({
                where: {
                  round_id: { in: dataToDelete.rounds }, 
                },
              });
            if (createdRoundId) {
                await prisma.round.delete({
                    where: { round_id: createdRoundId },
                });
            }
            await prisma.round.deleteMany({
            where: { round_id: { in: dataToDelete.rounds} },
            });
            await prisma.tournament.deleteMany({
            where: { tournament_id: { in: dataToDelete.tournaments } },
            });
        });

        it('should 201 and create a new round', async () => {
            

            const newRound = {
                tournament_id: 1,
                ronde_nummer: 3,
                ronde_datum: "2024-12-20T19:40:00Z"
            };

            const response = await request.post(url).set('Authorization', adminAuthHeader).send(newRound);
            expect(response.status).toBe(201);

            createdRoundId = response.body.round_id;

            expect(response.body.round_id).toBeDefined();
        });
        
        it('should 400 when missing required fields', async () => {
            const response = await request.post(url).set('Authorization', adminAuthHeader).send({});
            expect(response.status).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
        });
        
        it('should 400 when given an invalid tournament ID', async () => {
            const newRound = {
            tournament_id: 999,
            ronde_nummer: 3,
            ronde_datum: "2024-12-20T19:40:00Z"
            };
        
            const response = await request.post(url).set('Authorization', adminAuthHeader).send(newRound);
            expect(response.status).toBe(409);
            expect(response.body.code).toBe('CONFLICT');
        });
        
        testAuthHeader(() => request.post(url));
    });

    describe('PUT /api/rondes/:id', () => {
    
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
    
        it('should return 200 and update the round', async () => {
            const response = await request.put(`${url}/1/rondes/1`).send({
                ronde_nummer: 3,
                ronde_datum: "2024-12-20T19:40:00Z"
            }).set('Authorization', adminAuthHeader);
    
            expect(response.status).toBe(200);
            expect(response.body.ronde_nummer).toBe(3);
            expect(response.body.ronde_datum).toBe("2024-12-20T19:40:00.000Z");
        });
    
        it('should return 404 if the round does not exist', async () => {
            const response = await request.put(`${url}/1/rondes/999`).send({
                ronde_nummer: 3,
                ronde_datum: "2024-12-20T19:40:00Z"
            }).set('Authorization', adminAuthHeader);
    
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Ronde met dit id niet gevonden voor toernooi');
        });
    
        it('should return 404 if the tournament does not exist', async () => {
            const response = await request.put(`${url}/999/rondes/1`).send({
                ronde_nummer: 3,
                ronde_datum: "2024-12-20T19:40:00Z"
            }).set('Authorization', adminAuthHeader);
    
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Ronde met dit id niet gevonden voor toernooi');
        });
    
        it('should return 400 if the request body is invalid', async () => {
            const response = await request.put(`${url}/1/rondes/1`).send({
                ronde_nummer: "invalid_number",  
                ronde_datum: "invalid_date" 
            }).set('Authorization', adminAuthHeader);
    
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Validation failed, check details for more information');
        });
    
        it('should return 403 if the user is not authorized (wrong role)', async () => {
            const response = await request.put(`${url}/1/rondes/1`).send({
                ronde_nummer: 3,
                ronde_datum: "2024-12-20T19:40:00Z"
            }).set('Authorization', authHeader); 
    
            expect(response.status).toBe(403);
            expect(response.body.message).toBe('You are not allowed to view this part of the application');
        });

        testAuthHeader(() => request.put(`${url}/1/rondes/1`));
    });

    describe('DELETE /api/transactions/:id', () => {

        beforeAll(async () => {
          await prisma.tournament.createMany({ data: data.tournaments });
          await prisma.round.create({ data: data.rounds[0]! });
        });
    
        afterAll(async () => {
          await prisma.tournament.deleteMany({
            where: { tournament_id: { in: dataToDelete.tournaments } },
          });
        });
    
        it('should 204 and return nothing', async () => {
          const response = await request.delete(`${url}/1/rondes/1`)
            .set('Authorization', adminAuthHeader);
    
          expect(response.statusCode).toBe(204);
          expect(response.body).toEqual({});
        });
    
        testAuthHeader(() => request.delete(`${url}/1/rondes/1`));
      });   
});

import type supertest from 'supertest';
import { prisma } from '../../src/data';
import withServer from '../helpers/withServer';
import { login, loginAdmin } from '../helpers/login';
import testAuthHeader from '../helpers/testAuthHeader';

describe('Users', () => {
  let request: supertest.Agent;
  let authHeader: string;
  let adminAuthHeader: string;

  withServer((r) => (request = r));

  beforeAll(async () => {
    authHeader = await login(request);
    adminAuthHeader = await loginAdmin(request);
  });

  const url = '/api/users';

  describe('GET /api/users', () => {

    it('should 200 return all public users', async () => {
        const response = await request.get(`${url}/publicUsers`).set('Authorization', authHeader);

        expect(response.status).toBe(200);
        expect(response.body.items.length).toBe(2);

        const users = response.body.items.map((user: any) => ({
            ...user,
            roles: JSON.parse(user.roles), 
        }));
    
        expect(users).toEqual(expect.arrayContaining([{
            user_id: 1,
            voornaam: 'Test',
            achternaam: 'User',
            email: 'test.user@hogent.be',
            fide_id: null,
            schaakrating_elo: 1200,
            roles: ['user'],
        }, {
            user_id: 2,
            voornaam: 'Admin',
            achternaam: 'User',
            email: 'admin.user@hogent.be',
            fide_id: null,
            schaakrating_elo: 1500,
            roles: ['admin', 'user'],
        }]));
    });

    it('should 200 return all users for admin', async () => {
      const response = await request.get(`${url}`).set('Authorization', adminAuthHeader);
    
      expect(response.status).toBe(200);
      expect(response.body.items.length).toBe(2);
    
      const users = response.body.items.map((user: any) => ({
        ...user,
        roles: JSON.parse(user.roles), 
      }));
    
      expect(users).toEqual(expect.arrayContaining([{
        user_id: 1,
        voornaam: 'Test',
        achternaam: 'User',
        email: 'test.user@hogent.be',
        fide_id: null,
        schaakrating_elo: 1200,
        roles: ['user'],
        geboortedatum: expect.any(String), 
        is_admin: null, 
        lid_sinds: expect.any(String), 
        password_hash: expect.any(String), 
        schaakrating_difference: null,
        schaakrating_max: null,
        tel_nummer: expect.any(String),  
      }, {
        user_id: 2,
        voornaam: 'Admin',
        achternaam: 'User',
        email: 'admin.user@hogent.be',
        fide_id: null,
        schaakrating_elo: 1500,
        roles: ['admin', 'user'],
        geboortedatum: expect.any(String), 
        is_admin: null,
        lid_sinds: expect.any(String), 
        password_hash: expect.any(String), 
        schaakrating_difference: null,
        schaakrating_max: null,
        tel_nummer: expect.any(String),
      }]));
    });

    it('should 200 return player by name', async () => {
      const response = await request.get(`${url}/by-name?voornaam=Test&achternaam=User`).set('Authorization', authHeader);
  
      expect(response.status).toBe(200);
  
      const user = {
        ...response.body,
        roles: JSON.parse(response.body.roles), 
      };
  
      expect(user).toEqual({
        user_id: 1,
            voornaam: 'Test',
            achternaam: 'User',
            email: 'test.user@hogent.be',
            fide_id: null,
            schaakrating_elo: 1200,
            roles: ['user'],
      });
  });

  it('should 404 when player is not found by name', async () => {
    const response = await request.get(`${url}/by-name?voornaam=Pietje&achternaam=NogIets`).set('Authorization', authHeader);
  
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      code: 'NOT_FOUND',
      message: 'Unknown resource: /api/users/by-name?voornaam=Pietje&achternaam=NogIets',
    });
  });
  

  it('should 400 when given an argument', async () => {
    const response = await request.get(`${url}/publicUsers?invalid=true`).set('Authorization', adminAuthHeader);

    expect(response.statusCode).toBe(400);
    expect(response.body.code).toBe('VALIDATION_FAILED');
    expect(response.body.details.query).toHaveProperty('invalid');
  });
          

    it('should 400 when given an argument for publicUsers', async () => {
        const response = await request.get(`${url}/?invalid=true`).set('Authorization', adminAuthHeader);
  
        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe('VALIDATION_FAILED');
        expect(response.body.details.query).toHaveProperty('invalid');
      });

      it('should 403 when not an admin', async () => {
        const response = await request.get(url).set('Authorization', authHeader);
  
        expect(response.statusCode).toBe(403);
        expect(response.body).toMatchObject({
          code: 'FORBIDDEN',
          message: 'You are not allowed to view this part of the application',
        });
      });

      testAuthHeader(() => request.get(url));
});

describe('GET /api/users/:id', () => {

    it('should 200 and return the requested user', async () => { 
      const response = await request.get(`${url}/1`).set('Authorization', authHeader);

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchObject({
        user_id: 1,
            voornaam: "Test",
            achternaam: "User",
            email: "test.user@hogent.be",
            fide_id: null,
            schaakrating_elo: 1200,
      });
    });

    it('should 200 and return my user info when passing \'me\' as id', async () => {
        const response = await request.get(`${url}/me`).set('Authorization', authHeader);
  
        expect(response.statusCode).toBe(200);
        expect(response.body).toMatchObject({
            user_id: 1,
            voornaam: "Test",
            achternaam: "User",
            email: "test.user@hogent.be",
            fide_id: null,
            schaakrating_elo: 1200,
        });
      });
  
      it('should 404 with not existing user (and admin user requesting)', async () => {
        const response = await request.get(`${url}/123`).set('Authorization', adminAuthHeader);
  
        expect(response.statusCode).toBe(404);
        expect(response.body).toMatchObject({
          code: 'NOT_FOUND',
          message: 'No user with this id exists',
        });
        expect(response.body.stack).toBeTruthy();
      });
  
      it('should 400 with invalid user id (and admin user requesting)', async () => {
        const response = await request.get(`${url}/invalid`).set('Authorization', adminAuthHeader);
  
        expect(response.statusCode).toBe(400);
        expect(response.body.code).toBe('VALIDATION_FAILED');
        expect(response.body.details.params).toHaveProperty('id');
      });
  
      testAuthHeader(() => request.get(`${url}/1`));
});

describe('POST /api/users', () => {

    afterAll(async () => {
      await prisma.user.deleteMany({
        where: {
          email: 'new.user@hogent.be',
        },
      });
    });

    it('should 200 and return the registered user', async () => {
      const response = await request.post(url)
        .send({
          voornaam: 'New',
          achternaam: 'User',
          email: 'new.user@hogent.be',
          fide_id: null,
          password: 'testtest', 
          tel_nummer: '9871236',
          geboortedatum: '1990-01-01',
          schaakrating_elo: 1200,
          lid_sinds: '2020-01-01', 
          roles: ['user'], 
        })
        .set('Authorization', adminAuthHeader);

      expect(response.statusCode).toBe(200);
      expect(response.body.token).toBeDefined();
    });
  });

  describe('PUT /api/users/:id', () => {

    it('should 200 and return the updated user', async () => {
        const response = await request.put(`${url}/1`)
          .send({
          voornaam: 'Changed', 
          roles: ["user"], 
          })
          .set('Authorization', adminAuthHeader);
  
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
          user_id: 1, 
          voornaam: 'Changed',
          achternaam: 'User',
          email: 'test.user@hogent.be', 
          fide_id: null,
          schaakrating_elo: 1200,
          roles: '["user"]', 
        });
      });

    it('should 403 when not an admin and not own user id', async () => {
      const response = await request.put(`${url}/2`)
        .send({
          name: 'Changed name',
          email: 'new.user@hogent.be',
        })
        .set('Authorization', authHeader);

      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        code: 'FORBIDDEN',
        message: 'You are not allowed to view this part of the application',
      });
    });

    testAuthHeader(() => request.put(`${url}/1`));
  });

  describe('PUT /api/users/:id/password', () => {
    
    it('should 200 and return nothing', async () => {
      const response = await request.put(`${url}/2/password`)
        .send({
          currentPassword: '12345678',
          newPassword: 'ditiseennieuwwachtwoord',
        })
        .set('Authorization', adminAuthHeader);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        message: 'Password updated successfully',
      });
    });

    it('should 401 when incorrect currentPassword', async () => {
      const response = await request.put(`${url}/1/password`)
        .send({
          currentPassword: 'ditisnietjuist',
          newPassword: 'ditiseennieuwwachtwoord',
        })
        .set('Authorization', authHeader);

      expect(response.statusCode).toBe(401);
      expect(response.body).toMatchObject({
        code: 'UNAUTHORIZED',
        message: "Current password is incorrect",
      });
    });

    it('should 403 when not an admin and not own user id', async () => {
      const response = await request.put(`${url}/2/password`)
        .send({
          currentPassword: '12345678',
          newPassword: 'ditiseennieuwwachtwoord',
        })
        .set('Authorization', authHeader);

      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        code: 'FORBIDDEN',
        message: "You are not allowed to view this user's information",
      });
    });

    testAuthHeader(() => request.put(`${url}/1/password`));
  });


  describe('DELETE /api/users/:id', () => {

    it('should 204 and return nothing', async () => {
      const response = await request.delete(`${url}/1`).set('Authorization', adminAuthHeader);

      expect(response.statusCode).toBe(204);
      expect(response.body).toEqual({});
    });

    it('should 404 with not existing user', async () => {
      const response = await request.delete(`${url}/123`).set('Authorization', adminAuthHeader);

      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: 'NOT_FOUND',
        message: 'No user with this id exists',
      });
      expect(response.body.stack).toBeTruthy();
    });

    it('should 403 when not an admin and not own user id', async () => {
      const response = await request.delete(`${url}/1`).set('Authorization', authHeader);

      expect(response.statusCode).toBe(403);
      expect(response.body).toMatchObject({
        code: 'FORBIDDEN',
        message: 'You are not allowed to view this part of the application',
      });
    });

    testAuthHeader(() => request.delete(`${url}/1`));
  });
});




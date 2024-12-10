import supertest from 'supertest'; 
import type { Server } from '../../src/createServer';
import createServer from '../../src/createServer';
import { prisma } from '../../src/data';
import { hashPassword } from '../../src/core/password'; 
import Role from '../../src/core/roles'; 

export default function withServer(setter: (s: supertest.Agent) => void): void {
  let server: Server; 

  beforeAll(async () => {
    server = await createServer(); 

    const passwordHash = await hashPassword('12345678');
    await prisma.user.createMany({
      data: [
        {
          user_id: 1,
          voornaam: 'Test',
          achternaam: 'User',
          email: 'test.user@hogent.be',
          password_hash: passwordHash,
          roles: JSON.stringify([Role.USER]),
          tel_nummer: '1234567890',
          geboortedatum: new Date('1990-01-01'),
          schaakrating_elo: 1200,
          lid_sinds: new Date('2020-01-01'),
        },
        {
          user_id: 2,
          voornaam: 'Admin',
          achternaam: 'User',
          email: 'admin.user@hogent.be',
          password_hash: passwordHash,
          roles: JSON.stringify([Role.ADMIN, Role.USER]),
          tel_nummer: '0987654321',
          geboortedatum: new Date('1985-01-01'),
          schaakrating_elo: 1500,
          lid_sinds: new Date('2019-01-01'),
        },
      ],
    });

    setter(supertest(server.getApp().callback()));
  });

  afterAll(async () => {
    await prisma.user.deleteMany();

    await server.stop();
  });
}
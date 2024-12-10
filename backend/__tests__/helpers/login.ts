import type supertest from 'supertest';

export const login = async (supertest: supertest.Agent): Promise<string> => {
  const response = await supertest.post('/api/sessions').send({
    email: 'test.user@hogent.be',
    password: '12345678',
  });

  if (response.statusCode !== 200) {
    throw new Error(response.body.message || 'Unknown error occured');
  }

  return `Bearer ${response.body.token}`;
};

export const loginAdmin = async (
    supertest: supertest.Agent,
  ): Promise<string> => {
    const response = await supertest.post('/api/sessions').send({
      email: 'admin.user@hogent.be',
      password: '12345678',
    });
  
    if (response.statusCode !== 200) {
      throw new Error(response.body.message || 'Unknown error occured');
    }
  
    return `Bearer ${response.body.token}`;
  };
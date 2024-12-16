export default {
  port: 9000,
  env: "production",
  log: {
    level: "info",
    disabled: false,
  },
  cors: {
    // 👈 1
    origins: ['https://kskcolle-backend.onrender.com'], // 👈 2
    maxAge: 3 * 60 * 60, // 👈 3
  },
  auth: {
    maxDelay: 5,
    jwt: {
      audience: 'kskcolle.be',
      issuer: 'kskcolle.be',
      expirationInterval: 60 * 60, 
    },
    argon: {
      hashLength: 32,
      timeCost: 6,
      memoryCost: 2 ** 17,
  },
  },
};

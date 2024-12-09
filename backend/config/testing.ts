export default {
  env: "development",
  log: {
    level: 'silly',
    disabled: false,
  },
  cors: {
    // 👈 1
    origins: ['http://localhost:5173'], // 👈 2
    maxAge: 3 * 60 * 60, // 👈 3
  },
  auth: {
    jwt: {
      audience: 'kskcolle.be',
      issuer: 'kskcolle.be',
      expirationInterval: 60 * 60, 
      secret:
        'eenveeltemoeilijksecretdatniemandooitzalradenandersisdesitegehacked',
    },
    argon: {
      hashLength: 32,
      timeCost: 6,
      memoryCost: 2 ** 17,
    },
  },
};
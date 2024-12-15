export default {
  env: "development",
  log: {
    level: 'silly',
    disabled: false,
  },
  cors: {
    origins: ['http://localhost:3001'], 
    maxAge: 3 * 60 * 60,
  },
  auth: {
    maxDelay: 5,
    jwt: {
      audience: 'kskcolle.be',
      issuer: 'kskcolle.be',
      expirationInterval: 10, 
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
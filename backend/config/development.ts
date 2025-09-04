export default {
  env: "development",
  port: 9000,
  log: {
    level: 'silly',
    disabled: false,
  },
  cors: {
    origins: ['http://localhost:3001', 'http://localhost:3000'], 
    maxAge: 3 * 60 * 60,
  },
  auth: {
    maxDelay: 5,
    jwt: {
      audience: 'kskcolle.be',
      issuer: 'kskcolle.be',
      expirationInterval: 60 * 60 * 24 * 365, 
      secret:
        'eenveeltemoeilijksecretdatniemandooitzalradenandersisdesitgehacked',
    },
    argon: {
      hashLength: 32,
      timeCost: 6,
      memoryCost: 2 ** 17,
    },
  },
  passwordReset: {
    tokenLength: 32,
    tokenExpiryHours: 24,
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: 'noreply@jessevdonck.com',
  },
};
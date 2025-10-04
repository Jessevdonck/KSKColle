export default {  
  port: 9000,
  env: "production",
  log: {
    level: "info",
    disabled: false,
  },
  cors: {
    // 👈 1
    origins: [
      'https://backend-kskcolle-production.up.railway.app',
      'https://kskcolle-production.up.railway.app',
      'https://frontendweb-kskcolle.onrender.com',
      'https://kskcolle.onrender.com',
      'https://kskcolle-personal.up.railway.app',
      'https://kskcolle-production-personal.up.railway.app',
      'https://www.kskcolle.be',
      'http://www.kskcolle.be'
    ],
    
    maxAge: 3 * 60 * 60, // 👈 3
  },
  auth: {
    maxDelay: 5,
    jwt: {
      audience: 'kskcolle.be',
      issuer: 'kskcolle.be',
      expirationInterval: 60 * 60 * 24 * 365, 
      secret:
        'eenveeltemoeilijksecretdatniemandooitzalradenandersisdesitegehacked',
    },
    argon: {
      hashLength: 32,
      timeCost: 6,
      memoryCost: 2 ** 17,
  },
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: 'noreply@jessevdonck.com',
  },
};

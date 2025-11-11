export default {
    port: 9000,
    log: {
      level: 'silly',
      disabled: false,
    },
    cors: {
      origins: ['http://localhost:5173'],
      maxAge: 3 * 60 * 60,
    },
    auth: {
      maxDelay: 5000,
      argon: {
        hashLength: 32,
        timeCost: 4,
        memoryCost: 2 ** 12,
      },
      jwt: {
        audience: 'kskcolle.be',
        issuer: 'kskcolle.be',
      },
    },
    passwordReset: {
      tokenLength: 32,
      tokenExpiryHours: 24,
    },
    email: {
      resendApiKey: '',
      from: 'noreply@jessevdonck.com',
    },
    cloudinary: {
      cloudName: '',
      apiKey: '',
      apiSecret: '',
    },
  };
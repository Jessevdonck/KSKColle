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
        timeCost: 6,
        memoryCost: 2 ** 17,
      },
      jwt: {
        audience: 'kskcolle.be',
        issuer: 'kskcolle.be',
      },
    },
    email: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
      from: process.env.EMAIL_FROM || 'noreply@kskcolle.be',
    },
    passwordReset: {
      tokenExpiryHours: 24,
      tokenLength: 32,
    },
  };
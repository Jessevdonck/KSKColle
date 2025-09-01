export default {
    env: 'NODE_ENV',
    port: 'PORT',
    auth: {
      jwt: {
        secret: 'AUTH_JWT_SECRET',
      },
    },
    email: {
      resendApiKey: 'RESEND_API_KEY',
      from: 'EMAIL_FROM',
    },
  };
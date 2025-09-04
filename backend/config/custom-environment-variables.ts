export default {
    env: 'NODE_ENV',
    port: 'PORT',
    auth: {
      jwt: {
        secret: 'AUTH_JWT_SECRET',
      },
    },
    passwordReset: {
      tokenLength: 'PASSWORD_RESET_TOKEN_LENGTH',
    },
    email: {
      resendApiKey: 'RESEND_API_KEY',
      from: 'EMAIL_FROM',
    },
  };
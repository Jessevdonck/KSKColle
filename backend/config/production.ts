export default {
  env: "production",
  log: {
    level: "info",
    disabled: false,
  },
  cors: {
    // 👈 1
    origins: ['http://localhost:3001'], // 👈 2
    maxAge: 3 * 60 * 60, // 👈 3
  },
};

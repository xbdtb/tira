export const config = {
  env: process.env.NODE_ENV || 'development',
  systemBearerToken: 'TiraSystemBearerToken',
  serverPort: <number>(process.env.SERVER_PORT || 5000),
};

import TiraGraphQLServer from '@tira/tira-graphql-server';
import schema from './graphql/schema';
import { config } from './config';

const server = new TiraGraphQLServer({
  serverPort: <number>config.serverPort,
  schema,
  // redisConfig: config.redis,
});
server.start();

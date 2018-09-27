import TiraServer from '@tira/tira-server';
import schema from './graphql/schema';
import { config } from './config';

const server = new TiraServer({
  serverPort: <number>config.serverPort,
  schema,
  // redisConfig: config.redis,
});
server.start();

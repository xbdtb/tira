import TiraFrontEndServer from '@tira/tira-frontend-server';
import { config } from './config';

const server = new TiraFrontEndServer({
  serverPort: config.serverPort,
  graphQLGatewayProxyUrl: config.graphQLFrontendGatewayUrl,
  // redisConfig: config.redis,
});
server.start();

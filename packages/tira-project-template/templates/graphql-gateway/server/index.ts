import TiraGraphQLGateway from '@tira/tira-graphql-gateway';
import { config } from './config';

const server = new TiraGraphQLGateway({
  serverPort: config.serverPort,
  endpoints: config.endpoints,
  updateInterval: config.updateInterval,
});
server.start();

import TiraGraphQLGateway from '@tira/tira-graphql-gateway';
import endpoints from './config/endpoints';

const server = new TiraGraphQLGateway({ endpoints });
server.start();

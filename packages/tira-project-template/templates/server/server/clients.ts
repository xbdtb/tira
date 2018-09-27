import { createGraphQLGatewayClient } from '@tira/tira-clients';
import { config } from './config';

export const gateway = createGraphQLGatewayClient(config.graphQLBackendGatewayUrl);

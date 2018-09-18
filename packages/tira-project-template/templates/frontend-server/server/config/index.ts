const getServiceHost = (clusterServiceName: string, defaultValue: string) => {
  if (process.env.CLUSTER_MODE) {
    return clusterServiceName;
  } else {
    return defaultValue;
  }
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  systemBearerToken: 'TiraSystemBearerToken',
  serverPort: <number>(process.env.SERVER_PORT || 3100),
  graphQLFrontendGatewayUrl: process.env.CLUSTER_MODE ? `http://graphql-server/graphql` : 'http://localhost/graphql',
  graphQLBackendGatewayUrl: process.env.CLUSTER_MODE ? `http://graphql-server/graphql` : 'http://localhost/graphql',
  redis: {
    host: getServiceHost('redis', 'localhost'),
    port: 6379,
    password: process.env.REDIS_PASSWORD || 'tira',
  },
};

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
  serverPort: <number>(process.env.SERVER_PORT || 4000),
  graphQLBackendGatewayUrl: process.env.CLUSTER_MODE ? `http://graphql-server/graphql` : 'http://localhost/graphql',
  // redis: {
  //   host: getServiceHost('redis', 'localhost'),
  //   port: 6379,
  //   password: process.env.REDIS_PASSWORD || 'tira',
  // },
  mysql: {
    host: getServiceHost('mysql', 'localhost'),
    port: 3306,
    user: process.env.MYSQL_USER || 'tira',
    password: process.env.MYSQL_PASSWORD || 'tira',
    db: process.env.MYSQL_DB || 'tira',
    connectionString: () => {},
  },
};

config.mysql.connectionString = () => {
  const str = `mysql://${config.mysql.user}:${config.mysql.password}@${config.mysql.host}/${config.mysql.db}`;
  return str;
};

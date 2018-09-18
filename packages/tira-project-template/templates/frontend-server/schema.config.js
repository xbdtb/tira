const { config } = require('./dist/server/config');

module.exports = {
  frontend: {
    schemaPath: 'client/data',
    remoteUrl: config.graphQLFrontendGatewayUrl,
  },
  backend: {
    schemaPath: 'server/data',
    remoteUrl: config.graphQLBackendGatewayUrl,
  },
};

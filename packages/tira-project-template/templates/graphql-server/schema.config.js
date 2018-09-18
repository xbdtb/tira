const { config } = require('./dist/server/config');

module.exports = {
  backend: {
    schemaPath: 'server/data',
    remoteUrl: config.graphQLBackendGatewayUrl,
  },
};

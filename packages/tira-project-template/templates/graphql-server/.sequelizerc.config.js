const { config } = require('./dist/server/config');

module.exports = {
  development: {
    username: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.db,
    host: config.mysql.host,
    dialect: 'mysql',
  },
};

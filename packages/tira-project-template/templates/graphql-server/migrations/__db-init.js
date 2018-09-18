'use strict';

const sequelize = require('../server/models/sequelize').sequelize;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await sequelize.sync();
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  },
};

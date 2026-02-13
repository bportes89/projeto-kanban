'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists before adding to avoid errors in repeated runs
    const tableInfo = await queryInterface.describeTable('Cards');
    if (!tableInfo.type) {
        await queryInterface.addColumn('Cards', 'type', {
            type: Sequelize.STRING,
            defaultValue: 'generic' // produto, cliente, projeto, decisao
        });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Cards', 'type');
  }
};
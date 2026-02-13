'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ChecklistItems', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      content: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      cardId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Cards',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ChecklistItems');
  }
};
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Cards', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING
      },
      menteeName: {
        type: Sequelize.STRING
      },
      menteeContext: {
        type: Sequelize.TEXT
      },
      menteeGoal: {
        type: Sequelize.TEXT
      },
      mentorPerception: {
        type: Sequelize.TEXT
      },
      mentorResistance: {
        type: Sequelize.TEXT
      },
      mentorAttention: {
        type: Sequelize.TEXT
      },
      mentorEmotion: {
        type: Sequelize.TEXT
      },
      phase: {
        type: Sequelize.STRING
      },
      energyMentee: {
        type: Sequelize.INTEGER
      },
      energyMentor: {
        type: Sequelize.INTEGER
      },
      decisionsTaken: {
        type: Sequelize.TEXT
      },
      decisionsOpen: {
        type: Sequelize.TEXT
      },
      reflections: {
        type: Sequelize.TEXT
      },
      columnId: {
        type: Sequelize.INTEGER
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Cards');
  }
};
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Card extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Card.belongsTo(models.Column, { foreignKey: 'columnId', as: 'column' });
      Card.hasMany(models.Message, { foreignKey: 'cardId', as: 'messages' });
      Card.hasMany(models.ChecklistItem, { foreignKey: 'cardId', as: 'checklist' });
    }
  }
  Card.init({
    title: DataTypes.STRING,
    menteeName: DataTypes.STRING,
    menteeContext: DataTypes.TEXT,
    menteeGoal: DataTypes.TEXT,
    mentorPerception: DataTypes.TEXT,
    mentorResistance: DataTypes.TEXT,
    mentorAttention: DataTypes.TEXT,
    mentorEmotion: DataTypes.TEXT,
    phase: DataTypes.STRING,
    energyMentee: DataTypes.INTEGER,
    energyMentor: DataTypes.INTEGER,
    decisionsTaken: DataTypes.TEXT,
    decisionsOpen: DataTypes.TEXT,
    reflections: DataTypes.TEXT,
    columnId: DataTypes.INTEGER,
    type: {
      type: DataTypes.STRING,
      defaultValue: 'generic'
    }
  }, {
    sequelize,
    modelName: 'Card',
  });
  return Card;
};
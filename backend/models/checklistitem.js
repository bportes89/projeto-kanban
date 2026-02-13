'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ChecklistItem extends Model {
    static associate(models) {
      ChecklistItem.belongsTo(models.Card, { foreignKey: 'cardId', as: 'card' });
    }
  }
  ChecklistItem.init({
    content: DataTypes.STRING,
    isCompleted: DataTypes.BOOLEAN,
    cardId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ChecklistItem',
  });
  return ChecklistItem;
};
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.Card, { foreignKey: 'cardId', as: 'card' });
    }
  }
  Message.init({
    content: DataTypes.TEXT,
    authorType: DataTypes.STRING, // 'user', 'mentor', 'ai'
    authorName: DataTypes.STRING,
    cardId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Message',
  });
  return Message;
};
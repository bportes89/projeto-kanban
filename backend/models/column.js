'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Column extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Column.belongsTo(models.Board, { foreignKey: 'boardId', as: 'board' });
      Column.hasMany(models.Card, { foreignKey: 'columnId', as: 'cards' });
    }
  }
  Column.init({
    title: DataTypes.STRING,
    order: DataTypes.INTEGER,
    boardId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Column',
  });
  return Column;
};
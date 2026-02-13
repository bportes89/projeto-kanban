'use strict';

const Sequelize = require('sequelize');
const process = require('process');
const pg = require('pg'); // Required for Vercel/Serverless
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

// Fix for Vercel/Sequelize issue with pg
if (config.dialect === 'postgres') {
  config.dialectModule = pg;
}

let sequelize;
try {
  if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  }
} catch (error) {
  console.error('Error initializing Sequelize:', error);
  throw error;
}

// Manually import models to avoid fs.readdirSync issues in Vercel
const models = [
  require('./board')(sequelize, Sequelize.DataTypes),
  require('./column')(sequelize, Sequelize.DataTypes),
  require('./card')(sequelize, Sequelize.DataTypes),
  require('./checklistitem')(sequelize, Sequelize.DataTypes),
  require('./message')(sequelize, Sequelize.DataTypes)
];

models.forEach(model => {
  db[model.name] = model;
});

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Test connection immediately to catch errors early
sequelize.authenticate().catch(err => {
  console.error('Unable to connect to the database:', err);
});

module.exports = db;

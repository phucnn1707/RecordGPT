require('dotenv').config();
const { Sequelize } = require('sequelize');

//sequelize-auto -h localhost -d gotip -u postgres -x root -p 5432  --dialect postgres -o ./models --cm p --cf l --cp c --noAlias --lang es6 --sg

const database = new Sequelize(
  process.env.EVM_DATABASE_NAME,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.DATABASE_HOST,
    dialect: 'mysql',
    define: {
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at'
    },
    dialectOptions: {
      supportBigNumbers: true,
      multipleStatements: true
    },
    // timezone: '+09:00',
    logging: process.env.QUERY_LOG == 'true'
  }
);

database.dialect.supports.schemas = true;
module.exports = database;

require('module-alias/register');
const sequelize = require('@src/database');
require('@src/models');

const fs = require('fs');

process.nextTick(async () => {
  let query = fs.readFileSync(__dirname + '/trigger.sql', 'utf-8');
  query = query.replace(/EVISCALE_DATABASE/g, process.env.EVISCALE_DATABASE_NAME);
  await sequelize.query(query);
});

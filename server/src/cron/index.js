require('express-async-errors');
require('module-alias/register');

const Model = require('@src/models');
const cron = require('node-cron');

  Model.addRelation()

cron.schedule('0 */1 * * * *', () => {
  console.log("test");;
});

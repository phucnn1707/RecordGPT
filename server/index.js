require('module-alias/register');
require('dotenv').config();
require("./extension");

const { server, app } = require('./app');
const moment = require('moment');
const port = process.env.PORT || 3000;
const Joi = require('joi');
const { Abort, abort } = require('./src/helpers');

process.env.TZ = 'Asia/Tokyo';
moment.tz.setDefault('Asia/Tokyo');

// last route
app.use(function (req, res) {
  return res.status(404).json({
    message: 'Not Found.'
  });
});

app.use(function (err, req, res, next) {
  if (err instanceof Joi.ValidationError) {
    console.log(err);
    err = Abort.fromValidationError(err);
  }

  if (err instanceof Abort) {
    return err.render(req, res, next);
  }

  const message = process?.env?.NODE_ENV === 'production' ? 'Error' : err.message || 'Error';

  console.log(message);
  // return res.status(500).json(message)
});

server.listen(port, () => {
  console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] App listening at http://localhost:${port}`);
});

require('express-async-errors');
require('module-alias/register');
require('@enums');

const http = require('http');
const express = require('express');
const Joi = require('joi');
const cors = require('cors');
const { Abort, abort } = require('@src/helpers');
const socketio = require('socket.io');
const socketInit = require('@src/sockets');
const timeOutTime = process.env.TIMEOUT || 30;

const app = express();
const server = http.createServer(app);
app.disable('x-powered-by');
app.set('trust proxy', true);
const io = socketio(server, {
  cors: '*',
  allowEIO3: true
});

io.on('connection', (socket) => {
  socketInit(socket, io);
});

io.toUser = function (user) {
  let id = '';
  switch (typeof user) {
    case 'string':
      id = user;
      break;
    case 'object':
      id = user.id;
      break;
    default:
      id = user;
  }

  return this.to(`user:${id}`);
};

global.io = io;
exports.server = server;
exports.app = app;

const { authMiddleware } = require('@src/middlewares');

app.use('/files', express.static('storage/public'));

app.use((req, res, next) => {
  res.setTimeout(timeOutTime * 1000, () => {
    return res.error(408, lang.SERVER_TIMEOUT);
  });

  return next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/api', require('@src/routes'));

const Model = require('@src/models');
//const { addHooks } = require('./src/models/hooks');
const lang = require('./src/configs/lang');
//Model.addRelation();
//addHooks({ io });

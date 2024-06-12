const { QueryTypes } = require('sequelize');
const socketio = require('socket.io');
const { defaultLimiter } = require('@src/configs/ratelimit');
const { getEnv } = require('@src/helpers');
const { authenticate, userKey } = require('@src/middlewares');
const { Mutex } = require('async-mutex');

/**
 *
 * @param {socketio.Socket} socket
 * @param {socketio.Server} io
 */
module.exports = function (socket, io) {
  let user = socket[userKey] || null;
  const mutex = new Mutex();

  socket.getIP = function () {
    if (!getEnv('TRUST_PROXY')) {
      return socket.client.conn.remoteAddress;
    }

    const r = this.request.headers['x-forwarded-for'];

    if (typeof r !== 'string') {
      return socket.client.conn.remoteAddress;
    }

    return r.split(',')[0];
  };

  const b = socket.on;

  socket.on = function (event, func) {
    return b.call(this, event, (...args) => {
      if (!['disconnect', 'connect', 'error'].includes(event)) {
        return defaultLimiter
          .consume(`socket:${this.getIP()}`)
          .then(
            () => {
              return mutex.runExclusive(() => func.call(this, ...args));
            },
            (err) => {
              this.emit('client_error', 429);
            }
          )
          .catch((err) => {
            this.emit('error', err);
          });
      }

      return func.call(this, ...args);
    });
  };

  socket.on('authenticate', async (token, res) => {
    res = typeof res === 'function' ? res : () => {};

    if (typeof token !== 'string') {
      return res(false);
    }

    try {
      if (user) {
        // return res(false);
        await socket.leave(`user:${user.id}`);
        await socket.leave(user.user_type == 'lab' ? `lab:${user.lab_id}` : `clinic:${user.clinic_id}`);
      }

      const device = await authenticate(token);
      user = device.User;

      socket[userKey] = user;
      await socket.join([
        `user:${user.id}`,
        user.user_type == 'lab' ? `lab:${user.lab_id}` : `clinic:${user.clinic_id}`
      ]);

      return res(true, user);
    } catch (err) {
      console.log(err);
      return res(false);
    }
  });
};

const moment = require('moment');

//const { checkPaymentStatus } = require('../services/auth');
const { AccessToken, UserLoginLog } = require('../models');

const Lang = require('../configs/lang');
const { userRoleLabEnum } = require('../enums/index');
const { abort } = require('../helpers');
const jwt = require('../plugins/jwt');

const userKey = (exports.userKey = Symbol('User key'));
const tokenKey = (exports.tokenKey = Symbol('Token key'));

exports.authMiddleware = async (req, res, next) => {
  // const authorization = req.headers['authorization'];
  // if (!authorization) {
  //   return next();
  // }

  let currentPath = req.originalUrl.replace('/api/', '').split("?")[0];
  if(currentPath == 'labs' || currentPath == 'labs/check-exist-info') {
    return next();
  }

  const tokenFromClient = req.header('Authorization') && req.header('Authorization').replace('Bearer ', '');

  if (tokenFromClient) {
    try {
      const device = await this.authenticate(tokenFromClient);

      if (!device) {
        return abort(401, Lang.TOKEN_INVALID_LOGIN);
      }

      let user = device.User;

      req[userKey] = user;
      req[tokenKey] = device.token;
      req.currentAccessToken = device;
    } catch (err) {
      return abort(401, Lang.TOKEN_INVALID_LOGIN);
    }
  } else {
    return abort(403, Lang.NO_TOKEN_PROVIDED);
  }

  if (currentPath != 'profile/update-card' && req.user().user_type == 'lab') {
    const payment_status = await checkPaymentStatus(req.user().lab_id);

    if (!payment_status) {
      return abort(401, Lang.NONE_CARD);
    }
  }

  return next();
};

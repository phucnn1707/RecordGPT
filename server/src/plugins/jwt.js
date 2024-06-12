const jwt = require('jsonwebtoken');
const moment = require('moment');

const accessTokenSecret =
  process.env.ACCESS_TOKEN_SECRET || 'access-token-secret-ptudw';

exports.generateToken = (userId, parentId, exp) => {
  const expiresAt = moment().add(exp, 'seconds').toDate();

  return new Promise((resolve, reject) => {
    jwt.sign(
      { userId: userId, parentId: parentId },
      accessTokenSecret,
      { expiresIn: moment().valueOf(expiresAt) },
      (error, token) => {
        if (error) {
          return reject(error);
        }
        resolve(token);
      }
    );
  });
};

exports.verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, accessTokenSecret, (error, decoded) => {
      if (error) {
        return reject(error);
      }
      resolve(decoded);
    });
  });
};

exports.decoded = (token) => {
  return jwt.decode(token);
};

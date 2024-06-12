const bcrypt = require("bcrypt");

exports.hashPassword = (str) => {
  return bcrypt.hashSync(str, 10);
};

exports.checkPassword = (str, hashed) => {
  return bcrypt.compareSync(str, hashed);
};
const lang = require('../configs/lang');

class Abort extends Error {
  constructor(code, message, merge = {}) {
    super(message);
    this.code = code;
    this.merge = merge;
  }

  /**
   *
   * @param {*} req
   * @param {Express.Response} res
   * @param {*} next
   * @returns
   */
  render(req, res, next) {
    return res.error(this.code, this.message, this.merge);
  }

  static fromValidationError(err) {
    const errors = err.details.reduce((prev, curr) => {
      const path = curr.path.join('.');

      if (!prev[path]) {
        prev[path] = [];
      }

      prev[path].push(lang.MAP_JOI_MESSAGE(curr));

      return prev;
    }, {});

    // for(let index of errors) {
    //   console.log(errors[index]);
    // }

    return new this(422, 'Validation Error', { errors });
  }
}

exports.abort = function (code, message = '', merge = {}) {
  throw new exports.Abort(code, message, merge);
};

exports.randomString = function (length = 6) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

exports.mathClamp = function (val, min, max) {
  if (isNaN(val)) {
    return min;
  }

  val = parseFloat(val);

  return val < min ? min : val > max ? max : val;
};

exports.mathClampInt = function (val, min, max) {
  val = exports.mathClamp(val, min, max);
  return Math.floor(val);
};

exports.formatTime = (value, helpers) => {
  let regEx = /([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]/g;

  if (!regEx.test(value)) {
    return helpers.error('any.invalid');
  }

  return value;
};

exports.getEnv = function (name, defaultValue = null) {
  if (typeof process.env[name] === 'undefined') {
    return defaultValue;
  }

  if (['false', 'off'].includes(process.env[name])) {
    return false;
  }

  if (['true', 'on'].includes(process.env[name])) {
    return false;
  }

  if (/^\d+$/.test(process.env[name])) {
    return +process.env[name];
  }

  return process.env[name];
};

exports.timePointValidate = (values, helpers) => {
  let regEx = /^[0-9]*(\.[0-9]{0,2})?$/;

  if (!regEx.test(values)) {
    return helpers.error('any.invalid');
  }

  return values;
};

exports.Abort = Abort;

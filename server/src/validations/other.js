const Joi = require('joi');
const Lang = require('@src/configs/lang');

exports.verifyTokenValidation = Joi.object({
  code: Joi.string()
    .required()
    .messages({
      'any.required': Lang.REQUIRED('Code')
    }),
  type: Joi.string()
    .required()
    .messages({
      'any.required': Lang.REQUIRED('Type')
    })
});

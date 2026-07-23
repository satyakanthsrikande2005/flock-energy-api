const Joi = require('joi');

const meterIdParamSchema = Joi.object({
  id: Joi.string().trim().min(1).max(64).required(),
});

const meterListQuerySchema = Joi.object({
  q: Joi.string().trim().allow('').default(''),
  page: Joi.number().integer().min(1).default(1),
});

const consumptionQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
});

const hierarchyQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
});

module.exports = {
  meterIdParamSchema,
  meterListQuerySchema,
  consumptionQuerySchema,
  hierarchyQuerySchema,
};

const { errorResponse } = require('../models/responseModels');

/**
 * Joi validation middleware factory.
 * @param {import('joi').ObjectSchema} schema
 * @param {'body'|'query'|'params'} source
 * @returns {Function}
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join('; ');
      return res.status(400).json(errorResponse(400, message));
    }

    req[source] = value;
    return next();
  };
}

module.exports = validate;

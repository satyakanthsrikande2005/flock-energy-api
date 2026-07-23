const dotenv = require('dotenv');
const Joi = require('joi');

dotenv.config();

const envSchema = Joi.object({
  BASE_URL: Joi.string().uri().required(),
  USERNAME: Joi.string().trim().required(),
  PASSWORD: Joi.string().min(1).required(),
  REQUEST_TIMEOUT: Joi.number().integer().min(1000).default(30000),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
}).unknown(true);

const { value, error } = envSchema.validate(process.env, {
  abortEarly: false,
  convert: true,
});

if (error) {
  throw new Error(`Environment validation failed: ${error.message}`);
}

module.exports = {
  baseUrl: value.BASE_URL.replace(/\/$/, ''),
  username: value.USERNAME,
  password: value.PASSWORD,
  requestTimeout: value.REQUEST_TIMEOUT,
  logLevel: value.LOG_LEVEL,
  port: value.PORT,
};

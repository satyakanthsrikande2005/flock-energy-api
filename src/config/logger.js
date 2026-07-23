const path = require('path');
const winston = require('winston');
const { logLevel } = require('./env');

function sanitizeMeta(meta) {
  if (!meta || typeof meta !== 'object') return meta;
  const sanitized = { ...meta };
  ['password', 'cookie', 'authorization', 'token', 'secret'].forEach((key) => {
    if (sanitized[key]) sanitized[key] = '***REDACTED***';
  });
  return sanitized;
}

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const cleanMeta = sanitizeMeta(meta);
    const metaString = Object.keys(cleanMeta).length ? ` ${JSON.stringify(cleanMeta)}` : '';
    return stack
      ? `${timestamp} [${level.toUpperCase()}]: ${message}${metaString}\n${stack}`
      : `${timestamp} [${level.toUpperCase()}]: ${message}${metaString}`;
  })
);

const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'app.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

module.exports = logger;

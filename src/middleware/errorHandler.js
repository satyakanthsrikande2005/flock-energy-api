const logger = require('../config/logger');
const { errorResponse, AppError } = require('../models/responseModels');

/**
 * Global error handler — never crashes the server.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.response?.status || 500;
  const message =
    err.isOperational !== false && err.message
      ? err.message
      : 'Internal server error';

  logger.error('Request failed', {
    reqId: req.id,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message: err.message,
    stack: err.stack,
  });

  if (!err.isOperational) {
    logger.error('Unexpected error', { stack: err.stack });
  }

  const code = err instanceof AppError ? err.statusCode : statusCode;
  const safeMessage =
    code >= 500 && !err.isOperational ? 'Internal server error' : message;

  res.status(code >= 400 && code < 600 ? code : 500).json(errorResponse(code, safeMessage));
}

module.exports = errorHandler;

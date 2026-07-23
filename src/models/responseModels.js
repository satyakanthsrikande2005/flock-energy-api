/**
 * Standard API response helpers and custom application error class.
 */

/**
 * Express helper to send standardized success response.
 * @param {import('express').Response} res
 * @param {*} [data={}]
 * @param {string} [message='Success']
 * @param {number} [statusCode=200]
 */
function sendSuccess(res, data = {}, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Express helper to send standardized error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode=500]
 */
function sendError(res, message, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode,
      message,
    },
  });
}

/**
 * Standard success envelope builder.
 * @param {string} message
 * @param {*} [data]
 * @returns {object}
 */
function successResponse(message, data = {}) {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Standard error envelope builder.
 * @param {number} code
 * @param {string} message
 * @returns {object}
 */
function errorResponse(code, message) {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

/**
 * Custom application error with HTTP status.
 */
class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} [statusCode=500]
   * @param {boolean} [isOperational=true]
   */
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = 'AppError';
  }
}

module.exports = {
  sendSuccess,
  sendError,
  successResponse,
  errorResponse,
  AppError,
};

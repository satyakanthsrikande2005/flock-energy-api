const { errorResponse } = require('../models/responseModels');

/**
 * 404 handler for unknown routes.
 */
function notFound(req, res) {
  res.status(404).json(errorResponse(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;

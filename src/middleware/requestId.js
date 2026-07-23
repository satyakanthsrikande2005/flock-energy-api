const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to assign a unique Request ID to each incoming HTTP request.
 * Attaches req.id and sets the X-Request-Id response header.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requestId(req, res, next) {
  const incomingRequestId = req.headers['x-request-id'];
  const id = incomingRequestId && typeof incomingRequestId === 'string'
    ? incomingRequestId
    : uuidv4();

  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}

module.exports = requestId;

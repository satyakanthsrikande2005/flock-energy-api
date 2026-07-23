const logger = require('../config/logger');

/**
 * Retry an async operation with exponential backoff.
 * @param {Function} fn - Async function to execute
 * @param {object} [options]
 * @param {number} [options.maxAttempts=3]
 * @param {number} [options.baseDelayMs=500]
 * @param {Function} [options.shouldRetry] - Predicate to decide retry
 * @returns {Promise<*>}
 */
async function retry(fn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelayMs = 500,
    shouldRetry = () => true,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;

      if (attempt >= maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }

      const exponentialDelay = baseDelayMs * 2 ** (attempt - 1);
      const jitter = Math.random() * 100;
      const delay = Math.min(exponentialDelay + jitter, 10000);

      logger.warn('Retrying operation', {
        attempt,
        maxAttempts,
        delayMs: Math.round(delay),
        error: error.message,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

module.exports = { retry };

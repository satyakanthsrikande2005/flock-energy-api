const logger = require('../config/logger');
const { SESSION_INDICATORS } = require('../utils/constants');
const { AppError } = require('../models/responseModels');

/**
 * Manages authenticated session state and re-authentication.
 */
class SessionManager {
  /**
   * @param {import('./auth').default|import('./auth')} auth
   */
  constructor(auth) {
    this.auth = auth;
    this.reauthInProgress = false;
  }

  /**
   * Detect whether a response indicates an expired session.
   * @param {import('axios').AxiosResponse} response
   * @returns {boolean}
   */
  isSessionExpired(response) {
    const { status, request, data } = response;
    const finalUrl = request?.res?.responseUrl || response.config?.url || '';

    if (SESSION_INDICATORS.UNAUTHORIZED_STATUSES.includes(status)) {
      return true;
    }

    if (finalUrl.includes(SESSION_INDICATORS.LOGIN_PATH)) {
      return true;
    }

    if (typeof data === 'string' && data.includes('Urja Meter Ops') && data.includes('Sign in')) {
      return true;
    }

    return false;
  }

  /**
   * Ensure the client is authenticated before making requests.
   * @returns {Promise<void>}
   */
  async ensureAuthenticated() {
    if (!this.auth.isAuthenticated) {
      await this.auth.login();
    }
  }

  /**
   * Re-authenticate once when session expires.
   * @returns {Promise<void>}
   */
  async reauthenticate() {
    if (this.reauthInProgress) {
      throw new AppError('Re-authentication already in progress', 503);
    }

    this.reauthInProgress = true;

    try {
      logger.warn('Session expired — re-authenticating');
      this.auth.isAuthenticated = false;
      await this.auth.login();
    } finally {
      this.reauthInProgress = false;
    }
  }
}

module.exports = SessionManager;

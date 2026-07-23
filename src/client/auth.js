const logger = require('../config/logger');
const { PORTAL_PATHS } = require('../utils/constants');
const { AppError } = require('../models/responseModels');

/**
 * Authentication helpers for the Urja portal.
 */
class UrjaAuth {
  /**
   * @param {import('axios').AxiosInstance} httpClient
   * @param {object} credentials
   * @param {string} credentials.baseUrl
   * @param {string} credentials.username
   * @param {string} credentials.password
   * @param {string} [credentials.authStrategy='form'] - 'form' | 'json'
   */
  constructor(httpClient, credentials) {
    this.httpClient = httpClient;
    this.baseUrl = credentials.baseUrl;
    this.username = credentials.username;
    this.password = credentials.password;
    this.authStrategy = credentials.authStrategy || 'form';
    this.isAuthenticated = false;
  }

  /**
   * Extract potential CSRF token from page HTML or meta tags if required.
   * @param {string} html
   * @returns {string|null}
   */
  extractCsrfToken(html) {
    if (!html || typeof html !== 'string') return null;
    const metaMatch = html.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i);
    if (metaMatch) return metaMatch[1];
    const inputMatch = html.match(/<input\s+type=["']hidden["']\s+name=["'](?:csrf_token|_csrf|csrf)["']\s+value=["']([^"']+)["']/i);
    return inputMatch ? inputMatch[1] : null;
  }

  /**
   * Authenticate with the legacy portal using adaptive request payload formats.
   * Supports Form URL Encoded, JSON Body, CSRF Token pre-fetching, and Redirects.
   * @returns {Promise<void>}
   */
  async login() {
    logger.info('Attempting Urja portal login', { username: this.username, strategy: this.authStrategy });

    try {
      let csrfToken = null;

      // Step 1: Pre-fetch login GET page to acquire CSRF token or session cookie if available
      try {
        const pageRes = await this.httpClient.get(`${this.baseUrl}${PORTAL_PATHS.LOGIN}`, {
          validateStatus: () => true,
        });
        if (typeof pageRes.data === 'string') {
          csrfToken = this.extractCsrfToken(pageRes.data);
        }
      } catch (err) {
        logger.debug('Pre-login GET fetch skipped or unavailable', { message: err.message });
      }

      // Step 2: Build payload based on adaptive auth strategy
      let bodyData;
      let contentType;

      if (this.authStrategy === 'json') {
        contentType = 'application/json';
        bodyData = {
          email: this.username,
          username: this.username,
          password: this.password,
          ...(csrfToken ? { _csrf: csrfToken } : {}),
        };
      } else {
        contentType = 'application/x-www-form-urlencoded';
        const params = new URLSearchParams({
          email: this.username,
          username: this.username,
          password: this.password,
        });
        if (csrfToken) params.append('_csrf', csrfToken);
        bodyData = params.toString();
      }

      // Step 3: Execute authentication request
      const response = await this.httpClient.post(
        `${this.baseUrl}${PORTAL_PATHS.LOGIN}`,
        bodyData,
        {
          headers: {
            'Content-Type': contentType,
            ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
          },
          maxRedirects: 5,
          validateStatus: (status) => status < 500,
        }
      );

      const finalUrl = response.request?.res?.responseUrl || response.config.url || '';
      const isLoginPage = finalUrl.includes('/login') && response.status !== 303;

      if (response.status === 401 || response.status === 403) {
        throw new AppError('Invalid credentials', 401);
      }

      if (isLoginPage && response.data && typeof response.data === 'string') {
        const hasError =
          response.data.includes('Invalid') ||
          response.data.includes('error') ||
          response.data.includes('Sign in');
        if (hasError && response.status === 200) {
          throw new AppError('Login failed — check credentials', 401);
        }
      }

      if (response.status >= 400) {
        throw new AppError(`Login failed with status ${response.status}`, 401);
      }

      this.isAuthenticated = true;
      logger.info('Urja portal login successful');
    } catch (error) {
      this.isAuthenticated = false;

      if (error instanceof AppError) {
        logger.warn('Login failed', { message: error.message });
        throw error;
      }

      logger.error('Login request failed', { message: error.message });
      throw new AppError('Unable to reach Urja portal for authentication', 503);
    }
  }

  /**
   * Clear session on the legacy portal.
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      await this.httpClient.post(`${this.baseUrl}${PORTAL_PATHS.LOGOUT}`, null, {
        validateStatus: () => true,
      });
      logger.info('Urja portal logout completed');
    } catch (error) {
      logger.warn('Logout request failed', { message: error.message });
    } finally {
      this.isAuthenticated = false;
    }
  }
}

module.exports = UrjaAuth;

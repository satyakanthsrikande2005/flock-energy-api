const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const env = require('../config/env');
const logger = require('../config/logger');
const { retry } = require('../utils/retry');
const { PORTAL_PATHS, PAGINATION } = require('../utils/constants');
const { AppError } = require('../models/responseModels');
const UrjaAuth = require('./auth');
const SessionManager = require('./sessionManager');
const UrjaParser = require('./parser');

/**
 * Reusable client for the legacy Urja Meter Ops Portal.
 * Handles session cookies, authentication, retries, and response parsing.
 */
class UrjaPortalClient {
  /**
   * @param {object} [options]
   * @param {string} [options.baseUrl]
   * @param {string} [options.username]
   * @param {string} [options.password]
   * @param {number} [options.timeout]
   */
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || env.baseUrl).replace(/\/$/, '');
    this.timeout = options.timeout || env.requestTimeout;

    this.cookieJar = new CookieJar();
    this.httpClient = wrapper(
      axios.create({
        jar: this.cookieJar,
        withCredentials: true,
        timeout: this.timeout,
        headers: {
          Accept: 'application/json, text/html, */*',
          'User-Agent': 'FlockEnergyApi/1.0',
        },
      })
    );

    this.auth = new UrjaAuth(this.httpClient, {
      baseUrl: this.baseUrl,
      username: options.username || env.username,
      password: options.password || env.password,
    });

    this.sessionManager = new SessionManager(this.auth);
    this.parser = new UrjaParser();
  }

  /**
   * Authenticated request with automatic re-login on session expiry.
   * Retries the original request once after re-authentication.
   * @param {import('axios').AxiosRequestConfig} config
   * @param {boolean} [retried=false]
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  async request(config, retried = false) {
    await this.sessionManager.ensureAuthenticated();

    const url = config.url?.startsWith('http')
      ? config.url
      : `${this.baseUrl}${config.url}`;

    logger.debug('Portal request', { method: config.method || 'GET', url });

    try {
      const response = await this.httpClient.request({
        ...config,
        url,
        validateStatus: () => true,
      });

      logger.debug('Portal response', {
        url,
        status: response.status,
        contentType: response.headers['content-type'],
      });

      if (this.sessionManager.isSessionExpired(response)) {
        if (retried) {
          throw new AppError('Session expired and re-authentication failed', 401);
        }

        await this.sessionManager.reauthenticate();
        return this.request(config, true);
      }

      if (response.status >= 500) {
        throw new AppError(`Portal server error (${response.status})`, 502);
      }

      if (response.status === 404) {
        throw new AppError('Resource not found on portal', 404);
      }

      if (response.status >= 400) {
        throw new AppError(
          `Portal request failed (${response.status})`,
          response.status
        );
      }

      return response;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new AppError('Portal request timed out', 504);
      }

      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Portal request error', { message: error.message });
      throw new AppError('Failed to communicate with Urja portal', 503);
    }
  }

  /**
   * Parse response body as JSON or HTML fallback.
   * @param {import('axios').AxiosResponse} response
   * @returns {object|string}
   */
  parseResponseBody(response) {
    const contentType = response.headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      return typeof response.data === 'string'
        ? JSON.parse(response.data)
        : response.data;
    }

    if (typeof response.data === 'object') {
      return response.data;
    }

    return response.data;
  }

  /** @returns {Promise<void>} */
  async login() {
    await this.auth.login();
  }

  /** @returns {Promise<void>} */
  async logout() {
    await this.auth.logout();
  }

  /**
   * @param {object} [params]
   * @param {string} [params.q]
   * @param {number} [params.page]
   * @returns {Promise<object>}
   */
  async getMeters(params = {}) {
    const q = params.q ?? '';
    const page = params.page ?? PAGINATION.DEFAULT_PAGE;

    const response = await retry(
      () =>
        this.request({
          method: 'GET',
          url: `${PORTAL_PATHS.METERS_SEARCH}?q=${encodeURIComponent(q)}&page=${page}`,
        }),
      {
        maxAttempts: 2,
        shouldRetry: (error) => error.statusCode >= 500 || error.statusCode === 504,
      }
    );

    const body = this.parseResponseBody(response);

    if (typeof body === 'string') {
      const meters = this.parser.parseMetersFromHtml(body);
      return { meters, total: meters.length, page };
    }

    return this.parser.parseMetersList(body, page);
  }

  /**
   * @param {string} meterId
   * @returns {Promise<object>}
   */
  async getMeterById(meterId) {
    const response = await this.request({
      method: 'GET',
      url: `${PORTAL_PATHS.METER_DETAIL}/${encodeURIComponent(meterId)}`,
    });

    const body = this.parseResponseBody(response);
    const detail = this.parser.parseMeterDetail(body, meterId);

    try {
      const [geoResponse, energyResponse] = await Promise.all([
        this.request({
          method: 'GET',
          url: `${PORTAL_PATHS.METER_GEO}/${encodeURIComponent(meterId)}/geo`,
        }),
        this.request({
          method: 'GET',
          url: `${PORTAL_PATHS.METER_ENERGY}/${encodeURIComponent(meterId)}/energy`,
        }),
      ]);

      const geoBody = this.parseResponseBody(geoResponse);
      const energyBody = this.parseResponseBody(energyResponse);

      detail.geo = this.parser.parseGeo(geoBody);
      detail.latestReading =
        this.parser.parseConsumption(energyBody).slice(-1)[0] || null;
    } catch (error) {
      logger.warn('Failed to enrich meter detail', {
        meterId,
        message: error.message,
      });
    }

    return detail;
  }

  /**
   * @param {string} meterId
   * @returns {Promise<object>}
   */
  async getMeterConsumption(meterId) {
    const response = await this.request({
      method: 'GET',
      url: `${PORTAL_PATHS.METER_ENERGY}/${encodeURIComponent(meterId)}/energy`,
    });

    const body = this.parseResponseBody(response);
    const readings = this.parser.parseConsumption(body);

    return {
      meterId,
      readings,
      count: readings.length,
    };
  }

  /**
   * @param {object} [params]
   * @param {number} [params.page]
   * @returns {Promise<object>}
   */
  async getHierarchy(params = {}) {
    const page = params.page ?? PAGINATION.DEFAULT_PAGE;

    const response = await this.request({
      method: 'GET',
      url: `${PORTAL_PATHS.HIERARCHY}?page=${page}`,
    });

    const body = this.parseResponseBody(response);
    const { transformers, total } = this.parser.parseTransformers(body, page);
    const tree = this.parser.buildHierarchyTree(transformers);

    return {
      feeders: tree,
      transformers,
      total,
      page,
    };
  }
}

module.exports = UrjaPortalClient;

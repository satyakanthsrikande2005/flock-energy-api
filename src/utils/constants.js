/** Application-wide constants for the Flock Energy API Wrapper. */

const API_VERSION = '/api/v1';

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

/**
 * Configurable legacy portal URL path templates.
 * NOTE: Actual production paths are confirmed during Protocol Discovery
 * via Chrome/Firefox Developer Tools (HAR export).
 */
const PORTAL_PATHS = {
  LOGIN: process.env.PORTAL_PATH_LOGIN || '/login',
  LOGOUT: process.env.PORTAL_PATH_LOGOUT || '/api/auth/sign-out',
  METERS_SEARCH: process.env.PORTAL_PATH_METERS || '/portal/meters/search',
  METER_DETAIL: process.env.PORTAL_PATH_METER_DETAIL || '/portal/meters',
  METER_GEO: process.env.PORTAL_PATH_METER_GEO || '/portal/meters',
  METER_ENERGY: process.env.PORTAL_PATH_METER_ENERGY || '/portal/meters',
  HIERARCHY: process.env.PORTAL_PATH_HIERARCHY || '/portal/dts',
};

const SESSION_INDICATORS = {
  LOGIN_PATH: '/login',
  UNAUTHORIZED_STATUSES: [HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN],
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  PAGE_SIZE: 20,
};

const RETRY_CONFIG = {
  DEFAULT_MAX_ATTEMPTS: 3,
  DEFAULT_BASE_DELAY_MS: 500,
  DEFAULT_MAX_DELAY_MS: 3000,
  RETRYABLE_STATUSES: [
    HTTP_STATUS.BAD_GATEWAY,
    HTTP_STATUS.SERVICE_UNAVAILABLE,
    HTTP_STATUS.GATEWAY_TIMEOUT,
  ],
};

const MESSAGES = {
  SUCCESS: 'Success',
  UNAUTHORIZED: 'Invalid credentials or expired session',
  SESSION_EXPIRED: 'Session expired and re-authentication failed',
  RESOURCE_NOT_FOUND: 'Requested resource not found on legacy portal',
  PORTAL_ERROR: 'Failed to communicate with Urja portal',
  PORTAL_TIMEOUT: 'Portal request timed out',
};

module.exports = {
  API_VERSION,
  HTTP_STATUS,
  PORTAL_PATHS,
  SESSION_INDICATORS,
  PAGINATION,
  RETRY_CONFIG,
  MESSAGES,
};

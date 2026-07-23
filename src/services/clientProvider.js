const UrjaPortalClient = require('../client/urjaClient');

/** Singleton portal client for the application lifecycle. */
const portalClient = new UrjaPortalClient();

/**
 * @param {UrjaPortalClient} [client]
 * @returns {UrjaPortalClient}
 */
function getClient(client = portalClient) {
  return client;
}

module.exports = {
  portalClient,
  getClient,
};

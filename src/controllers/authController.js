const { getClient } = require('../services/clientProvider');
const { successResponse } = require('../models/responseModels');

/**
 * Authentication controller — proxies login to the legacy portal.
 */
async function login(req, res) {
  const client = getClient();
  await client.login();

  res.status(200).json(
    successResponse('Authenticated with Urja portal', {
      authenticated: true,
    })
  );
}

module.exports = {
  login,
};

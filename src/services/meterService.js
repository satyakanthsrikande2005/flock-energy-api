const { getClient } = require('./clientProvider');
const { AppError } = require('../models/responseModels');

/**
 * Business logic for meter-related operations.
 */
class MeterService {
  /**
   * @param {import('../client/urjaClient')} [client]
   */
  constructor(client) {
    this.client = client || getClient();
  }

  /**
   * @param {object} query
   * @param {string} [query.q]
   * @param {number} [query.page]
   */
  async listMeters(query) {
    return this.client.getMeters(query);
  }

  /**
   * @param {string} meterId
   */
  async getMeter(meterId) {
    try {
      return await this.client.getMeterById(meterId);
    } catch (error) {
      if (error.statusCode === 404) {
        throw new AppError(`Meter not found: ${meterId}`, 404);
      }
      throw error;
    }
  }

  /**
   * @param {string} meterId
   */
  async getConsumption(meterId) {
    try {
      return await this.client.getMeterConsumption(meterId);
    } catch (error) {
      if (error.statusCode === 404) {
        throw new AppError(`Meter not found: ${meterId}`, 404);
      }
      throw error;
    }
  }
}

module.exports = new MeterService();
module.exports.MeterService = MeterService;

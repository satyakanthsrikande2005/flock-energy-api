const { getClient } = require('./clientProvider');

/**
 * Business logic for distribution hierarchy operations.
 */
class HierarchyService {
  /**
   * @param {import('../client/urjaClient')} [client]
   */
  constructor(client) {
    this.client = client || getClient();
  }

  /**
   * @param {object} query
   * @param {number} [query.page]
   */
  async getHierarchy(query) {
    return this.client.getHierarchy(query);
  }
}

module.exports = new HierarchyService();
module.exports.HierarchyService = HierarchyService;

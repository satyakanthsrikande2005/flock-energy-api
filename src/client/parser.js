const cheerio = require('cheerio');
const logger = require('../config/logger');
const {
  normalizeString,
  normalizeNumber,
  normalizeDate,
  formatMeterSummary,
  formatConsumptionReading,
  formatHierarchyBreadcrumb,
} = require('../utils/formatter');
const { AppError } = require('../models/responseModels');

/**
 * Parse and normalize legacy portal responses (JSON or HTML).
 */
class UrjaParser {
  /**
   * Parse JSON portal API response.
   * @param {object} payload
   * @returns {object}
   */
  parseJsonResponse(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new AppError('Unexpected response format from portal', 502);
    }
    return payload;
  }

  /**
   * Parse meters list from portal JSON.
   * @param {object} payload
   * @returns {{ meters: object[], total: number, page: number }}
   */
  parseMetersList(payload, page = 1) {
    const parsed = this.parseJsonResponse(payload);
    const meters = Array.isArray(parsed.data)
      ? parsed.data.map(formatMeterSummary)
      : [];

    return {
      meters,
      total: normalizeNumber(parsed.total) ?? meters.length,
      page,
    };
  }

  /**
   * Parse meter detail from portal JSON.
   * @param {object} payload
   * @param {string} meterId
   * @returns {object}
   */
  parseMeterDetail(payload, meterId) {
    const parsed = this.parseJsonResponse(payload);
    const data = parsed.data ?? parsed;

    const detail = this.parseDetailFields(data.detail ?? data);
    const hierarchy = formatHierarchyBreadcrumb(data.hierarchy ?? {});

    return {
      id: normalizeString(data.meterId || meterId),
      serialNumber: normalizeString(data.serialNo || data.serialNumber),
      status: normalizeString(data.installStatus || data.status),
      location: data.location || null,
      feeder: normalizeString(data.hierarchy?.Feeder || data.feeder),
      nameplate: detail,
      hierarchy,
      geo: data.geo
        ? {
            latitude: normalizeNumber(data.geo.latitude),
            longitude: normalizeNumber(data.geo.longitude),
          }
        : null,
    };
  }

  /**
   * Parse nameplate/detail fields from mixed portal formats.
   * @param {object} detail
   * @returns {object[]}
   */
  parseDetailFields(detail) {
    if (!detail) return [];

    if (detail.classData) {
      try {
        const classData =
          typeof detail.classData === 'string'
            ? JSON.parse(detail.classData)
            : detail.classData;
        const installed = classData.installed_meter ?? classData;
        return Object.entries(installed).map(([label, value]) => ({
          label,
          value: normalizeString(value),
        }));
      } catch (error) {
        logger.warn('Failed to parse classData JSON', { message: error.message });
      }
    }

    if (Array.isArray(detail.data)) {
      return detail.data.map((item) => ({
        label: normalizeString(item.parameterName || item.label),
        value: normalizeString(item.parameterValue || item.value),
      }));
    }

    if (typeof detail === 'object') {
      return Object.entries(detail)
        .filter(([key]) => !['hierarchy', 'classData', 'meterId'].includes(key))
        .map(([label, value]) => ({
          label,
          value: normalizeString(value),
        }));
    }

    return [];
  }

  /**
   * Parse consumption readings.
   * @param {object} payload
   * @returns {object[]}
   */
  parseConsumption(payload) {
    const parsed = this.parseJsonResponse(payload);
    const readings = Array.isArray(parsed.data) ? parsed.data : [];

    return readings.map(formatConsumptionReading);
  }

  /**
   * Parse geo location response.
   * @param {object} payload
   * @returns {object|null}
   */
  parseGeo(payload) {
    const parsed = this.parseJsonResponse(payload);
    if (!parsed.data) return null;

    return {
      latitude: normalizeNumber(parsed.data.latitude),
      longitude: normalizeNumber(parsed.data.longitude),
    };
  }

  /**
   * Parse distribution transformers for hierarchy view.
   * @param {object} payload
   * @param {number} page
   * @returns {{ transformers: object[], total: number, page: number }}
   */
  parseTransformers(payload, page = 1) {
    const parsed = this.parseJsonResponse(payload);
    const transformers = Array.isArray(parsed.data)
      ? parsed.data.map((dt) => ({
          code: normalizeString(dt.code),
          name: normalizeString(dt.name),
          feederCode: normalizeString(dt.feederCode),
          capacityKva: normalizeNumber(dt.capacityKva),
        }))
      : [];

    return {
      transformers,
      total: normalizeNumber(parsed.total) ?? transformers.length,
      page,
    };
  }

  /**
   * Build hierarchy tree grouped by feeder from transformer data.
   * @param {object[]} transformers
   * @returns {object[]}
   */
  buildHierarchyTree(transformers) {
    const feeders = new Map();

    transformers.forEach((dt) => {
      const feederKey = dt.feederCode || 'Unknown';
      if (!feeders.has(feederKey)) {
        feeders.set(feederKey, {
          feeder: feederKey,
          transformers: [],
        });
      }
      feeders.get(feederKey).transformers.push({
        code: dt.code,
        name: dt.name,
        capacityKva: dt.capacityKva,
      });
    });

    return Array.from(feeders.values());
  }

  /**
   * Fallback HTML parser when portal returns HTML instead of JSON.
   * @param {string} html
   * @returns {object[]}
   */
  parseMetersFromHtml(html) {
    if (!html || typeof html !== 'string') {
      throw new AppError('Invalid HTML response from portal', 502);
    }

    const $ = cheerio.load(html);
    const meters = [];

    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 2) return;

      const link = $(cells[0]).find('a');
      const meterId = normalizeString(link.text() || $(cells[0]).text());

      if (!meterId) return;

      meters.push(
        formatMeterSummary({
          meterId,
          serialNo: $(cells[1]).text(),
          make: $(cells[2]).text(),
          phaseType: $(cells[3]).text(),
          installStatus: $(cells[4]).text(),
          dtCode: $(cells[5]).text(),
        })
      );
    });

    if (meters.length === 0) {
      logger.warn('HTML parsing yielded no meter rows');
    }

    return meters;
  }
}

module.exports = UrjaParser;

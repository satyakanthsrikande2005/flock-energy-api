/**
 * Normalize a string value, returning null for empty placeholders.
 * @param {unknown} value
 * @returns {string|null}
 */
function normalizeString(value) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === '—' || trimmed === '-' || trimmed === 'N/A') {
    return null;
  }
  return trimmed;
}

/**
 * Parse a numeric value from mixed input.
 * @param {unknown} value
 * @returns {number|null}
 */
function normalizeNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Parse boolean-like values.
 * @param {unknown} value
 * @returns {boolean|null}
 */
function normalizeBoolean(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['true', 'yes', '1', 'active', 'installed'].includes(normalized)) return true;
  if (['false', 'no', '0', 'inactive'].includes(normalized)) return false;
  return null;
}

/**
 * Normalize ISO-like timestamps.
 * @param {unknown} value
 * @returns {string|null}
 */
function normalizeDate(value) {
  const str = normalizeString(value);
  if (!str) return null;
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? str : date.toISOString();
}

/**
 * Format a meter summary object for API consumers.
 * @param {object} meter
 * @returns {object}
 */
function formatMeterSummary(meter) {
  return {
    id: normalizeString(meter.meterId || meter.id),
    serialNumber: normalizeString(meter.serialNo || meter.serialNumber),
    make: normalizeString(meter.make),
    phaseType: normalizeString(meter.phaseType),
    status: normalizeString(meter.installStatus || meter.status),
    dtCode: normalizeString(meter.dtCode),
  };
}

/**
 * Format consumption reading for API consumers.
 * @param {object} reading
 * @returns {object}
 */
function formatConsumptionReading(reading) {
  return {
    timestamp: normalizeDate(reading.timestamp),
    kwh: normalizeNumber(reading.kwh),
    kvah: normalizeNumber(reading.kvah),
    voltageR: normalizeNumber(reading.voltR || reading.voltageR),
  };
}

/**
 * Format hierarchy breadcrumb from portal data.
 * @param {object} hierarchy
 * @returns {object[]}
 */
function formatHierarchyBreadcrumb(hierarchy = {}) {
  const levels = [
    'Zone',
    'Circle',
    'Division',
    'Subdivision',
    'Sub Station',
    'Feeder',
    'DT',
  ];

  return levels
    .map((level) => ({
      level,
      name: normalizeString(hierarchy[level]),
    }))
    .filter((item) => item.name);
}

module.exports = {
  normalizeString,
  normalizeNumber,
  normalizeBoolean,
  normalizeDate,
  formatMeterSummary,
  formatConsumptionReading,
  formatHierarchyBreadcrumb,
};

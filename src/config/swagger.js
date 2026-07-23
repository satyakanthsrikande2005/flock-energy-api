const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Flock Energy API',
    version: '1.0.0',
    description:
      'REST API wrapper for the Urja Meter Ops Portal. Provides normalized JSON access to smart meter data, consumption history, and distribution hierarchy.',
    contact: {
      name: 'Flock Energy',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication with the legacy portal' },
    { name: 'Meters', description: 'Smart meter operations' },
    { name: 'Hierarchy', description: 'Distribution network hierarchy' },
    { name: 'Health', description: 'Service health checks' },
  ],
  components: {
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Success' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'integer', example: 400 },
              message: { type: 'string', example: 'Validation failed' },
            },
          },
        },
      },
      MeterSummary: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'MTR-001' },
          serialNumber: { type: 'string', example: 'SN123456' },
          make: { type: 'string', example: 'Genus' },
          phaseType: { type: 'string', example: '1-Phase' },
          status: { type: 'string', example: 'Installed' },
          dtCode: { type: 'string', example: 'DT-42' },
        },
      },
      ConsumptionReading: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', format: 'date-time' },
          kwh: { type: 'number', nullable: true },
          kvah: { type: 'number', nullable: true },
          voltageR: { type: 'number', nullable: true },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../docs/swagger.js'),
  ],
};

module.exports = swaggerJsdoc(options);

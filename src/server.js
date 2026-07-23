const app = require('./app');
const { port } = require('./config/env');
const logger = require('./config/logger');

const server = app.listen(port, () => {
  logger.info(`Flock Energy API listening on port ${port}`);
  logger.info(`Swagger docs available at http://localhost:${port}/docs`);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { message: error.message, stack: error.stack });
});

module.exports = server;

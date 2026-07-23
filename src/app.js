const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

const logger = require('./config/logger');
const swaggerSpec = require('./config/swagger');
const requestId = require('./middleware/requestId');
const authRoutes = require('./routes/authRoutes');
const meterRoutes = require('./routes/meterRoutes');
const hierarchyRoutes = require('./routes/hierarchyRoutes');
const healthRoutes = require('./routes/healthRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');

// Security & Optimization Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(requestId);

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 429,
      message: 'Too many requests from this IP, please try again after 15 minutes.',
    },
  },
});
app.use(limiter);

// HTTP Logging with Request ID
app.use(
  morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" [reqId: :req[x-request-id]]', {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  })
);

// OpenAPI JSON file export
const openApiPath = path.join(process.cwd(), 'openapi.json');
try {
  fs.writeFileSync(openApiPath, JSON.stringify(swaggerSpec, null, 2));
} catch (err) {
  logger.warn('Could not write openapi.json file', { message: err.message });
}

// Docs & Public Specs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// API Routes
app.use('/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/meters', meterRoutes);
app.use('/api/v1/hierarchy', hierarchyRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;

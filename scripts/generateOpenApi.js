const fs = require('fs');
const path = require('path');
const swaggerSpec = require('../src/config/swagger');

const outputPath = path.join(process.cwd(), 'openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
console.log(`OpenAPI spec written to ${outputPath}`);

# Flock Energy REST API Wrapper

A production-ready, enterprise-grade Node.js & Express.js REST API wrapper for the legacy **Urja Meter Ops Portal**.

This service converts legacy HTML responses or internal portal APIs into clean, normalized JSON REST endpoints, complete with stateful cookie session management, automatic re-authentication, exponential backoff retries, request tracing, security hardening, and OpenAPI (Swagger) documentation.

---

## Features

- **Automated Session Management**: Maintains cookie jars using `tough-cookie` & `axios-cookiejar-support` with automatic re-login on session expiration.
- **Adaptive HTML & JSON Parsing**: Normalizes server-rendered HTML tables using `Cheerio` or extracts JSON API payloads seamlessly.
- **Enterprise Security**: Hardened with `helmet` (HTTP headers), `cors`, `compression`, `express-rate-limit`, and input sanitization (`Joi`).
- **Request Tracing**: Generates and propagates unique UUID `X-Request-Id` headers across log entries and HTTP responses.
- **Fail-Fast Environment Validation**: Validates mandatory environment variables at startup using `Joi`.
- **Winston & Morgan Logging**: Structured logging to console and `logs/app.log` with automatic credential masking.
- **OpenAPI 3.0 & Swagger UI**: Built-in interactive documentation available at `/docs` and raw spec at `/openapi.json`.
- **Container Ready**: Fully containerized with production-ready `Dockerfile` and `docker-compose.yml`.

---

## Architecture Overview

```text
Routes (/api/v1/*)
       │
       ▼
Controllers (Standardized JSON response helpers)
       │
       ▼
Services (Domain logic)
       │
       ▼
UrjaPortalClient (Session management, retries, cookie jar, Cheerio parser)
       │
       ▼
Legacy Urja Meter Ops Portal (https://urja-ops.flockenergy.tech)
```

---

## Folder Structure

```text
flock-energy-api/
├── src/
│   ├── app.js                 # Express application initialization & middleware
│   ├── server.js              # HTTP server entry point & shutdown handlers
│   ├── config/
│   │   ├── env.js             # Environment variable schema validation
│   │   ├── logger.js          # Winston logger configuration
│   │   └── swagger.js         # Swagger OpenAPI specifications
│   ├── client/
│   │   ├── urjaClient.js      # Main Urja portal HTTP client
│   │   ├── auth.js            # Adaptive authentication helper
│   │   ├── parser.js          # JSON and Cheerio HTML parser
│   │   └── sessionManager.js  # Session expiry detection & re-auth logic
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── meterController.js
│   │   └── hierarchyController.js
│   ├── services/
│   │   ├── clientProvider.js
│   │   ├── meterService.js
│   │   └── hierarchyService.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── meterRoutes.js
│   │   ├── hierarchyRoutes.js
│   │   └── healthRoutes.js
│   ├── middleware/
│   │   ├── asyncHandler.js    # Async error wrapper
│   │   ├── errorHandler.js    # Global error handler
│   │   ├── notFound.js        # 404 route handler
│   │   ├── requestId.js       # UUID X-Request-Id tracing
│   │   └── validate.js        # Joi schema validator
│   ├── models/
│   │   └── responseModels.js  # Standard JSON response envelopes & AppError
│   ├── validators/
│   │   └── meterValidator.js  # Request validation schemas
│   └── utils/
│       ├── constants.js       # Status codes & portal path templates
│       ├── formatter.js       # Field normalizers & sanitizers
│       └── retry.js           # Exponential backoff retry helper
├── tests/
│   └── api.test.js            # Jest & Supertest integration tests
├── scripts/
│   └── generateOpenApi.js     # OpenAPI spec generation script
├── logs/                      # Log directory (app.log)
├── .env                       # Local environment configuration
├── .env.example               # Template environment configuration
├── Dockerfile                 # Multi-stage Docker build configuration
├── docker-compose.yml         # Docker Compose setup
├── openapi.json               # Generated OpenAPI 3.0 spec
├── PROTOCOL.md                # Reverse engineering & discovery protocol doc
├── REFLECTION.md              # Engineering design reflection
├── package.json
└── README.md
```

---

## Environment Variables

Copy `.env.example` to `.env` before running the application:

```env
BASE_URL=https://urja-ops.flockenergy.tech
USERNAME=operator@urja.local
PASSWORD=urja-ops-2026
REQUEST_TIMEOUT=30000
LOG_LEVEL=info
PORT=3000
NODE_ENV=development
```

> [!WARNING]
> Never commit credentials to version control.

---

## Quick Start & Local Development

### 1. Installation
```bash
npm install
```

### 2. Run Tests
```bash
npm test
```

### 3. Generate OpenAPI Specification
```bash
npm run generate:openapi
```

### 4. Start Development Server
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

---

## Docker Setup

Run the application inside Docker:

```bash
# Build and run container
docker compose up --build
```

Access Swagger UI at `http://localhost:3000/docs`.

---

## API Endpoints Reference

All API routes (except `/health`, `/docs`, `/openapi.json`) are prefixed with `/api/v1`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Application health, uptime, and metadata |
| `POST` | `/api/v1/auth/login` | Authenticate with legacy Urja portal |
| `GET` | `/api/v1/meters` | Get paginated list of smart meters |
| `GET` | `/api/v1/meters/:id` | Get detailed meter information |
| `GET` | `/api/v1/meters/:id/consumption` | Get meter energy consumption history |
| `GET` | `/api/v1/hierarchy` | Get distribution network hierarchy |

---

## Response Format

### Success Envelope (HTTP 200)
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "meters": [
      {
        "id": "MTR-1001",
        "serialNumber": "SN-98231",
        "make": "Genus",
        "status": "Installed",
        "dtCode": "DT-01"
      }
    ],
    "total": 1,
    "page": 1
  }
}
```

### Error Envelope (HTTP 4xx / 5xx)
```json
{
  "success": false,
  "error": {
    "code": 404,
    "message": "Meter not found"
  }
}
```

---

## Documentation Links

- **Protocol Specification**: See [PROTOCOL.md](file:///c:/Users/pc/OneDrive/Desktop/flock-energy-api/PROTOCOL.md)
- **Engineering Reflection**: See [REFLECTION.md](file:///c:/Users/pc/OneDrive/Desktop/flock-energy-api/REFLECTION.md)
- **Swagger Documentation**: Accessible at `http://localhost:3000/docs`

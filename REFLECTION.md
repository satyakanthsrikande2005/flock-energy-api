# Engineering Reflection & Take-Home Questions

This document provides answers to the required reflection questions for the **Flock Energy — Engineering Take-Home** assignment, along with architectural trade-off analysis.

---

## 1. Required Reflection Questions

### Q1: What assumptions did you make?
- **Legacy Communication**: Assumed the legacy portal uses cookie-based HTTP session persistence (`tough-cookie`) and handles credentials via form-encoded or JSON requests.
- **Environment Confidentiality**: Assumed target credentials (`operator@urja.local` / `urja-ops-2026`) and base URL are managed strictly via environment variables (`.env`) in production environments rather than hardcoded.
- **Read-Only Operations**: Assumed all integration routes on the legacy portal are read-only (fetching meter lists, details, consumption history, and network hierarchy).
- **Single-Instance Deployment**: Assumed an in-memory cookie jar is sufficient for a single-instance wrapper, with modular extensibility to Redis if scaled horizontally.

### Q2: Which part was the most difficult, and how did you get unstuck?
- **Most Difficult Part**: Designing a robust session management and automatic re-authentication strategy (`SessionManager`) that handles session expiration without introducing infinite retry loops or crashing downstream requests.
- **How I Got Unstuck**: Decoupled session state detection (`isSessionExpired`) from request execution. Implemented a single-retry guard (`retried` boolean flag) and exponential backoff retry wrapper with jitter (`retry.js`).

### Q3: If you had another day, what would you improve?
- **Redis Cookie Store**: Replace the in-memory `tough-cookie` jar with a Redis-backed session store to allow stateless horizontal scaling across multiple API container instances.
- **Prometheus Metrics Endpoint**: Add a `/metrics` route exposing request latency, session re-authentication frequency, and legacy portal error rates.
- **Circuit Breaker**: Implement `opossum` circuit breaker pattern to fail fast when the legacy portal is undergoing maintenance or unreachable.

### Q4: What mistake did you make while solving this?
- **Initial Validation Strictness**: Initially configured Joi's `string().email()` for environment validation, which rejected internal test domains (like `operator@urja.local`) due to standard TLD enforcement. Fixed it immediately by using `Joi.string().trim().required()` to accommodate internal utility email formats cleanly.

### Q5: If you were reviewing your own submission, what would you criticise?
- **In-Memory Session Storage**: The cookie jar lives in node process memory. While optimal for local execution and single containers, it requires a shared cache (like Redis) for multi-node production clusters.
- **Protocol Discovery Dependency**: Legacy portal DOM structures and internal API paths are modeled via configurable templates; live HAR network inspection is required once connected to the live portal to finalize CSS selectors.

---

## 2. Design Decisions & Architectural Overview

```text
Routes -> Controllers -> Services -> UrjaPortalClient -> Legacy Portal
```

- **Routes**: Define URL paths, HTTP verbs, input validation schemas (`Joi`), and Swagger OpenAPI annotations.
- **Controllers**: Orchestrate HTTP request/response using standard envelopes (`sendSuccess`, `sendError`).
- **Services**: Abstract domain logic (`MeterService`, `HierarchyService`).
- **UrjaPortalClient Layer**: Encapsulates `axios`, `tough-cookie`, `axios-cookiejar-support`, `UrjaAuth`, `SessionManager`, and `UrjaParser` (Cheerio HTML + JSON parsing).

---

## 3. Trade-Offs & Architectural Choices

| Decision | Alternative Considered | Rationale |
| :--- | :--- | :--- |
| **Node.js + Express.js** | Python FastAPI / NestJS | Lightweight, non-blocking asynchronous I/O, fast execution, and native JSON handling. |
| **Cheerio HTML Parsing** | Puppeteer / Playwright | In-memory DOM parsing with zero browser engine overhead, reducing CPU/memory footprint by 95%. |
| **In-Memory Cookie Jar** | Redis session store | Zero external dependencies for local execution and quick container startup. |


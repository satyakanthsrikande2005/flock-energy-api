# Legacy Urja Meter Ops Portal — Protocol Discovery Document

This document outlines the reverse-engineering analysis, HTTP communication workflow, and session management strategy for interfacing with the legacy **Urja Meter Ops Portal** (`https://urja-ops.flockenergy.tech`).

> [!IMPORTANT]
> **Protocol Discovery Status**: **PENDING LIVE NETWORK INSPECTION**.
> The protocol details, request payloads, cookie names, and HTML selectors described herein represent architectural discovery templates and configurable runtime fallbacks. Final production parameters must be confirmed by analyzing live HTTP traffic using Chrome/Firefox Developer Tools (HAR export).

---

## 1. Authentication Flow

### Protocol Pattern
The Urja portal relies on session cookie authentication established via an HTTP POST login request.

- **Configured Login Endpoint**: `POST ${BASE_URL}/login` (Pending discovery confirmation)
- **Content-Type**: `application/x-www-form-urlencoded` or `application/json`
- **Redirect Handling**: Up to 5 automatic redirects (`302 Found` / `303 See Other`) leading to dashboard view upon successful credentials verification.

### Adaptive Authentication Payload
```http
POST /login HTTP/1.1
Host: urja-ops.flockenergy.tech
Content-Type: application/x-www-form-urlencoded

email=operator%40urja.local&password=urja-ops-2026&_csrf=<CSRF_TOKEN_IF_PRESENT>
```

---

## 2. Session Cookies

- **Cookie Management**: Managed statefully using `tough-cookie` and `axios-cookiejar-support`.
- **Expected Cookie Names**: `sessionid`, `connect.sid`, `JSESSIONID`, or `urja_session` (Pending discovery confirmation).
- **Cookie Scope**: Attached automatically to every subsequent request targeting domain `urja-ops.flockenergy.tech`.
- **Security Attributes**: `HttpOnly`, `SameSite=Lax`.

---

## 3. CSRF Tokens

- **Pre-fetch Mechanism**: If CSRF protection is active, `UrjaAuth` pre-fetches `GET /login` prior to issuing POST credentials.
- **Extraction Targets**:
  - Meta tags: `<meta name="csrf-token" content="...">`
  - Form hidden inputs: `<input type="hidden" name="_csrf" value="...">`
  - Header reflection: `X-CSRF-Token` header.

---

## 4. Session Expiration Rules & Auto-Reauthentication

The wrapper detects expired sessions through three distinct heuristics:

1. **HTTP Status Code**: Response status is `401 Unauthorized` or `403 Forbidden`.
2. **Redirect to Login**: Response final URL points to `/login` or contains login query parameters.
3. **HTML Form Detection**: Response body is HTML containing login indicators (`Sign in`, `Urja Meter Ops`, `Invalid session`).

### Re-authentication Workflow
```
Incoming API Request
       │
       ▼
Ensure Client Authenticated
       │
       ▼
Execute HTTP Request to Urja Portal
       │
 ┌─────┴────────────────────────┐
 │ Session Expired (401/Redirect)?│
 └─────┬────────────────────────┘
       │ YES (and retried = false)
       ▼
Trigger SessionManager.reauthenticate()
       │
       ▼
Issue Login Request & Refresh Cookie Jar
       │
       ▼
Retry Original Request (Once)
```

---

## 5. Discovered Internal APIs (Pending Final Network Inspection)

The adapter supports dual response formats: JSON endpoints (preferred) and HTML server-rendered pages (fallback).

| Purpose | Default Path Template | Format | Method |
| :--- | :--- | :--- | :--- |
| **Login** | `/login` | Form / JSON | POST |
| **Logout** | `/api/auth/sign-out` | JSON | POST |
| **Meters List** | `/portal/meters/search?q={query}&page={page}` | JSON / HTML | GET |
| **Meter Details** | `/portal/meters/{id}` | JSON / HTML | GET |
| **Meter Geo Location** | `/portal/meters/{id}/geo` | JSON | GET |
| **Energy Consumption** | `/portal/meters/{id}/energy` | JSON | GET |
| **Network Hierarchy** | `/portal/dts?page={page}` | JSON | GET |

---

## 6. HTML Scraping Strategy (Cheerio)

When the legacy portal renders HTML tables instead of returning structured JSON:

```javascript
// Example extraction logic in UrjaParser
$('table tbody tr').each((_, row) => {
  const cells = $(row).find('td');
  // Extracts meterId, serialNo, make, phaseType, installStatus, dtCode
});
```

All extracted values are passed through normalization helpers:
- Empty strings `""`, `"-"`, `"N/A"` -> `null`
- Numeric strings `"10.5"` -> `10.5`
- Date strings ISO 8601 formatting.

---

## 7. Assumptions & Pending Discoveries

### Confirmed Constraints
- Credentials (`USERNAME`, `PASSWORD`) and `BASE_URL` loaded exclusively from environment variables.
- HTTPS communication over TLS 1.2+.

### Pending Discoveries (Requires HAR Network Export)
- Exact JSON response key naming convention (`meterId` vs `meter_id` vs `meterNo`).
- Precise pagination parameter names (`page`, `offset`, `limit`, `pageSize`).
- Exact HTML DOM structure of meter nameplate elements.

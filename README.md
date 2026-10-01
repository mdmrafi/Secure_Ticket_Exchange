# SafePass: Secure Digital Asset & Ticket Exchange Platform

A production-oriented secure digital asset exchange platform architected to eliminate fraud, counterfeit documents, and black-market scalping.

The initial use-case is **safeguarding secondary railway ticket transfers** (preventing fake PDF alterations, double-listing of PNRs, and above-cap scalping), with a domain and database architecture engineered from day one to support:

- **Intercity Bus Tickets**
- **Live Event & Concert Passes**
- **Transferable Legal Documents & Digital Rights**
- **Other Legally Transferable Digital Assets**

---

## 🏗️ System Architecture Overview

```
                                  +---------------------------+
                                  |    React + Vite Client    |
                                  |  Tailwind CSS + Router    |
                                  +-------------+-------------+
                                                |
                                        HTTP / REST & WebSocket
                                                |
                                                v
                              +-----------------------------------+
                              |       Node.js Express Server      |
                              |   Security Middleware Pipeline    |
                              |   (Helmet, CORS, Rate Limiter,    |
                              |    HPP, Zod Validation, Pino)     |
                              +-----------------+-----------------+
                                                |
                                      +---------+---------+
                                      |                   |
                        +-------------v-----------+  +----v--------------------+
                        |   API v1 Module Layer   |  |   Real-Time & Jobs      |
                        |   - /auth               |  |   - Socket.IO Server    |
                        |   - /users              |  |   - Inngest Pipeline    |
                        |   - /assets             |  +-------------------------+
                        |   - /listings           |
                        |   - /transactions       |
                        |   - /verification       |
                        |   - /notifications      |
                        |   - /reports            |
                        |   - /admin              |
                        |   - /health             |
                        +-------------+-----------+
                                      |
                     [Controller -> Service -> Repository]
                                      |
                        +-------------v-----------+
                        |    Mongoose ODM Layer   |
                        +-------------+-----------+
                                      |
                        +-------------v-----------+
                        |         MongoDB         |
                        +-------------------------+
```

### Key Architectural Pillars

1. **Separation of Concerns (Controller-Service-Repository)**:
   - **Controllers**: Handle HTTP transport, status codes, input unpacking, and call services via `asyncHandler`.
   - **Services**: Encapsulate domain rules, business orchestration, status transitions, and job triggers.
   - **Repositories**: Abstract Mongoose data queries, pagination, and database interactions.

2. **Extensible Asset Design**:
   - `Asset` schema includes `assetType` (`RAILWAY_TICKET`, `BUS_TICKET`, `EVENT_TICKET`, `DOCUMENT`, `OTHER`), compound unique index on `(assetType, uniqueAssetIdentifier)` to block duplicate listings, and flexible typed metadata.

3. **Pluggable Identity & Auth Abstraction**:
   - `AuthProviderInterface` defines the token verification contract.
   - Initial implementation: `JwtAuthProvider` (native JWT).
   - Future provider: `ClerkAuthProvider` (ready to activate with Clerk SDK via `AUTH_PROVIDER=clerk`).

4. **Centralized Error & Response Formatting**:
   - All responses conform to standard JSON envelope: `{ success, statusCode, message, data, timestamp }`.
   - Centralized `errorHandler` catches custom `AppError`, Mongoose validation/cast/duplicate key errors, and JWT issues.

5. **Security Middleware**:
   - `helmet`: Sets HTTP security headers.
   - `cors`: Configurable allowed origins, headers, and credentials.
   - `express-rate-limit`: Global API limit (100 req/15min) and strict auth limit (20 req/15min).
   - `hpp`: HTTP Parameter Pollution protection.
   - `zod`: Request body, query, and parameter schema enforcement.

6. **Real-Time & Async Jobs**:
   - **Socket.IO**: Real-time event rooms (`user:<id>`, `tx:<transactionId>`) for instant notifications and escrow alerts.
   - **Inngest**: Background workflow framework for asynchronous verification (PDF parsing, OCR, fraud heuristics).

---

## 📁 Repository Structure

```
Secure_Ticket_Exchange/
├── backend/
│   ├── scripts/
│   │   └── test-db-connection.js       # Standalone DB connection test utility
│   ├── src/
│   │   ├── common/
│   │   │   ├── constants/              # AssetTypes, Statuses, HttpStatus codes
│   │   │   ├── errors/                 # AppError, NotFoundError, ValidationError, etc.
│   │   │   ├── middlewares/            # Error, Not-Found, Rate-Limiter, Security, Zod
│   │   │   └── utils/                  # ApiResponse, asyncHandler
│   │   ├── config/
│   │   │   ├── env.config.js           # Zod-validated environment config
│   │   │   ├── db.config.js            # Resilient Mongoose connection layer
│   │   │   ├── cors.config.js          # CORS policy
│   │   │   ├── logger.config.js        # Pino structured logger
│   │   │   └── inngest.config.js       # Inngest client
│   │   ├── loaders/
│   │   │   ├── app.js                  # Express middleware pipeline & routes
│   │   │   └── socket.js               # Socket.IO loader & room handlers
│   │   ├── jobs/                       # Background functions & Inngest handlers
│   │   ├── modules/
│   │   │   ├── auth/                   # Pluggable Auth (JWT / Clerk adapter)
│   │   │   ├── users/                  # User profiles, roles, and trust scoring
│   │   │   ├── assets/                 # Multi-asset models & registry
│   │   │   ├── listings/               # Resale listings with face-value caps
│   │   │   ├── transactions/           # Escrow state machine & transfers
│   │   │   ├── verification/           # Fraud checks & background pipelines
│   │   │   ├── notifications/          # Socket.IO & in-app alerts
│   │   │   ├── reports/                # Disputes & fraud reporting
│   │   │   └── admin/                  # Platform metrics & audit governance
│   │   ├── routes/
│   │   │   ├── index.js                # API v1 master router
│   │   │   └── health.routes.js        # /api/v1/health endpoint
│   │   └── server.js                   # Server boot, Socket.IO & graceful shutdown
│   ├── .env.example
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                 # StatusBadge, HealthIndicator widget
│   │   │   └── layout/                 # Navbar, Footer, AppLayout
│   │   ├── config/                     # API & Socket endpoints
│   │   ├── context/                    # AuthContext, SocketContext
│   │   ├── pages/                      # HomePage, Listings, Verify, Escrow, Admin
│   │   ├── routes/                     # AppRoutes (React Router DOM)
│   │   ├── services/                   # apiClient, apiService, socketService
│   │   ├── App.jsx
│   │   ├── index.css                   # Tailwind CSS v4 & glassmorphism tokens
│   │   └── main.jsx
│   ├── .env.example
│   ├── .env
│   ├── vite.config.js
│   └── package.json
│
├── package.json                        # Root workspace scripts
└── README.md
```

---

## 🚀 Exact Commands to Run

### Prerequisites

- Node.js `v18+` (Tested on `v24.15.0`)
- npm `v9+` (Tested on `v12.0.1`)
- MongoDB (Local service, Docker container, or MongoDB Atlas connection URI)

### 1. Backend

Navigate to `backend/` and start the server:

```bash
cd backend

# Option A: Development mode with auto-reload (nodemon)
npm run dev

# Option B: Standard production startup
npm start
```

_The backend runs at `http://localhost:5000`._
_The API is mounted at `http://localhost:5000/api/v1`._

---

### 2. Frontend

Navigate to `frontend/` and start the Vite development server:

```bash
cd frontend

# Start the dev server
npm run dev
```

_The frontend opens at `http://localhost:5173`._

---

## 🩺 API Health-Check Test

The health check endpoint inspects server uptime, memory usage, API version, and live MongoDB connection state.

### Run in PowerShell:

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/v1/health -Method GET
```

### Or using curl:

```bash
curl -s http://localhost:5000/api/v1/health
```

### Expected JSON Response (when database is online):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Health check completed",
  "data": {
    "status": "healthy",
    "service": "secure-asset-exchange-api",
    "version": "1.0.0",
    "environment": "development",
    "uptimeSeconds": 45,
    "timestamp": "2026-10-01T03:15:00.000Z",
    "database": {
      "status": "connected",
      "connected": true,
      "host": "127.0.0.1",
      "database": "secure_asset_exchange"
    },
    "system": {
      "memoryUsedMB": 36,
      "memoryTotalMB": 58,
      "nodeVersion": "v24.15.0",
      "pid": 12345
    }
  },
  "timestamp": "2026-10-01T03:15:00.000Z"
}
```

_(Note: If MongoDB is offline, the API remains responsive and returns `statusCode: 503` with `"status": "degraded"` so health monitors can detect DB issues without crashing the HTTP server.)_

---

## 🗄️ MongoDB Connection Test

A standalone CLI diagnostic tool is provided to test database connectivity independently of the web server.

### Run the test script:

```bash
cd backend
npm run test:db
```

### If MongoDB is running:

```
============================================================
  MONGODB CONNECTION TEST UTILITY
============================================================
Connecting to: mongodb://127.0.0.1:27017/secure_asset_exchange

[SUCCESS] Connected to MongoDB successfully!
- Host: 127.0.0.1
- Port: 27017
- Database Name: secure_asset_exchange
- Connection State: READY (1)
- Ping Latency: 12ms
- Ping Response: { ok: 1 }

Database connection layer is functioning as expected.
```

### If MongoDB is not yet running:

The script outputs troubleshooting steps for starting local MongoDB (`net start MongoDB` or Docker) or pointing to MongoDB Atlas by editing `MONGODB_URI` in `backend/.env`.

---

## 🐳 Production Deployment & Docker Setup

The platform is fully containerized and production-ready with separate orchestration profiles, Nginx reverse proxy, automated health/readiness checks, structured JSON logging, and Prometheus monitoring.

For complete architectural diagrams, operational runbooks, and zero-downtime rolling update instructions, see **[DEPLOYMENT.md](file:///d:/Projects/Secure_Ticket_Exchange/DEPLOYMENT.md)**.

### Environment Matrix & Secret Isolation

Three environments are strictly maintained with zero-secrets committed to Git:

- **`development`**: Local development (`.env.development.example`)
- **`staging`**: Staging cluster with memory/CPU limits (`.env.staging.example` -> `.env.staging`)
- **`production`**: Production cluster with HSTS, strict CORS, and hardened pooling (`.env.production.example` -> `.env.production`)

```bash
# Setup environment from template
cp .env.production.example .env.production
cp frontend/.env.production.example frontend/.env.production
```

### Running with Docker Compose

```bash
# Development (Local Containers)
docker compose up -d --build

# Staging Environment
docker compose -f docker-compose.staging.yml up -d --build

# Production Cluster (High Availability & TLS Reverse Proxy)
docker compose -f docker-compose.prod.yml up -d --build
```

### Health, Readiness & Monitoring Endpoints

| Probe                    | Endpoint                     | Target Audience                         |
| :----------------------- | :--------------------------- | :-------------------------------------- |
| **Comprehensive Health** | `GET /api/v1/health`         | Diagnostic Dashboards & Ops Teams       |
| **Liveness Probe**       | `GET /api/v1/health/live`    | Docker / Kubernetes restart controller  |
| **Readiness Probe**      | `GET /api/v1/health/ready`   | Ingress / Load Balancer traffic routing |
| **Prometheus Metrics**   | `GET /api/v1/health/metrics` | Prometheus / Grafana scrapers           |

### Quality & Testing Commands

```bash
# Run all automated test suites
npm run test:all

# Run individual security & domain suites
npm run test:security      # 38 penetration attack simulations
npm run test:payment       # 58 zero-trust payment verification tests
npm run test:admin         # 75 administrative moderation & RBAC tests
npm run test:jobs          # 47 Inngest idempotent background jobs tests

# Code quality & vulnerability audit
npm run lint               # Oxlint across backend & frontend
npm run format:check       # Prettier code style verification
npm run audit              # Zero-vulnerability dependency audit
npm run build              # Backend syntax check & frontend SPA bundle
```

---

## ✅ Manual Verification Checklist

Follow this checklist to verify the architectural setup:

- [ ] **1. Directory Structure**:
  - Verify `backend/` and `frontend/` are isolated and have separate `package.json` and `.env` files.
- [ ] **2. Backend Modules**:
  - Verify all 9 modules exist in `backend/src/modules/`: `auth`, `users`, `assets`, `listings`, `transactions`, `verification`, `notifications`, `reports`, `admin`.
- [ ] **3. Controller-Service-Repository Pattern**:
  - Check that each module has separated files for controller, service, repository, model, and routes.
- [ ] **4. Centralized Error Handling**:
  - Send a request to an unknown route (e.g., `curl http://localhost:5000/api/v1/invalid`) and verify it returns `{ success: false, statusCode: 404, message: ... }`.
- [ ] **5. Request Validation**:
  - Send an invalid POST request (e.g., `curl -X POST http://localhost:5000/api/v1/auth/register -H "Content-Type: application/json" -d "{}"`) and verify that Zod returns `{ success: false, statusCode: 422, errors: [...] }`.
- [ ] **6. Security & Rate Limiting**:
  - Verify Helmet security headers are present in response headers (`curl -I http://localhost:5000/api/v1/health`).
- [ ] **7. Pluggable Auth Architecture**:
  - Check `backend/src/modules/auth/providers/`: Verify `AuthProviderInterface`, `JwtAuthProvider`, and `ClerkAuthProvider` adapter are present.
- [ ] **8. Frontend Diagnostics Widget**:
  - Start frontend (`cd frontend && npm run dev`) and open `http://localhost:5173`.
  - In the top-right navbar, click the live **API: Online / Degraded** pill to inspect the health metrics dialog.
- [ ] **9. Real-Time & Background Frameworks**:
  - Confirm Socket.IO loader initialized in `backend/src/loaders/socket.js`.
  - Confirm Inngest endpoint accessible at `http://localhost:5000/api/inngest`.

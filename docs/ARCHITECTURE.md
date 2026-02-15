# VIPEX Backend Architecture

## Overview
The backend is a modular monolith built on Bun + Elysia + Drizzle + PostgreSQL.
Modules are isolated by feature folders and share infrastructure plugins for auth, error handling, logging, rate limiting, and observability.

## Runtime Components
```mermaid
flowchart LR
  Client["Web / Mobile Client"] --> API["Elysia API /v1"]
  API --> Auth["Auth + RBAC"]
  API --> Shipments["Shipments/Consignments/Deliveries"]
  API --> Finance["Payments + Accounting"]
  API --> Ops["Shifts + Inventory + Reporting"]
  API --> Geo["Geolocation (PostGIS)"]
  API --> Audit["Audit Logging"]
  API --> Rate["Rate Limiter"]
  Rate --> Cache["Redis Cache (or in-memory fallback)"]
  Shipments --> PG["PostgreSQL"]
  Finance --> PG
  Ops --> PG
  Geo --> PG
  Audit --> PG
```

## Request Lifecycle
```mermaid
sequenceDiagram
  participant C as Client
  participant A as Elysia App
  participant R as RateLimit
  participant H as Handler
  participant DB as PostgreSQL
  C->>A: HTTP request
  A->>R: Check quota (Redis/Memory)
  R-->>A: Allow or 429
  A->>H: Route controller/service
  H->>DB: SQL transaction/query
  DB-->>H: Result/Error
  H-->>A: Response / throw
  A-->>C: Normalized success/error payload
```

## Design Rules
- Use `HttpStatus` constants (no hardcoded numbers).
- Use shared ID schema in `/src/server/schemas/common.ts` for all ID validation.
- Return normalized errors through `/src/server/middlewares/error-handler.ts`.
- Keep business logic in services, not in route definitions.

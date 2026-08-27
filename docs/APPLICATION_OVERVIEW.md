# Vipex Application Overview

Last audited: 2026-08-27

## Product Scope

Vipex is a multi-client parcel operations and ERP platform. It combines parcel booking and movement, cashier collections, last-mile delivery, customer management, accounting, HR/payroll, procurement, inventory, fleet operations, reporting, communication, support, and AI-assisted management views.

The system is company-scoped. Most operational records are additionally branch-scoped and some are location-scoped. Role permissions determine what a user can see or change, while company modules determine whether optional product areas are enabled.

## Runtime Applications

| Application     | Location                      | Purpose                                                                                     |
| --------------- | ----------------------------- | ------------------------------------------------------------------------------------------- |
| Web             | `apps/web` and shared `src/`  | Main browser ERP and operational interface                                                  |
| API             | `src/server`                  | Bun/Elysia modular API mounted under `/v1`                                                  |
| Desktop         | `apps/desktop`                | Electron shell, native printing, printer routing, and application updates                   |
| Mobile          | `apps/mobile`                 | React Native operations for cashiers, riders, receiving, communication, search, and reports |
| Shared packages | `packages/lib`, `packages/ui` | Cross-workspace utilities and UI building blocks                                            |

Production serving uses one Bun server for the API, WebSocket communication, and built SPA assets. PostgreSQL is the primary database; Redis is optional for caching and rate limiting; MinIO/S3-compatible storage holds uploads and application packages.

## Major Business Areas

### Parcel operations

- create multi-parcel bookings
- collect sender, receiver, and delivery payments
- print parcel stickers and A5 documents
- create and receive consignments
- record incoming discrepancies
- manage call outcomes and address collection
- manage pickup queues and OTP-controlled handovers
- dispatch to riders and complete doorstep deliveries
- transfer custody between branch, location, and warehouse holders
- correct approved operational/payment discrepancies through reconciliation

### Finance

- cashier sessions and daily cashier sales
- payment method and payer-specific collection rules
- daily cash and expense approval workflows
- journals, tax configuration, and financial statements
- customer credit/wallet controls
- operational and bank reconciliation

### Enterprise operations

- customers and CRM
- HR, attendance, leave, compensation, and payroll
- procurement from demand through goods receipt
- inventory, lots, reservations, transfers, counts, and replenishment
- fleet vehicles, trips, dispatch, fuel, compliance, maintenance, and analytics

### Platform services

- user, role, and permission administration
- company module gating
- audit logs and reports
- notification providers, templates, campaigns, and delivery logs
- internal communication, calls, and presence
- IT support and customer-service records
- in-app help, AI chat, executive insights, and management briefs

## Identity and Access Model

Users have a company, role, branch, optional location, and a user type (`STAFF`, `CASHIER`, or `RIDER`). Cashiers additionally have a cashier type. Roles own permission keys. Permissions are checked on both UI routes and backend endpoints.

Important distinctions:

- role name is not the same as user type
- report access is not automatically accounting access
- company module enablement is not a substitute for permission checks
- head-office scope and branch scope are enforced separately
- refresh tokens contain permission snapshots, so access changes may require token/session renewal

See [Platform and access control](PLATFORM_AND_ACCESS.md).

## Core Data Boundaries

- `companies` own tenant data
- `branches` and `locations` define operational scope
- `users`, `roles`, and `role_permissions` define identity and authorization
- `bookings` group one or more `parcels`
- `payments` record payer, component, method, cashier type, branch, session, and amounts
- `cashier_sessions` provide controlled collection windows
- consignments and deliveries track movement without replacing the parcel record
- operational events feed reporting and, where approved, accounting journals

Database schemas are split by domain under `src/db/schemas`. Changes are applied only through committed migrations under `drizzle`; unsafe schema push is intentionally disabled.

## Cross-Cutting Services

- authentication with access and rotating refresh tokens
- permission and company-module middleware
- normalized errors and request IDs
- audit trail middleware and entity history
- rate limiting with Redis/memory fallback
- Swagger/OpenAPI at `/docs`
- Sentry and Discord observability hooks
- uploads through MinIO/S3-compatible storage
- WebSocket-based internal communication and rider assignment events
- multi-provider LLM routing with per-feature rate limits

## Documentation Sources of Truth

- Current product behavior: module documents linked from [Documentation Hub](README.md)
- API route composition: `src/server/app.ts`
- UI navigation: `src/components/sidebar/navigation.tsx`
- permissions and path access: `src/shared/permissions`
- company module catalog: `src/shared/company-modules`
- schemas: `src/db/schemas`
- historical changes: Git history and dated implementation logs

When documentation and implementation disagree, the mismatch must be recorded and resolved; historical notes must not be treated as current behavior automatically.

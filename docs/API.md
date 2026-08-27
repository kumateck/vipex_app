# API Documentation Index

Base URL: `/v1`

Last audited at the mounted route-group level: 2026-08-27.

The API reference is split by domain:

- [Identity and parcel operations](api/IDENTITY_AND_OPERATIONS.md)
- [Enterprise modules](api/ENTERPRISE_MODULES.md)
- [Platform, communication, and intelligence](api/PLATFORM_AND_INTELLIGENCE.md)
- [Reporting](api/REPORTING.md)

## Current Mounted Roots

`auth`, `users`, `branches`, `locations`, `warehouses`, `customers`, `cards`, `uploads`, `cashiers`, `shipments`, `payments`, `deliveries`, `pickup-queues`, `accounting`, `inventory`, `shifts`, `company-modules`, `module-workspace`, `procurement`, `fleet-transport`, `customer-wallet-credit`, `reconciliation`, `notification-hub`, `momo`, `self-service`, `desktop-updates`, `mobile-updates`, `communication`, `customer-service`, `help-assistant`, `executive-insights`, `fleet-anomaly-brief`, `operations-exceptions-brief`, `management-daily-brief`, `ai-chat`, `it-support`, `reports`, `audit`, `hr`, `payroll`, `rbac`, and `geolocation`.

## Contract Authority

Swagger UI at `/docs` and OpenAPI JSON at `/docs/json` from the running server are authoritative for exact methods, schemas, validation, and response bodies. These documents explain the stable domain surface and access rules.

Every protected endpoint must enforce authentication, permission, company-module availability where applicable, company scope, branch/location scope, and any required operational assignment. Hiding a client route is not sufficient authorization.

## Shared Conventions

- JSON is used for ordinary request and response bodies.
- Upload endpoints use multipart data and store objects through the configured S3/MinIO service.
- Errors use the shared server error model and request ID.
- Dates and money must follow the endpoint schema; clients must not infer business totals.
- Retried mutations must use the domain's duplicate-protection or idempotency behavior.
- Public self-service and application-update endpoints expose only their explicitly documented limited surface.

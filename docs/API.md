# API Documentation Index

Base URL: `/v1`

## Core
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

## Master Data
- `/users`
- `/branches`
- `/locations`
- `/statuses`
- `/customers`

## Operations
- `/shipments/bookings`
- `/shipments/parcels`
- `/shipments/consignments`
- `/deliveries`
- `/cashiers`
- `/shifts`

## Finance
- `/payments`
- `/accounting`
- `/payroll`

## Inventory
- `/inventory/categories`
- `/inventory/products`
- `/inventory/locations`
- `/inventory/stock-levels`
- `/inventory/stock-movements`
- `/inventory/stock-adjustments`
- `/inventory/stock-transfers`

## Governance
- `/audit`
- `/rbac`
- `/reports`

## Geolocation (PostGIS)
- `GET /geolocation/distance`
- `GET /geolocation/branches/nearby`

## Interactive docs
- Swagger UI: `/docs`
- OpenAPI JSON: `/docs/json`

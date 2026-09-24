# Route Permission Matrix

Last generated: 2026-09-23

Source of truth: `src/shared/permissions/constants.ts` (`RoutePermissionOverrides`).

The matrix is split by domain so each reference remains readable:

- [Operations and people](permissions/ROUTE_PERMISSION_OPERATIONS.md)
- [Platform and finance](permissions/ROUTE_PERMISSION_PLATFORM_FINANCE.md)
- [Supply chain and fleet](permissions/ROUTE_PERMISSION_SUPPLY_FLEET.md)
- [Reports](permissions/ROUTE_PERMISSION_REPORTS.md)

Each listed route is guarded by its exact override permission. Routes without an exact override use the application's shared path-access resolution and server endpoint authorization. Navigation visibility is not authorization: the server must still enforce permission, module, company, branch, and domain-assignment rules.

Mobile routes use the same exact permission constants but have their own native route names and UI guards. The current mapping for self-service completion, call-center follow-up, receiving discrepancies, delivery-change review, and customer lookup is maintained in [Mobile Frontline Workflows](MOBILE_FRONTLINE_WORKFLOWS.md). Server authorization remains authoritative for every mobile request.

When `RoutePermissionOverrides` changes, regenerate every table and update the generation date in the same change.

# Inventory API Examples

This document provides concrete request/response examples for the current inventory module.

Base route prefix used below: `/inventory`

## 1) Dashboard: Location-Scoped Summary

### Request

```http
GET /inventory/dashboard/location-summary?companyId=cmp_01&locationId=loc_main_store_01&lowStockLimit=15
```

### Response (200)

```json
{
  "totals": {
    "totalLocations": 7,
    "totalSkus": 143,
    "totalQuantity": "92830",
    "lowStockCount": 18,
    "outOfStockCount": 6,
    "openMaintenanceQty": "42",
    "missingQty": "9"
  },
  "lowStockItems": [
    {
      "productId": "prd_001",
      "productName": "HP Toner 85A",
      "productSku": "TON-85A",
      "minStockLevel": "120",
      "isRecoverable": false,
      "quantity": "48"
    }
  ],
  "openMaintenanceItems": [
    {
      "id": "smr_001",
      "productId": "prd_777",
      "productName": "Desktop Computer",
      "locationId": "loc_it_01",
      "locationName": "IT Office",
      "issueType": 0,
      "quantity": "5",
      "quantityReturned": "2",
      "quantityDisposed": "1",
      "createdAt": "2026-04-08T10:10:00.000Z"
    }
  ],
  "scopeLocationIds": ["loc_main_store_01", "loc_branch_store_02", "loc_consumption_17"]
}
```

## 2) Products: Recoverable Configuration

## Create Product

### Request

```http
POST /inventory/products
Content-Type: application/json
```

```json
{
  "companyId": "cmp_01",
  "categoryId": "cat_01",
  "sku": "COMP-001",
  "name": "Desktop Computer",
  "description": "Office workstation",
  "unitOfMeasure": 0,
  "isRecoverable": true,
  "unitConversions": [
    { "unitOfMeasure": 6, "factorToBase": "10" },
    { "unitOfMeasure": 1, "factorToBase": "100" }
  ],
  "minStockLevel": "20",
  "createdBy": "usr_mgr_01"
}
```

### Response (201)

```json
{ "id": "prd_001" }
```

## Update Product

### Request

```http
PATCH /inventory/products/prd_001
Content-Type: application/json
```

```json
{
  "name": "Desktop Computer v2",
  "isRecoverable": true,
  "unitOfMeasure": 0,
  "unitConversions": [
    { "unitOfMeasure": 6, "factorToBase": "10" },
    { "unitOfMeasure": 1, "factorToBase": "100" }
  ],
  "minStockLevel": "25"
}
```

### Response (200)

```json
{ "id": "prd_001" }
```

## 3) Stock Requests

## Create Request (submit immediately)

### Request

```http
POST /inventory/stock-requests
Content-Type: application/json
```

```json
{
  "companyId": "cmp_01",
  "requesterLocationId": "loc_consumption_01",
  "requestedToLocationId": "loc_branch_store_01",
  "notes": "Weekly replenishment",
  "requestedBy": "usr_loc_mgr_01",
  "submit": true,
  "lines": [
    {
      "productId": "prd_010",
      "requestedQuantity": "240",
      "notes": "Urgent"
    },
    {
      "productId": "prd_011",
      "requestedQuantity": "120"
    }
  ]
}
```

### Response (201)

```json
{ "id": "sr_001" }
```

## Approve Request

### Request

```http
POST /inventory/stock-requests/sr_001/approve
Content-Type: application/json
```

```json
{ "approvedBy": "usr_store_mgr_01" }
```

### Response (200)

```json
{ "id": "sr_001" }
```

## Manual Fulfill a Line

### Request

```http
POST /inventory/stock-requests/sr_001/fulfill
Content-Type: application/json
```

```json
{
  "lineId": "srl_001",
  "fromLocationId": "loc_main_store_01",
  "fulfillQuantity": "100",
  "fulfilledBy": "usr_store_mgr_01",
  "notes": "Partial due to stock constraints"
}
```

### Response (200)

```json
{ "id": "sr_001" }
```

## Allocation Suggestion for a Line

### Request

```http
GET /inventory/stock-requests/sr_001/allocation?lineId=srl_001
```

### Response (200)

```json
{
  "requestId": "sr_001",
  "lineId": "srl_001",
  "productId": "prd_010",
  "requestedQuantity": 240,
  "fulfilledQuantity": 100,
  "remainingQuantity": 140,
  "candidates": [
    {
      "locationId": "loc_branch_store_01",
      "availableQuantity": 60,
      "locationType": 1,
      "parentLocationId": "loc_main_store_01"
    },
    {
      "locationId": "loc_main_store_01",
      "availableQuantity": 50,
      "locationType": 0,
      "parentLocationId": null
    },
    {
      "locationId": "loc_branch_store_02",
      "availableQuantity": 30,
      "locationType": 1,
      "parentLocationId": "loc_main_store_01"
    }
  ]
}
```

## Auto Fulfill a Line (multi-source partial)

### Request

```http
POST /inventory/stock-requests/sr_001/auto-fulfill
Content-Type: application/json
```

```json
{
  "lineId": "srl_001",
  "fulfilledBy": "usr_store_mgr_01",
  "notes": "Auto allocation run"
}
```

### Response (200)

```json
{
  "id": "sr_001",
  "fulfilledQuantity": 140,
  "remainingQuantity": 0
}
```

## 4) Stock Maintenance Lifecycle

## Create Maintenance Record (opens lifecycle and deducts stock)

### Request

```http
POST /inventory/stock-maintenance
Content-Type: application/json
```

```json
{
  "companyId": "cmp_01",
  "productId": "prd_001",
  "locationId": "loc_it_01",
  "issueType": 0,
  "quantity": "5",
  "notes": "Sent to vendor service center",
  "createdBy": "usr_it_mgr_01"
}
```

## 5) Stock Lot Expiry Alerts

### Request

```http
GET /inventory/stock-lot-expiry/alerts?companyId=cmp_01&daysAhead=45
```

### Response (200)

```json
{
  "daysAhead": 45,
  "cutoff": "2026-05-24T00:00:00.000Z",
  "totals": {
    "nearExpiryCount": 3,
    "expiredCount": 1,
    "atRiskQuantity": "420"
  },
  "rows": [
    {
      "id": "lot_001",
      "productId": "prd_010",
      "locationId": "loc_main_store_01",
      "batchNumber": "BATCH-2026-001",
      "expiryDate": "2026-05-20T00:00:00.000Z",
      "quantityOnHand": "120",
      "reservedQuantity": "20",
      "status": 0
    }
  ]
}
```

## 6) Stock Lot Analytics (Aging + FEFO)

### Request

```http
GET /inventory/stock-lots/analytics?companyId=cmp_01&daysAhead=30&issueLookbackDays=90
```

### Response (200)

```json
{
  "daysAhead": 30,
  "issueLookbackDays": 90,
  "generatedAt": "2026-04-09T12:30:00.000Z",
  "totals": {
    "totalLots": 22,
    "totalOnHand": "6840",
    "totalReserved": "910",
    "expiredLots": 2,
    "nearExpiryLots": 4,
    "atRiskQuantity": "1130"
  },
  "agingBuckets": [
    { "bucket": "Expired", "lotCount": 2, "quantity": 210 },
    { "bucket": "0-30 days", "lotCount": 4, "quantity": 920 },
    { "bucket": "31-60 days", "lotCount": 5, "quantity": 1760 },
    { "bucket": "61-90 days", "lotCount": 3, "quantity": 980 },
    { "bucket": "91+ days", "lotCount": 6, "quantity": 2560 },
    { "bucket": "No expiry", "lotCount": 2, "quantity": 410 }
  ],
  "fefoCompliance": {
    "evaluatedIssues": 18,
    "compliantIssues": 15,
    "nonCompliantIssues": 3,
    "complianceRatePct": 83.33,
    "items": [
      {
        "movementId": "lmv_901",
        "lotId": "lot_008",
        "productId": "prd_010",
        "locationId": "loc_main_store_01",
        "issuedQuantity": "25",
        "issuedAt": "2026-04-04T10:00:00.000Z",
        "issuedLotBatchNumber": "BATCH-NEWER-01",
        "issuedLotExpiryDate": "2026-11-01T00:00:00.000Z",
        "expectedEarliestExpiryDate": "2026-08-10T00:00:00.000Z"
      }
    ]
  }
}
```

## 7) Lot Traceability

### Request

```http
GET /inventory/stock-lots/lot_001/traceability
```

### Response (200)

```json
{
  "lot": {
    "id": "lot_001",
    "companyId": "cmp_01",
    "productId": "prd_010",
    "locationId": "loc_main_store_01",
    "batchNumber": "BATCH-2026-001",
    "quantityOnHand": "120",
    "reservedQuantity": "20",
    "status": 0
  },
  "movements": [
    {
      "id": "lmv_001",
      "movementType": 0,
      "quantity": "150",
      "referenceType": "procurement_goods_receipt",
      "referenceId": "grn_001"
    }
  ],
  "procurementLinks": [
    {
      "goodsReceiptItemId": "gri_001",
      "receivedQuantity": "150",
      "goodsReceiptId": "grn_001",
      "receiptNo": "GRN-001",
      "purchaseOrderId": "po_001",
      "poNo": "PO-001",
      "supplierId": "sup_001",
      "supplierName": "ABC Supplies"
    }
  ]
}
```

## 8) Procurement GRN with Lot Capture

### Request

```http
POST /procurement/goods-receipts
Content-Type: application/json
```

```json
{
  "companyId": "cmp_01",
  "actorUserId": "usr_store_mgr_01",
  "purchaseOrderId": "po_001",
  "note": "Received at main store",
  "lines": [
    {
      "purchaseOrderItemId": "poi_001",
      "receivedQuantity": "150",
      "locationId": "loc_main_store_01",
      "batchNumber": "BATCH-2026-001",
      "supplierBatchNumber": "SUP-ALPHA-99",
      "manufacturedAt": "2026-02-01T00:00:00.000Z",
      "expiryDate": "2027-02-01T00:00:00.000Z"
    }
  ]
}
```

### Response (201)

```json
{
  "id": "grn_001",
  "receiptNo": "GRN-001"
}
```

## 9) Inventory Daily Automation Run

### Request

```http
POST /inventory/automation/run-daily
Content-Type: application/json
```

```json
{
  "companyId": "cmp_01",
  "actorUserId": "usr_store_mgr_01",
  "daysAhead": 30,
  "sendEmailAlerts": true,
  "recipientEmails": ["ops.manager@example.com"]
}
```

### Response (200)

```json
{
  "message": "Inventory daily automation job executed",
  "sweep": {
    "expiredCount": 2,
    "sweptAt": "2026-04-09T12:40:00.000Z"
  },
  "alerts": {
    "nearExpiryCount": 4,
    "expiredCount": 2,
    "atRiskQuantity": "1130"
  },
  "notification": {
    "sent": true,
    "recipients": 1,
    "lots": 6
  }
}
```

## 10) Stock Count Session (Cycle Count)

### Create Session

```http
POST /inventory/stock-count-sessions
Content-Type: application/json
```

```json
{
  "companyId": "cmp_01",
  "locationId": "loc_main_store_01",
  "notes": "Monthly cycle count",
  "createdBy": "usr_store_mgr_01"
}
```

### Response (201)

```json
{
  "id": "scs_001"
}
```

### Create Scoped Session (selected products only)

```http
POST /inventory/stock-count-sessions
Content-Type: application/json
```

```json
{
  "companyId": "cmp_01",
  "locationId": "loc_branch_store_01",
  "notes": "High-risk SKU recount",
  "productIds": ["prd_010", "prd_011", "prd_099"],
  "createdBy": "usr_branch_mgr_01"
}
```

### Update Counted Quantity for a Line

```http
PATCH /inventory/stock-count-sessions/scs_001/lines/scl_001
Content-Type: application/json
```

```json
{
  "countedQuantity": "92",
  "varianceReason": "Damaged units removed",
  "countedBy": "usr_store_mgr_01"
}
```

### Submit Session

```http
POST /inventory/stock-count-sessions/scs_001/submit
Content-Type: application/json
```

```json
{
  "submittedBy": "usr_store_mgr_01"
}
```

### Approve and Apply Reconciliation Adjustments

```http
POST /inventory/stock-count-sessions/scs_001/approve
Content-Type: application/json
```

```json
{
  "approvedBy": "usr_inventory_controller_01",
  "applyAdjustments": true
}
```

### Response (200)

```json
{ "id": "scs_001" }
```

## 11) Stock Request Line Acknowledgement (Partial Receipt)

### Request

```http
POST /inventory/stock-requests/sr_001/lines/srl_001/acknowledge
Content-Type: application/json
```

```json
{
  "acknowledgedQuantity": "80",
  "acknowledgedBy": "usr_branch_store_mgr_01",
  "notes": "Received in good condition"
}
```

### Response (200)

```json
{
  "id": "sra_001",
  "requestId": "sr_001",
  "lineId": "srl_001",
  "fulfilledQuantity": 140,
  "acknowledgedQuantity": 110,
  "pendingAcknowledgementQuantity": 30
}
```

## 12) Stock Transfer Receipt Acknowledgement (Variance Capture)

### Request

```http
POST /inventory/stock-transfers/st_001/acknowledge-receipt
Content-Type: application/json
```

```json
{
  "acceptedQuantity": "50",
  "damagedQuantity": "2",
  "missingQuantity": "1",
  "acknowledgedBy": "usr_branch_store_mgr_01",
  "notes": "3 units variance identified on arrival"
}
```

### Response (200)

```json
{
  "id": "st_001",
  "acceptedQuantity": 120,
  "damagedQuantity": 2,
  "missingQuantity": 1,
  "netReceived": 117,
  "pendingToAcknowledge": 20
}
```

## 13) Reorder Suggestions

### Request

```http
GET /inventory/reorder-suggestions?companyId=cmp_01&locationId=loc_branch_store_01
```

### Response (200)

```json
{
  "generatedAt": "2026-04-09T18:00:00.000Z",
  "companyId": "cmp_01",
  "locationId": "loc_branch_store_01",
  "totalRows": 2,
  "rows": [
    {
      "productId": "prd_010",
      "productName": "A4 Copy Paper",
      "productSku": "PPR-A4",
      "locationId": "loc_branch_store_01",
      "locationName": "Kumasi Branch Store",
      "locationType": 1,
      "currentQuantity": "40",
      "minStockLevel": "120",
      "reorderQuantity": "80",
      "suggestedSources": [
        {
          "locationId": "loc_main_store_01",
          "locationName": "Main Store",
          "locationType": 0,
          "availableQuantity": "620"
        }
      ]
    }
  ]
}
```

## List Maintenance Records

### Request

```http
GET /inventory/stock-maintenance?companyId=cmp_01&page=1&pageSize=20&status=0
```

### Response (200)

```json
{
  "data": [
    {
      "id": "smr_001",
      "companyId": "cmp_01",
      "productId": "prd_001",
      "locationId": "loc_it_01",
      "issueType": 0,
      "status": 0,
      "quantity": "5",
      "quantityReturned": "0",
      "quantityDisposed": "0",
      "notes": "Sent to vendor service center",
      "createdBy": "usr_it_mgr_01",
      "createdAt": "2026-04-08T10:10:00.000Z",
      "resolvedBy": null,
      "resolvedAt": null,
      "updatedAt": "2026-04-08T10:10:00.000Z"
    }
  ],
  "meta": {
    "totalRecords": 1,
    "totalPages": 1,
    "page": 1,
    "pageSize": 20,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## Resolve Maintenance Record (returns/disposes and closes)

### Request

```http
POST /inventory/stock-maintenance/smr_001/resolve
Content-Type: application/json
```

```json
{
  "quantityReturned": "3",
  "quantityDisposed": "2",
  "notes": "3 repaired, 2 beyond repair",
  "resolvedBy": "usr_it_mgr_01"
}
```

### Response (200)

```json
{ "id": "smr_001" }
```

## 5) Common Error Examples

## Insufficient stock on fulfill

```json
{
  "statusCode": 400,
  "message": "Insufficient stock at source location"
}
```

## Invalid maintenance issue for non-recoverable product

```json
{
  "statusCode": 400,
  "message": "This product is not configured as recoverable"
}
```

## Resolve arithmetic mismatch

```json
{
  "statusCode": 400,
  "message": "Returned + disposed quantities must equal recorded quantity"
}
```

## 6) Frontend Notes

- Quantities sent to API should be **base-unit strings**.
- UI may capture in larger units, but must convert before submit.
- Status and type constants are numeric enums and should not be sent as labels.

## Major Modules (1-6) API examples

### Approval policies

- `GET /v1/inventory/approval-policies?companyId=:companyId`
- `POST /v1/inventory/approval-policies`
- `POST /v1/inventory/approval-requests`
- `GET /v1/inventory/approval-requests?companyId=:companyId`
- `POST /v1/inventory/approval-requests/:id/decide`
- `POST /v1/inventory/approval-requests/escalate-overdue`

### Valuation + finance

- `GET /v1/inventory/valuation/summary?companyId=:companyId`
- `POST /v1/inventory/valuation/recompute`
- `POST /v1/inventory/valuation/sync-financial-postings`

### Replenishment proposals

- `POST /v1/inventory/replenishment-proposals`
- `GET /v1/inventory/replenishment-proposals?companyId=:companyId`
- `GET /v1/inventory/replenishment-proposals/:id`
- `POST /v1/inventory/replenishment-proposals/:id/decide`

### Tasks

- `GET /v1/inventory/tasks?companyId=:companyId`
- `GET /v1/inventory/tasks/:id`
- `POST /v1/inventory/tasks`
- `POST /v1/inventory/tasks/:id/status`
- `POST /v1/inventory/tasks/:id/scan`

### Audit + KPI

- `GET /v1/inventory/audit/event-journal?companyId=:companyId`
- `POST /v1/inventory/audit/corrections`
- `GET /v1/inventory/reports/enterprise-kpis?companyId=:companyId&days=30`

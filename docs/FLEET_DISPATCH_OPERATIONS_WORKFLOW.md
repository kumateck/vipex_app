# Fleet Dispatch Operations Workflow

This update completes a practical dispatch workflow across independent pages without telematics dependencies.

## Pages

1. Dispatch Board: `/fleet-transport/dispatch/board`
2. Route Assignment Operator: `/fleet-transport/dispatch/route-assignments`
3. Load Matching Queue: `/fleet-transport/dispatch/load-matching`
4. Check-In Operator: `/fleet-transport/dispatch/check-in`
5. Check-Out Operator: `/fleet-transport/dispatch/check-out`
6. Live Status (operational events): `/fleet-transport/dispatch/live-status`
7. Load Matching Audit Trail: `/fleet-transport/dispatch/load-matching/audit`
8. Dispatch Ops Performance: `/fleet-transport/dispatch/ops-performance`

## What each page does

### Dispatch Board

- Branch filter.
- Readiness summary (planned/in-progress/open incidents).
- Availability indicators (drivers/vehicles not currently in-progress).
- Warnings for planned trips missing route assignment or planning windows.
- Quick links to the operator pages.

### Route Assignment Operator

- Branch-scoped queue of planned trips.
- Route assignment/unassignment per trip.
- Suggested route list favoring same-branch routes when possible.
- Conflict flags included in queue:
  - vehicle overlap conflict
  - driver overlap conflict
  - missing schedule window

### Load Matching Queue

- Trip-scoped load rows.
- Candidate queue from server (search by booking/tracking, assignment block reasons).
- Status transitions:
  - `Assigned -> Loaded`
  - `Loaded -> Unloaded`
  - `Assigned/Loaded -> Cancelled`
- Separate create page remains at `/fleet-transport/dispatch/load-matching/new`.
- Separate load audit page remains at `/fleet-transport/dispatch/load-matching/audit`.

### Check-In Operator

- Branch + in-progress trip selection.
- Records check-in event with required odometer and location (time/note optional).
- Displays recent check-in events for selected trip.

### Check-Out Operator

- Branch + in-progress trip selection.
- Records check-out event with required odometer and location (time/note optional).
- Displays recent check-out events for selected trip.

### Live Status (Non-Telematics)

- In-progress trip selector.
- Current state card based on trip + latest operational event.
- Timeline view that excludes telemetry points and shows only:
  - trip started/closed
  - check-in/check-out events
  - trip status updates
  - load assigned/loaded/unloaded events

### Load Matching Audit Trail

- Per-trip audit history of load assignment/status updates.
- Shows actor, action, message, and timestamp.

### Dispatch Ops Performance

- Windowed KPIs:
  - route assignment coverage
  - on-time completion
  - check-out coverage
  - delayed/stopped update counts
- Supporting trip/check/load aggregates.

## API usage

- Existing fleet trip, event, status update, and load APIs are reused and expanded with:
  - `GET /dispatch/ops-performance`
  - `GET /dispatch/route-assignment-queue`
  - `GET /dispatch/load-candidates`
  - `GET /trips/:id/loads/audit`
- No GPS/tracker dependence is introduced.
- Live status is derived from operational events already captured by dispatch users.

## Notes

- Create and list remain separated for load matching as requested.
- Pages are independent and linked from Fleet Transport home for direct operator access.

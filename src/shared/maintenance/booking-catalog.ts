import type { MaintenanceScript } from './types';
const booking = [
  {
    name: 'bookingCode',
    label: 'Booking or tracking code',
    placeholder: 'e.g. AO4858124I',
    required: true,
  },
];
export const BOOKING_MAINTENANCE_SCRIPTS: MaintenanceScript[] = [
  {
    id: 'repair-parcel-receiving-workflow',
    title: 'Repair parcel receiving workflow',
    kind: 'repair',
    fields: [
      ...booking,
      {
        name: 'pickupLocationId',
        label: 'Pickup location ID',
        required: false,
        description:
          'Leave empty to use the destination’s only receiving location. If several exist, preview lists their IDs so you can choose the correct one.',
      },
    ],
    description:
      'Fill a missing pickup location or restore an already-called parcel that was moved from Awaiting Pickup back to Arrived at Destination. Caller assignment and call history are retained.',
    confirmation:
      'I verified the pickup location and confirm this parcel is still at the destination awaiting collection.',
    sourceFiles: ['src/server/features/maintenance/receiving-workflow/repair.ts'],
  },
  {
    id: 'check-parcel-booking-search',
    title: 'Check parcel booking search',
    kind: 'inspection',
    fields: booking,
    description:
      'Run the application booking search from the source and destination branches and report matching records and response times.',
    sourceFiles: ['scripts/check-parcel-booking-search.ts'],
  },
  {
    id: 'inspect-cleared-delivery-fee',
    title: 'Find cleared delivery fees',
    kind: 'inspection',
    fields: booking,
    description:
      'Inspect returned doorstep deliveries with cleared fees, recorded payments, approved fees and return evidence for this parcel.',
    sourceFiles: ['scripts/delivery-fee-repair/inspect.ts'],
  },
  {
    id: 'backfill-parcel-customer-names',
    title: 'Repair missing parcel customer names',
    kind: 'repair',
    fields: booking,
    description:
      'Fill missing sender and receiver name snapshots from this parcel’s customer records. Existing snapshots are retained.',
    confirmation:
      'I reviewed the customer names in the preview and confirm they belong to this parcel.',
    sourceFiles: ['scripts/backfill-parcel-customer-names.ts'],
  },
  {
    id: 'restore-reversed-parcel-balance',
    title: 'Restore balance after delivery reversal',
    kind: 'repair',
    fields: booking,
    description:
      'Restore the receiver To Be Paid amount from active principal payments after a recorded delivery reversal. Payments are retained.',
    confirmation: 'I verified the delivery reversal and the receiver balance shown in the preview.',
    sourceFiles: ['scripts/run-repair-as7749418g.ts', 'scripts/repair-as7749418g-to-be-paid.sql'],
  },
  {
    id: 'fix-reversed-booking-to-be-paid',
    title: 'Repair reversed recipient payments',
    kind: 'repair',
    fields: booking,
    description:
      'Void supported cash recipient principal payments left active after reversal, exclude their unfiled tax and restore the receiver balance.',
    confirmation:
      'I confirmed these recipient collections were reversed or refunded and the previewed payments must be voided.',
    sourceFiles: ['scripts/fix-reversed-booking-to-be-paid.ts'],
  },
  {
    id: 'repair-parcel-financial-state',
    title: 'Repair parcel To Be Paid balance',
    kind: 'repair',
    fields: booking,
    description:
      'Correct the stored receiver balance to match the parcel charge minus active principal payments. Payments and charges are retained.',
    confirmation:
      'I reviewed the active payments and confirm the previewed receiver balance is correct.',
    sourceFiles: ['src/server/features/shipments/parcel-financial-repair.service.ts'],
  },
];

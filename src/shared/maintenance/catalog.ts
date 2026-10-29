import { BOOKING_MAINTENANCE_SCRIPTS } from './booking-catalog';
import type { MaintenanceScript } from './types';

const bookingField = {
  name: 'bookingCode',
  label: 'Booking code',
  placeholder: 'e.g. AO4858124I',
  required: true,
};
export const MAINTENANCE_SCRIPTS: MaintenanceScript[] = [
  {
    id: 'trace-credit-parcel',
    title: 'Trace parcel payments',
    sourceFiles: ['scripts/trace-credit-parcel.ts'],
    kind: 'inspection',
    description: 'Inspect saved parcel payments, credit charges, tax entries and audit events.',
    fields: [{ ...bookingField, label: 'Booking or tracking code' }],
  },
  {
    id: 'repair-credit-print-payment',
    title: 'Repair credit payment from printing',
    confirmation: 'I confirmed that printing created this payment and no cash was received.',
    sourceFiles: ['scripts/repair-credit-print-payment.ts'],
    kind: 'repair',
    description:
      'Void a cash payment created by printing a credit parcel. Retain the original credit charge and exclude the unfiled tax entry.',
    fields: [bookingField],
  },
  {
    id: 'scan-credit-conflicts',
    title: 'Find credit and cash conflicts',
    kind: 'inspection',
    description:
      'List credit parcels in your company that also have an active cash payment. Review each case before repairing it.',
    fields: [
      {
        ...bookingField,
        required: false,
        description:
          'Leave empty to scan your company, or enter a booking code to check one parcel.',
      },
    ],
  },
  ...BOOKING_MAINTENANCE_SCRIPTS,
];
export const MAINTENANCE_PATH = '/settings/maintenance';
export const isSystemAdminRoleName = (name?: string | null) =>
  name?.trim().toLowerCase() === 'system admin';

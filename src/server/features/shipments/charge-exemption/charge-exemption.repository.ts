import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/config';
import { customers, employees, branches } from '@/db/schemas';
import { EmploymentStatus } from '@/db/schemas/enums';
import { BadRequest, Conflict, NotFound } from '@/server/utils/http-error';
import { resolveParcelExemptionType } from '@/shared/customers/customer-types';

type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
type Booking = {
  companyId: string;
  senderId: string;
  parcels: ReadonlyArray<{ receiverId: string; chargeExemptCustomerType?: number | null }>;
};

export async function resolveBookingExemptions(
  input: Booking,
  executor: Executor = db,
  lock = false,
) {
  const ids = [...new Set([input.senderId, ...input.parcels.map((p) => p.receiverId)])].sort();
  const query = executor
    .select({ id: customers.id, customerType: customers.customerType })
    .from(customers)
    .where(
      and(
        inArray(customers.id, ids),
        eq(customers.companyId, input.companyId),
        eq(customers.isDeleted, false),
      ),
    )
    .orderBy(asc(customers.id));
  const rows = await (lock ? query.for('share') : query);
  const types = new Map(rows.map((row) => [row.id, row.customerType]));
  if (types.size !== ids.length) throw NotFound('Sender or receiver not found in your company');
  return input.parcels.map((p) =>
    resolveParcelExemptionType(types.get(input.senderId), types.get(p.receiverId)),
  );
}

export async function assertBookingExemptionsUnchanged(input: Booking, executor: Executor) {
  const current = await resolveBookingExemptions(input, executor, true);
  input.parcels.forEach((p, index) => {
    if (current[index] !== (p.chargeExemptCustomerType ?? null)) {
      throw Conflict('Customer type changed during booking. Refresh and try again.');
    }
  });
}

const eligibleStaff = (companyId: string, destinationId: string) =>
  and(
    eq(employees.companyId, companyId),
    eq(employees.branchId, destinationId),
    eq(employees.isDeleted, false),
    eq(employees.employmentStatus, EmploymentStatus.ACTIVE),
  );

export async function listReceivingStaffOptions(companyId: string, destinationId: string) {
  const [branch] = await db
    .select({ id: branches.id })
    .from(branches)
    .where(and(eq(branches.id, destinationId), eq(branches.companyId, companyId)));
  if (!branch) throw NotFound('Destination branch not found');
  return db
    .select({
      id: employees.id,
      fullname: employees.displayName,
      employeeNumber: employees.employeeNumber,
    })
    .from(employees)
    .where(eligibleStaff(companyId, destinationId))
    .orderBy(asc(employees.displayName), asc(employees.id));
}

export async function resolveReceivingStaff(
  companyId: string,
  parcel: {
    destinationId: string;
    chargeExemptCustomerType?: number | null;
    relatedStaffId?: string | null;
  },
  executor: Executor,
) {
  if (parcel.chargeExemptCustomerType !== 5) {
    if (parcel.relatedStaffId) throw BadRequest('Related staff is only allowed for Staff parcels');
    return { relatedStaffId: null, relatedStaffNameSnapshot: null };
  }
  if (!parcel.relatedStaffId)
    throw BadRequest('Select the staff member receiving the Staff parcel');
  const [staff] = await executor
    .select({ id: employees.id, name: employees.displayName })
    .from(employees)
    .where(
      and(eligibleStaff(companyId, parcel.destinationId), eq(employees.id, parcel.relatedStaffId)),
    )
    .for('share');
  if (!staff)
    throw BadRequest('Receiving staff must be active at the destination branch in your company');
  return { relatedStaffId: staff.id, relatedStaffNameSnapshot: staff.name };
}

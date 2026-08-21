import { Badge } from '@/components/ui/badge';
import { CASHIER_TYPE_LABELS, USER_TYPE_LABELS } from '@/shared/access/constants';
import { UserType } from '@/db/schemas/enums';
import type { User } from '../types/user.types';

const PRIMARY_TEXT_CLASS = 'truncate font-medium';
const SECONDARY_TEXT_CLASS = 'truncate text-xs text-muted-foreground';
const USER_STATUS_BADGE_CLASSES: Record<number, string> = {
  0: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  1: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  2: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  3: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
  4: 'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300',
  5: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  6: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
};

export function UserIdentityCell({ user }: { user: User }) {
  const contactDetails = `${user.email} · ${user.telephone}`;

  return (
    <div className="w-64 min-w-0 max-w-[28vw]" aria-label={`${user.fullname}, ${contactDetails}`}>
      <p className={PRIMARY_TEXT_CLASS} title={user.fullname}>
        {user.fullname}
      </p>
      <p className={SECONDARY_TEXT_CLASS} title={contactDetails}>
        {contactDetails}
      </p>
    </div>
  );
}

export function UserAccessCell({ user }: { user: User }) {
  const role = user.roleName ?? 'Unassigned role';
  const userType = USER_TYPE_LABELS[user.userType] ?? String(user.userType);
  const cashierType =
    user.userType === UserType.CASHIER &&
    user.cashierType !== null &&
    user.cashierType !== undefined
      ? (CASHIER_TYPE_LABELS[user.cashierType] ?? String(user.cashierType))
      : null;
  const accessType = cashierType ? `${userType} · ${cashierType}` : userType;

  return (
    <div className="w-48 min-w-0 max-w-[20vw]" aria-label={`${role}, ${accessType}`}>
      <p className={PRIMARY_TEXT_CLASS} title={role}>
        {role}
      </p>
      <p className={SECONDARY_TEXT_CLASS} title={accessType}>
        {accessType}
      </p>
    </div>
  );
}

export function UserEmployeeCell({ user }: { user: User }) {
  if (!user.employeeId) {
    return <p className="w-52 text-muted-foreground">Not linked</p>;
  }

  const employeeName = user.employeeName ?? 'Employee';
  const employeeNumber = user.employeeNumber ?? 'No employee code';

  return (
    <div className="w-52 min-w-0 max-w-[22vw]" aria-label={`${employeeName}, ${employeeNumber}`}>
      <p className={PRIMARY_TEXT_CLASS} title={employeeName}>
        {employeeName}
      </p>
      <p className={SECONDARY_TEXT_CLASS} title={employeeNumber}>
        {employeeNumber}
      </p>
    </div>
  );
}

export function UserWorkplaceCell({ user }: { user: User }) {
  const branch = user.branchName ?? 'Unknown branch';
  const location = user.locationName ?? 'No location';

  return (
    <div className="w-36 min-w-0 max-w-[16vw]" aria-label={`${branch}, ${location}`}>
      <p className={PRIMARY_TEXT_CLASS} title={branch}>
        {branch}
      </p>
      <p className={SECONDARY_TEXT_CLASS} title={location}>
        {location}
      </p>
    </div>
  );
}

export function UserStatusBadge({ status, label }: { status: number; label: string }) {
  return (
    <Badge
      variant="outline"
      className={
        USER_STATUS_BADGE_CLASSES[status] ?? 'border-border bg-muted text-muted-foreground'
      }
    >
      {label}
    </Badge>
  );
}

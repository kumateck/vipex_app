import { EmploymentStatus, EmploymentType } from '@/db/schemas/enums';
import type { User } from '../types/user.types';
import type { EmployeeFromUserForm } from '../types/user-employee-link.types';

export function splitUserFullname(fullname: string) {
  const parts = fullname.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? '',
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
    lastName: parts.length > 1 ? (parts.at(-1) ?? '') : '',
  };
}

export function createEmployeeFromUserForm(user: User): EmployeeFromUserForm {
  const names = splitUserFullname(user.fullname);
  return {
    employeeNumber: '',
    ...names,
    departmentId: '',
    jobTitleId: '',
    supervisorEmployeeId: '',
    hireDate: new Date().toISOString().slice(0, 10),
    employmentStatus: EmploymentStatus.ACTIVE,
    employmentType: EmploymentType.FULL_TIME,
  };
}

export function dateToFormValue(date?: Date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formValueToDate(value: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

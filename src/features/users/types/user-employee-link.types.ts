import type { EmploymentStatus, EmploymentType } from '@/db/schemas/enums';

export type UserEmployeeLinkMode = 'existing' | 'new';

export interface EmployeeFromUserForm {
  employeeNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  departmentId: string;
  jobTitleId: string;
  supervisorEmployeeId: string;
  hireDate: string;
  employmentStatus: EmploymentStatus;
  employmentType: EmploymentType;
}

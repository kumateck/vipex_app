import { describe, expect, it } from 'bun:test';
import { EmploymentStatus, EmploymentType, UserType } from '@/db/schemas/enums';
import {
  createEmployeeFromUserForm,
  splitUserFullname,
} from '@/features/users/utils/user-employee-link';
import type { User } from '@/features/users/types/user.types';

describe('user employee link helpers', () => {
  it('splits first, middle, and last names for employee prefilling', () => {
    expect(splitUserFullname('Ama Serwaa Mensah')).toEqual({
      firstName: 'Ama',
      middleName: 'Serwaa',
      lastName: 'Mensah',
    });
    expect(splitUserFullname('Kojo Mensah')).toEqual({
      firstName: 'Kojo',
      middleName: '',
      lastName: 'Mensah',
    });
  });

  it('builds a new employee form with safe defaults', () => {
    const user: User = {
      id: 'user-1',
      fullname: 'Ama Mensah',
      telephone: '0240000000',
      email: 'ama@example.com',
      status: 0,
      roleId: 'role-1',
      companyId: 'company-1',
      branchId: 'branch-1',
      userType: UserType.STAFF,
      createdBy: 'user-0',
    };

    const form = createEmployeeFromUserForm(user);
    expect(form.firstName).toBe('Ama');
    expect(form.lastName).toBe('Mensah');
    expect(form.employmentStatus).toBe(EmploymentStatus.ACTIVE);
    expect(form.employmentType).toBe(EmploymentType.FULL_TIME);
    expect(form.hireDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

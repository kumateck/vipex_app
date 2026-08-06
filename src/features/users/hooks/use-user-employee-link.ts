import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  useCreateEmployeeFromUserMutation,
  useLinkEmployeeUserMutation,
  useListDepartmentOptionsQuery,
  useListEmployeeOptionsQuery,
  useListJobTitleOptionsQuery,
} from '@/features/hr/api/hr.api';
import { PermissionKeys } from '@/shared/permissions/constants';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '../types/user.types';
import type { EmployeeFromUserForm, UserEmployeeLinkMode } from '../types/user-employee-link.types';
import { createEmployeeFromUserForm } from '../utils/user-employee-link';
import { getUserErrorMessage } from '../utils/user-error';

export function useUserEmployeeLink(user: User, onComplete: () => void) {
  const permissions = useAuthStore((state) => state.user?.permissions ?? []);
  const canUpdateUsers = permissions.includes(PermissionKeys.CanUpdateUsers);
  const canLinkExisting =
    canUpdateUsers &&
    permissions.includes(PermissionKeys.CanListEmployees) &&
    permissions.includes(PermissionKeys.CanCreateEmployeeUserAccount);
  const canCreateEmployee =
    canUpdateUsers && permissions.includes(PermissionKeys.CanCreateEmployee);
  const [mode, setMode] = useState<UserEmployeeLinkMode>(() =>
    canLinkExisting ? 'existing' : 'new',
  );
  const [employeeId, setEmployeeId] = useState('');
  const [form, setForm] = useState<EmployeeFromUserForm>(() => createEmployeeFromUserForm(user));

  const { data: employeeOptions = [], isLoading: isLoadingEmployees } = useListEmployeeOptionsQuery(
    { branchId: user.branchId, unlinkedOnly: true },
    { skip: !canLinkExisting },
  );
  const { data: supervisorOptions = [] } = useListEmployeeOptionsQuery(undefined, {
    skip: !canCreateEmployee,
  });
  const { data: departmentOptions = [] } = useListDepartmentOptionsQuery(undefined, {
    skip: !canCreateEmployee,
  });
  const { data: jobTitleOptions = [] } = useListJobTitleOptionsQuery(undefined, {
    skip: !canCreateEmployee,
  });
  const [linkEmployeeUser, { isLoading: isLinking }] = useLinkEmployeeUserMutation();
  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeFromUserMutation();

  const updateForm = useCallback((patch: Partial<EmployeeFromUserForm>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  const submitExisting = useCallback(async () => {
    if (!employeeId) return;
    try {
      await linkEmployeeUser({ userId: user.id, employeeId }).unwrap();
      toast.success('User linked to employee');
      onComplete();
    } catch (error) {
      toast.error(getUserErrorMessage(error, 'Failed to link employee'));
    }
  }, [employeeId, linkEmployeeUser, onComplete, user]);

  const submitNew = useCallback(async () => {
    if (!form.employeeNumber.trim() || !form.firstName.trim() || !form.lastName.trim()) {
      toast.error('Employee number, first name, and last name are required');
      return;
    }
    try {
      await createEmployee({
        userId: user.id,
        employeeNumber: form.employeeNumber.trim(),
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || null,
        lastName: form.lastName.trim(),
        departmentId: form.departmentId || null,
        jobTitleId: form.jobTitleId || null,
        supervisorEmployeeId: form.supervisorEmployeeId || null,
        hireDate: form.hireDate,
        employmentStatus: form.employmentStatus,
        employmentType: form.employmentType,
      }).unwrap();
      toast.success('Employee created and linked to user');
      onComplete();
    } catch (error) {
      toast.error(getUserErrorMessage(error, 'Failed to create employee'));
    }
  }, [createEmployee, form, onComplete, user]);

  return {
    mode,
    setMode,
    employeeId,
    setEmployeeId,
    form,
    updateForm,
    employeeOptions,
    supervisorOptions,
    departmentOptions,
    jobTitleOptions,
    isLoadingEmployees,
    isSubmitting: isLinking || isCreating,
    canLinkExisting,
    canCreateEmployee,
    submitExisting,
    submitNew,
  };
}

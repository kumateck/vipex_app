import { getErrorMessage as getApplicationErrorMessage } from '@/lib/TheAduseiErrorResponse';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useListLocationOptionsQuery } from '@/features/locations/api/locations.api';
import { useListRoleOptionsQuery } from '@/features/rbac/api/rbac.api';
import { useCreateEmployeeUserAccountMutation, type Employee } from '../../../api/hr.api';

export function useEmployeeAccountLink() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [roleId, setRoleId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [locationId, setLocationId] = useState('');
  const { data: roleOptions = [] } = useListRoleOptionsQuery();
  const { data: locationOptions = [] } = useListLocationOptionsQuery(
    { branchId: branchId || undefined },
    { skip: !branchId },
  );
  const [createEmployeeUserAccount, { isLoading: isSubmitting }] =
    useCreateEmployeeUserAccountMutation();

  useEffect(() => {
    if (!employee) return;
    setRoleId('');
    setBranchId(employee.branchId ?? '');
    setLocationId(employee.locationId ?? '');
  }, [employee]);

  const close = useCallback(() => setEmployee(null), []);
  const changeBranch = useCallback((value: string) => {
    setBranchId(value);
    setLocationId('');
  }, []);
  const submit = useCallback(async () => {
    if (!employee) return;
    try {
      await createEmployeeUserAccount({
        employeeId: employee.id,
        roleId,
        branchId,
        locationId: locationId || null,
      }).unwrap();
      toast.success('User account created');
      setEmployee(null);
    } catch (error) {
      toast.error(getApplicationErrorMessage(error, '') || 'Failed to create user');
    }
  }, [branchId, createEmployeeUserAccount, employee, locationId, roleId]);

  return {
    employee,
    roleOptions,
    locationOptions,
    roleId,
    branchId,
    locationId,
    isSubmitting,
    open: setEmployee,
    close,
    setRoleId,
    changeBranch,
    setLocationId,
    submit,
  };
}

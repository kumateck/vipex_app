import { useCallback, useState } from 'react';
import { PayrollItemType } from '@/db/schemas/enums';
import { useListEmployeeOptionsQuery } from '@/features/hr/api/hr.api';
import {
  useCreatePayrollManualAdjustmentMutation,
  useListDeductionTypesQuery,
  useListEarningTypesQuery,
} from '../../../api/payroll.api';

export function useManualAdjustmentForm(payrollCycleId: string, onSuccess: () => void) {
  const [employeeId, setEmployeeId] = useState('');
  const [itemType, setItemType] = useState(String(PayrollItemType.EARNING));
  const [typeId, setTypeId] = useState('');
  const [amountPsw, setAmountPsw] = useState('');
  const [isTaxable, setIsTaxable] = useState(true);
  const [notes, setNotes] = useState('');
  const { data: employees = [] } = useListEmployeeOptionsQuery();
  const { data: earningsData } = useListEarningTypesQuery({ pageSize: 100 });
  const { data: deductionsData } = useListDeductionTypesQuery({ pageSize: 100 });
  const [createEntry, { isLoading }] = useCreatePayrollManualAdjustmentMutation();
  const availableTypes =
    Number(itemType) === PayrollItemType.DEDUCTION
      ? (deductionsData?.data ?? [])
      : (earningsData?.data ?? []);

  const changeItemType = useCallback((value: string) => {
    setItemType(value);
    setTypeId('');
    setIsTaxable(Number(value) !== PayrollItemType.DEDUCTION);
  }, []);

  const submit = useCallback(async () => {
    if (!payrollCycleId || !employeeId || !typeId || !amountPsw) return;
    const numericItemType = Number(itemType);
    await createEntry({
      payrollCycleId,
      employeeId,
      itemType: numericItemType,
      earningTypeId: numericItemType === PayrollItemType.EARNING ? typeId : null,
      deductionTypeId: numericItemType === PayrollItemType.DEDUCTION ? typeId : null,
      amountPsw: Number(amountPsw),
      isTaxable: numericItemType === PayrollItemType.DEDUCTION ? false : isTaxable,
      notes: notes.trim() || null,
    }).unwrap();
    setEmployeeId('');
    setItemType(String(PayrollItemType.EARNING));
    setTypeId('');
    setAmountPsw('');
    setIsTaxable(true);
    setNotes('');
    onSuccess();
  }, [
    amountPsw,
    createEntry,
    employeeId,
    isTaxable,
    itemType,
    notes,
    onSuccess,
    payrollCycleId,
    typeId,
  ]);

  return {
    amountPsw,
    availableTypes,
    changeItemType,
    employeeId,
    employees,
    isLoading,
    isTaxable,
    itemType,
    notes,
    setAmountPsw,
    setEmployeeId,
    setIsTaxable,
    setNotes,
    setTypeId,
    submit,
    typeId,
  };
}

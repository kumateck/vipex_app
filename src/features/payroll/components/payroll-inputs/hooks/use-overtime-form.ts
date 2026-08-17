import { useCallback, useState } from 'react';
import { useListEmployeeOptionsQuery } from '@/features/hr/api/hr.api';
import { useCreatePayrollOvertimeEntryMutation } from '../../../api/payroll.api';

export function useOvertimeForm(payrollCycleId: string, onSuccess: () => void) {
  const [employeeId, setEmployeeId] = useState('');
  const [minutes, setMinutes] = useState('');
  const [ratePerHourPsw, setRatePerHourPsw] = useState('');
  const [multiplierPct, setMultiplierPct] = useState('150');
  const [notes, setNotes] = useState('');
  const { data: employees = [] } = useListEmployeeOptionsQuery();
  const [createEntry, { isLoading }] = useCreatePayrollOvertimeEntryMutation();

  const submit = useCallback(async () => {
    if (!payrollCycleId || !employeeId || !minutes || !ratePerHourPsw) return;
    await createEntry({
      payrollCycleId,
      employeeId,
      overtimeMinutes: Number(minutes),
      ratePerHourPsw: Number(ratePerHourPsw),
      multiplierPct: Number(multiplierPct || '100'),
      notes: notes.trim() || null,
    }).unwrap();
    setEmployeeId('');
    setMinutes('');
    setRatePerHourPsw('');
    setMultiplierPct('150');
    setNotes('');
    onSuccess();
  }, [
    createEntry,
    employeeId,
    minutes,
    multiplierPct,
    notes,
    onSuccess,
    payrollCycleId,
    ratePerHourPsw,
  ]);

  return {
    employeeId,
    employees,
    isLoading,
    minutes,
    multiplierPct,
    notes,
    ratePerHourPsw,
    setEmployeeId,
    setMinutes,
    setMultiplierPct,
    setNotes,
    setRatePerHourPsw,
    submit,
  };
}

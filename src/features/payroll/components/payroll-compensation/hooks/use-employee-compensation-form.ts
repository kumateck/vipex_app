import { useCallback, useEffect, useState } from 'react';
import { useListTaxProfilesQuery } from '@/features/accounting/api';
import { useListEmployeeOptionsQuery } from '@/features/hr/api/hr.api';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';
import { CompensationItemCalculationType, PayrollItemType, PayType } from '@/db/schemas/enums';
import {
  useGetEmployeeCompensationQuery,
  useListDeductionTypesQuery,
  useListEarningTypesQuery,
  useListPayrollGroupsQuery,
  useSetEmployeeCompensationMutation,
} from '../../../api/payroll.api';

export type DraftCompensationItem = {
  id: string;
  itemType: number;
  typeId: string;
  calculationType: number;
  amountPsw: string;
  percentageBasis: string;
};

function emptyItem(): DraftCompensationItem {
  return {
    id: crypto.randomUUID(),
    itemType: PayrollItemType.EARNING,
    typeId: '',
    calculationType: CompensationItemCalculationType.FIXED,
    amountPsw: '',
    percentageBasis: 'base_pay',
  };
}

const today = () => new Date().toISOString().slice(0, 10);

export function useEmployeeCompensationForm(onSuccess: () => void) {
  const [employeeId, setEmployeeId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [payType, setPayType] = useState(String(PayType.MONTHLY));
  const [currency, setCurrency] = useState('GHS');
  const [basePay, setBasePay] = useState('');
  const [taxProfileId, setTaxProfileId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(today);
  const [items, setItems] = useState<DraftCompensationItem[]>([]);
  const [newItem, setNewItem] = useState<DraftCompensationItem>(emptyItem);
  const { data: employees = [] } = useListEmployeeOptionsQuery();
  const { data: groupsData } = useListPayrollGroupsQuery({ pageSize: 100 });
  const { data: earningsData } = useListEarningTypesQuery({ pageSize: 100 });
  const { data: deductionsData } = useListDeductionTypesQuery({ pageSize: 100 });
  const { data: current } = useGetEmployeeCompensationQuery(employeeId, { skip: !employeeId });
  const companyId = useAuthStore((state) => (state.user as AuthUser | null)?.company?.id ?? '');
  const { data: taxProfiles = [] } = useListTaxProfilesQuery(
    { companyId, active: true },
    { skip: !companyId },
  );
  const [save, { isLoading }] = useSetEmployeeCompensationMutation();
  const groups = groupsData?.data ?? [];
  const earnings = earningsData?.data ?? [];
  const deductions = deductionsData?.data ?? [];

  useEffect(() => {
    if (!employeeId || !current) {
      setGroupId('');
      setPayType(String(PayType.MONTHLY));
      setCurrency('GHS');
      setBasePay('');
      setEffectiveFrom(today());
      setTaxProfileId('');
      setItems([]);
      return;
    }
    setGroupId(current.payrollGroupId ?? '');
    setPayType(String(current.payType ?? PayType.MONTHLY));
    setCurrency(current.currencyCode ?? 'GHS');
    setBasePay(String(current.basePayPsw ?? ''));
    setEffectiveFrom(current.effectiveFrom?.slice(0, 10) ?? today());
    setTaxProfileId(current.taxProfileId ?? '');
    setItems(
      (current.items ?? []).map((item) => ({
        id: item.id ?? crypto.randomUUID(),
        itemType: item.itemType,
        typeId:
          item.itemType === PayrollItemType.DEDUCTION
            ? (item.deductionTypeId ?? '')
            : (item.earningTypeId ?? ''),
        calculationType: item.calculationType,
        amountPsw: String(item.amountPsw),
        percentageBasis: item.percentageBasis ?? 'base_pay',
      })),
    );
  }, [current, employeeId]);

  const addItem = useCallback(() => {
    if (!newItem.typeId || !newItem.amountPsw) return;
    setItems((currentItems) => [...currentItems, newItem]);
    setNewItem(emptyItem());
  }, [newItem]);

  const removeItem = useCallback((id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }, []);

  const submit = useCallback(async () => {
    if (!employeeId || !groupId || !basePay || !effectiveFrom) return;
    await save({
      employeeId,
      payrollGroupId: groupId,
      payType: Number(payType),
      currencyCode: currency.trim() || 'GHS',
      basePayPsw: Number(basePay),
      effectiveFrom,
      taxProfileId: taxProfileId || null,
      items: items.map((item) => ({
        itemType: item.itemType,
        earningTypeId: item.itemType === PayrollItemType.EARNING ? item.typeId : null,
        deductionTypeId: item.itemType === PayrollItemType.DEDUCTION ? item.typeId : null,
        calculationType: item.calculationType,
        amountPsw: Number(item.amountPsw),
        percentageBasis:
          item.calculationType === CompensationItemCalculationType.PERCENTAGE
            ? item.percentageBasis
            : null,
        isRecurring: true,
      })),
    }).unwrap();
    setItems([]);
    onSuccess();
  }, [
    basePay,
    currency,
    effectiveFrom,
    employeeId,
    groupId,
    items,
    onSuccess,
    payType,
    save,
    taxProfileId,
  ]);

  return {
    addItem,
    basePay,
    currency,
    deductions,
    effectiveFrom,
    employeeId,
    employees,
    earnings,
    groupId,
    groups,
    isLoading,
    items,
    newItem,
    payType,
    removeItem,
    setBasePay,
    setCurrency,
    setEffectiveFrom,
    setEmployeeId,
    setGroupId,
    setNewItem,
    setPayType,
    setTaxProfileId,
    submit,
    taxProfileId,
    taxProfiles,
  };
}

export type EmployeeCompensationForm = ReturnType<typeof useEmployeeCompensationForm>;

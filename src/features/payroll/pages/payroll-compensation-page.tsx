import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useListTaxProfilesQuery } from '@/features/accounting/api';
import { useListEmployeesQuery } from '@/features/hr';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';
import {
  CompensationItemCalculationType,
  PayrollFrequency,
  PayrollItemType,
  PayType,
} from '@/db/schemas/enums';
import {
  useCreateDeductionTypeMutation,
  useCreateEarningTypeMutation,
  useGetEmployeeCompensationQuery,
  useListCompensationQuery,
  useListDeductionTypesQuery,
  useListEarningTypesQuery,
  useListPayrollGroupsQuery,
  useSetEmployeeCompensationMutation,
  type CompensationItem,
} from '../api/payroll.api';

type DraftCompensationItem = {
  id: string;
  itemType: number;
  typeId: string;
  calculationType: number;
  amountPsw: string;
  percentageBasis: string;
};

function frequencyLabel(value: number) {
  if (value === PayrollFrequency.MONTHLY) return 'Monthly';
  if (value === PayrollFrequency.WEEKLY) return 'Weekly';
  if (value === PayrollFrequency.BIWEEKLY) return 'Biweekly';
  return String(value);
}

function itemTypeLabel(item: CompensationItem) {
  return item.itemType === PayrollItemType.DEDUCTION
    ? (item.deductionName ?? item.deductionCode ?? 'Deduction')
    : (item.earningName ?? item.earningCode ?? 'Earning');
}

function parseDateInputValue(value: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toDateInputValue(date?: Date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function PayrollCompensationPage() {
  const [earningCode, setEarningCode] = useState('');
  const [earningName, setEarningName] = useState('');
  const [deductionCode, setDeductionCode] = useState('');
  const [deductionName, setDeductionName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [payrollGroupId, setPayrollGroupId] = useState('');
  const [payType, setPayType] = useState(String(PayType.MONTHLY));
  const [currencyCode, setCurrencyCode] = useState('GHS');
  const [basePayPsw, setBasePayPsw] = useState('');
  const [taxProfileId, setTaxProfileId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [draftItems, setDraftItems] = useState<DraftCompensationItem[]>([]);
  const [newItem, setNewItem] = useState<DraftCompensationItem>({
    id: crypto.randomUUID(),
    itemType: PayrollItemType.EARNING,
    typeId: '',
    calculationType: CompensationItemCalculationType.FIXED,
    amountPsw: '',
    percentageBasis: 'base_pay',
  });

  const { data: earningTypesData } = useListEarningTypesQuery({ pageSize: 100 });
  const { data: deductionTypesData } = useListDeductionTypesQuery({ pageSize: 100 });
  const { data: payrollGroupsData } = useListPayrollGroupsQuery({ pageSize: 100 });
  const { data: employeesData } = useListEmployeesQuery({ pageSize: 100 });
  const { data: compensationData } = useListCompensationQuery({ pageSize: 100 });
  const { data: employeeCompensation } = useGetEmployeeCompensationQuery(employeeId, {
    skip: !employeeId,
  });
  const authUser = useAuthStore((state) => state.user as AuthUser | null);
  const companyId = authUser?.company?.id ?? '';
  const { data: taxProfilesData } = useListTaxProfilesQuery(
    { companyId, active: true },
    { skip: !companyId },
  );

  const [createEarningType, { isLoading: isCreatingEarning }] = useCreateEarningTypeMutation();
  const [createDeductionType, { isLoading: isCreatingDeduction }] =
    useCreateDeductionTypeMutation();
  const [setEmployeeCompensation, { isLoading: isSavingCompensation }] =
    useSetEmployeeCompensationMutation();

  const earningTypes = earningTypesData?.data ?? [];
  const deductionTypes = deductionTypesData?.data ?? [];
  const payrollGroups = payrollGroupsData?.data ?? [];
  const employees = employeesData?.data ?? [];
  const compensationRows = compensationData?.data ?? [];
  const taxProfiles = taxProfilesData ?? [];

  useEffect(() => {
    if (!employeeId) {
      setPayrollGroupId('');
      setPayType(String(PayType.MONTHLY));
      setCurrencyCode('GHS');
      setBasePayPsw('');
      setEffectiveFrom(new Date().toISOString().slice(0, 10));
      setTaxProfileId('');
      setDraftItems([]);
      return;
    }

    if (!employeeCompensation) {
      setPayrollGroupId('');
      setPayType(String(PayType.MONTHLY));
      setCurrencyCode('GHS');
      setBasePayPsw('');
      setEffectiveFrom(new Date().toISOString().slice(0, 10));
      setTaxProfileId('');
      setDraftItems([]);
      return;
    }

    setPayrollGroupId(employeeCompensation.payrollGroupId ?? '');
    setPayType(String(employeeCompensation.payType ?? PayType.MONTHLY));
    setCurrencyCode(employeeCompensation.currencyCode ?? 'GHS');
    setBasePayPsw(String(employeeCompensation.basePayPsw ?? ''));
    setEffectiveFrom(employeeCompensation.effectiveFrom?.slice(0, 10) ?? '');
    setTaxProfileId(employeeCompensation.taxProfileId ?? '');
    setDraftItems(
      (employeeCompensation.items ?? []).map((item) => ({
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
  }, [employeeCompensation, employeeId]);

  return (
    <div className="w-full space-y-4 p-4">
      <Tabs defaultValue="types" className="space-y-4">
        <TabsList>
          <TabsTrigger value="types">Earnings & deductions</TabsTrigger>
          <TabsTrigger value="employee">Employee compensation</TabsTrigger>
        </TabsList>

        <TabsContent value="types">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Earning types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Code"
                    value={earningCode}
                    onChange={(e) => setEarningCode(e.target.value)}
                  />
                  <Input
                    placeholder="Name"
                    value={earningName}
                    onChange={(e) => setEarningName(e.target.value)}
                  />
                  <Button
                    disabled={!earningCode.trim() || !earningName.trim() || isCreatingEarning}
                    onClick={async () => {
                      await createEarningType({
                        code: earningCode.trim(),
                        name: earningName.trim(),
                      }).unwrap();
                      setEarningCode('');
                      setEarningName('');
                    }}
                  >
                    Add
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Recurring</TableHead>
                      <TableHead>Taxable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earningTypes.length ? (
                      earningTypes.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.code}</TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.isRecurring ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{row.isTaxable ? 'Yes' : 'No'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4}>No earning types configured.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deduction types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Code"
                    value={deductionCode}
                    onChange={(e) => setDeductionCode(e.target.value)}
                  />
                  <Input
                    placeholder="Name"
                    value={deductionName}
                    onChange={(e) => setDeductionName(e.target.value)}
                  />
                  <Button
                    disabled={!deductionCode.trim() || !deductionName.trim() || isCreatingDeduction}
                    onClick={async () => {
                      await createDeductionType({
                        code: deductionCode.trim(),
                        name: deductionName.trim(),
                      }).unwrap();
                      setDeductionCode('');
                      setDeductionName('');
                    }}
                  >
                    Add
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Recurring</TableHead>
                      <TableHead>Statutory</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deductionTypes.length ? (
                      deductionTypes.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.code}</TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.isRecurring ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{row.isStatutory ? 'Yes' : 'No'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4}>No deduction types configured.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employee">
          <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Assign compensation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldGroup className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>Employee</FieldLabel>
                    <Select value={employeeId} onValueChange={setEmployeeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.displayName} ({employee.employeeNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Payroll group</FieldLabel>
                    <Select value={payrollGroupId} onValueChange={setPayrollGroupId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payroll group" />
                      </SelectTrigger>
                      <SelectContent>
                        {payrollGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name} ({frequencyLabel(group.payFrequency)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Pay type</FieldLabel>
                    <Select value={payType} onValueChange={setPayType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pay type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={String(PayType.MONTHLY)}>Monthly</SelectItem>
                        <SelectItem value={String(PayType.DAILY)}>Daily</SelectItem>
                        <SelectItem value={String(PayType.HOURLY)}>Hourly</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Currency</FieldLabel>
                    <Input value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel>Base pay (psw)</FieldLabel>
                    <Input value={basePayPsw} onChange={(e) => setBasePayPsw(e.target.value)} />
                  </Field>
                  <Field>
                    <FieldLabel>Effective from</FieldLabel>
                    <DatePicker
                      date={parseDateInputValue(effectiveFrom)}
                      onDateChange={(value) => setEffectiveFrom(toDateInputValue(value))}
                      placeholder="Select effective date"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Tax profile</FieldLabel>
                    <Select
                      value={taxProfileId || '__none__'}
                      onValueChange={(value) => setTaxProfileId(value === '__none__' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No statutory profile" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No statutory profile</SelectItem>
                        {taxProfiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>

                {employeeCompensation ? (
                  <div className="rounded-md border p-3 text-sm">
                    <div className="font-medium">Current active compensation</div>
                    <div>
                      {employeeCompensation.payrollGroupName} | Base{' '}
                      {employeeCompensation.basePayPsw} {employeeCompensation.currencyCode}
                    </div>
                    <div>
                      Tax profile:{' '}
                      {taxProfiles.find(
                        (profile) => profile.id === employeeCompensation.taxProfileId,
                      )?.name ?? 'None'}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-lg border p-4">
                  <div className="mb-3 text-sm font-medium">Compensation items</div>
                  <div className="grid gap-3 md:grid-cols-5">
                    <Select
                      value={String(newItem.itemType)}
                      onValueChange={(value) =>
                        setNewItem((current) => ({
                          ...current,
                          itemType: Number(value),
                          typeId: '',
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={String(PayrollItemType.EARNING)}>Earning</SelectItem>
                        <SelectItem value={String(PayrollItemType.DEDUCTION)}>Deduction</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={newItem.typeId}
                      onValueChange={(value) =>
                        setNewItem((current) => ({ ...current, typeId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {(newItem.itemType === PayrollItemType.DEDUCTION
                          ? deductionTypes
                          : earningTypes
                        ).map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.code} · {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={String(newItem.calculationType)}
                      onValueChange={(value) =>
                        setNewItem((current) => ({ ...current, calculationType: Number(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Calculation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={String(CompensationItemCalculationType.FIXED)}>
                          Fixed amount
                        </SelectItem>
                        <SelectItem value={String(CompensationItemCalculationType.PERCENTAGE)}>
                          Percentage
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={
                        newItem.calculationType === CompensationItemCalculationType.PERCENTAGE
                          ? 'Percent'
                          : 'Amount psw'
                      }
                      value={newItem.amountPsw}
                      onChange={(e) =>
                        setNewItem((current) => ({ ...current, amountPsw: e.target.value }))
                      }
                    />
                    <Button
                      variant="outline"
                      disabled={!newItem.typeId || !newItem.amountPsw}
                      onClick={() => {
                        setDraftItems((current) => [...current, newItem]);
                        setNewItem({
                          id: crypto.randomUUID(),
                          itemType: PayrollItemType.EARNING,
                          typeId: '',
                          calculationType: CompensationItemCalculationType.FIXED,
                          amountPsw: '',
                          percentageBasis: 'base_pay',
                        });
                      }}
                    >
                      Add item
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {draftItems.length ? (
                      draftItems.map((item) => {
                        const lookup =
                          item.itemType === PayrollItemType.DEDUCTION
                            ? deductionTypes.find((type) => type.id === item.typeId)
                            : earningTypes.find((type) => type.id === item.typeId);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                          >
                            <div>
                              {lookup?.name ?? 'Item'} |{' '}
                              {item.calculationType === CompensationItemCalculationType.PERCENTAGE
                                ? `${item.amountPsw}%`
                                : `${item.amountPsw} psw`}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setDraftItems((current) =>
                                  current.filter((currentItem) => currentItem.id !== item.id),
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No compensation items added yet.
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  disabled={
                    !employeeId ||
                    !payrollGroupId ||
                    !basePayPsw ||
                    !effectiveFrom ||
                    isSavingCompensation
                  }
                  onClick={async () => {
                    await setEmployeeCompensation({
                      employeeId,
                      payrollGroupId,
                      payType: Number(payType),
                      currencyCode: currencyCode.trim() || 'GHS',
                      basePayPsw: Number(basePayPsw),
                      effectiveFrom,
                      taxProfileId: taxProfileId || null,
                      items: draftItems.map((item) => ({
                        itemType: item.itemType,
                        earningTypeId:
                          item.itemType === PayrollItemType.EARNING ? item.typeId : null,
                        deductionTypeId:
                          item.itemType === PayrollItemType.DEDUCTION ? item.typeId : null,
                        calculationType: item.calculationType,
                        amountPsw: Number(item.amountPsw),
                        percentageBasis:
                          item.calculationType === CompensationItemCalculationType.PERCENTAGE
                            ? item.percentageBasis
                            : null,
                        isRecurring: true,
                      })),
                    }).unwrap();
                    setDraftItems([]);
                    setTaxProfileId('');
                  }}
                >
                  Save compensation
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Base pay</TableHead>
                      <TableHead>Effective</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compensationRows.length ? (
                      compensationRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.employeeName}</TableCell>
                          <TableCell>{row.payrollGroupName ?? '-'}</TableCell>
                          <TableCell>
                            {row.basePayPsw} {row.currencyCode}
                          </TableCell>
                          <TableCell>{row.effectiveFrom?.slice(0, 10) ?? '-'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4}>No employee compensation configured.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {employeeCompensation?.items?.length ? (
                  <div className="mt-4 rounded-lg border p-4">
                    <div className="mb-2 text-sm font-medium">Selected employee items</div>
                    <div className="space-y-2 text-sm">
                      {employeeCompensation.items.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span>{itemTypeLabel(item)}</span>
                          <span>
                            {item.calculationType === CompensationItemCalculationType.PERCENTAGE
                              ? `${item.amountPsw}%`
                              : `${item.amountPsw} psw`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

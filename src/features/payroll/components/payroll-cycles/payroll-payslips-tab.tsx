import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useGetPayrollBankExportQuery,
  useListPayslipsQuery,
  type PayrollCycle,
} from '../../api/payroll.api';

function escapeCsv(value: string | number) {
  const text = String(value ?? '');
  return text.includes(',') || text.includes('"') || text.includes('\n')
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}
function downloadCsv(filename: string, rows: string[][]) {
  const blob = new Blob([rows.map((row) => row.map(escapeCsv).join(',')).join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
function money(amount: number) {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(
    Number(amount ?? 0) / 100,
  );
}
function paymentMethod(value?: string | null) {
  return value
    ? value.replaceAll('_', ' ').replace(/\b\w/g, (match) => match.toUpperCase())
    : 'Unspecified';
}

export function PayrollPayslipsTab({
  cycles,
  selectedCycleId,
  onSelectCycle,
}: {
  cycles: PayrollCycle[];
  selectedCycleId: string;
  onSelectCycle: (id: string) => void;
}) {
  const { data, isLoading } = useListPayslipsQuery(
    { payrollCycleId: selectedCycleId, pageSize: 100 },
    { skip: !selectedCycleId },
  );
  const { data: exportData } = useGetPayrollBankExportQuery(selectedCycleId, {
    skip: !selectedCycleId,
  });
  const payslips = data?.data ?? [];
  const exportRows = exportData?.rows ?? [];
  const exportBankCsv = () => {
    const cycle = cycles.find((item) => item.id === selectedCycleId);
    downloadCsv(`${cycle?.name ?? 'payroll'}-bank-export.csv`, [
      [
        'Payslip Number',
        'Employee Number',
        'Employee Name',
        'Payment Method',
        'Bank Name',
        'Account Name',
        'Account Number',
        'Mobile Money Number',
        'Net Pay',
        'Currency',
      ],
      ...exportRows.map((row) => [
        row.payslipNumber ?? '',
        row.employeeNumber,
        row.employeeName,
        paymentMethod(row.paymentMethod),
        row.bankName ?? '',
        row.bankAccountName ?? '',
        row.bankAccountNumber ?? '',
        row.mobileMoneyNumber ?? '',
        String(Number(row.netPayPsw ?? 0) / 100),
        row.currencyCode,
      ]),
    ]);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payslips</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={selectedCycleId}
            onChange={(e) => onSelectCycle(e.target.value)}
          >
            <option value="">Select payroll cycle</option>
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.name}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            disabled={!selectedCycleId || !exportRows.length}
            onClick={exportBankCsv}
          >
            Export bank CSV
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payslip No.</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Net Pay</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!selectedCycleId ? (
              <TableRow>
                <TableCell colSpan={6}>Select a cycle to view generated payslips.</TableCell>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading payslips...</TableCell>
              </TableRow>
            ) : payslips.length ? (
              payslips.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.payslipNumber}</TableCell>
                  <TableCell>{row.employeeName}</TableCell>
                  <TableCell>{money(row.netPayPsw)}</TableCell>
                  <TableCell>{row.issuedAt?.slice(0, 10) ?? '-'}</TableCell>
                  <TableCell>{row.deliveryStatus ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/payroll/payslips/${row.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6}>No payslips generated for this cycle yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

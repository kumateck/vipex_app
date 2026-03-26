import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import {
  PAGE_STYLES,
  createPrintableHtmlDocument,
  getPrintRuntime,
  printViaBrowserPopup,
  printViaDesktop,
} from '@/features/printing';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetPayslipDetailQuery } from '../api/payroll.api';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';

function formatMoneyPsw(amountPsw: number, currencyCode = 'GHS') {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amountPsw ?? 0) / 100);
}

function buildPayslipHtml(input: {
  companyName: string;
  payslipNumber: string;
  employeeName: string;
  employeeNumber: string;
  payrollCycleName: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  paymentDate?: string | null;
  currencyCode: string;
  basePayPsw: number;
  grossPayPsw: number;
  totalDeductionsPsw: number;
  netPayPsw: number;
  items: Array<{
    name: string;
    code: string;
    amount: string;
    itemType: number;
    source?: string | null;
  }>;
}) {
  const bodyHtml = `
    <div>
      <h1>${input.companyName}</h1>
      <h2>Payslip ${input.payslipNumber}</h2>
      <div class="meta">
        <div class="meta-box">
          <strong>Employee</strong><br />
          ${input.employeeName}<br />
          ${input.employeeNumber}
        </div>
        <div class="meta-box">
          <strong>Payroll Period</strong><br />
          ${input.payrollCycleName}<br />
          ${input.periodStart?.slice(0, 10) ?? '-'} to ${input.periodEnd?.slice(0, 10) ?? '-'}<br />
          Payment date: ${input.paymentDate?.slice(0, 10) ?? '-'}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Description</th>
            <th>Source</th>
            <th>Type</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${input.items
            .map(
              (item) => `<tr>
            <td>${item.code}</td>
            <td>${item.name}</td>
            <td>${item.source ?? '-'}</td>
            <td>${item.itemType === 1 ? 'Deduction' : 'Earning'}</td>
            <td>${item.amount}</td>
          </tr>`,
            )
            .join('')}
        </tbody>
      </table>
      <div class="summary">
        <div class="summary-row"><span>Base Pay</span><strong>${formatMoneyPsw(input.basePayPsw, input.currencyCode)}</strong></div>
        <div class="summary-row"><span>Gross Pay</span><strong>${formatMoneyPsw(input.grossPayPsw, input.currencyCode)}</strong></div>
        <div class="summary-row"><span>Total Deductions</span><strong>${formatMoneyPsw(input.totalDeductionsPsw, input.currencyCode)}</strong></div>
        <div class="summary-row"><span>Net Pay</span><strong>${formatMoneyPsw(input.netPayPsw, input.currencyCode)}</strong></div>
      </div>
    </div>
  `;

  return createPrintableHtmlDocument({
    title: input.payslipNumber,
    pageStyle: `
      ${PAGE_STYLES['invoice-a5']}
      body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
      h1, h2, h3 { margin: 0 0 12px; }
      .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
      .meta-box { border: 1px solid #d1d5db; padding: 12px; border-radius: 8px; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; }
      th { background: #f3f4f6; }
      .summary { margin-top: 24px; width: 320px; margin-left: auto; }
      .summary-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e5e7eb; }
    `,
    bodyHtml,
  });
}

export function PayslipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const authUser = useAuthStore((state) => state.user as AuthUser | null);
  const { data, isLoading } = useGetPayslipDetailQuery(id ?? '', { skip: !id });

  const earnings = useMemo(
    () => (data?.items ?? []).filter((item) => item.itemType !== 1),
    [data?.items],
  );
  const deductions = useMemo(
    () => (data?.items ?? []).filter((item) => item.itemType === 1),
    [data?.items],
  );

  if (!id) {
    return <div className="p-4">Payslip not found.</div>;
  }

  if (isLoading || !data) {
    return <div className="p-4">Loading payslip...</div>;
  }

  return (
    <div className="w-full space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Payslip {data.payslipNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {data.employeeName} • {data.payrollCycleName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/payroll/cycles">Back to payroll</Link>
          </Button>
          <Button
            onClick={async () => {
              const html = buildPayslipHtml({
                companyName: authUser?.company?.name ?? 'Company',
                payslipNumber: data.payslipNumber,
                employeeName: data.employeeName,
                employeeNumber: data.employeeNumber,
                payrollCycleName: data.payrollCycleName,
                periodStart: data.periodStart,
                periodEnd: data.periodEnd,
                paymentDate: data.paymentDate,
                currencyCode: data.currencyCode,
                basePayPsw: data.basePayPsw,
                grossPayPsw: data.grossPayPsw,
                totalDeductionsPsw: data.totalDeductionsPsw,
                netPayPsw: data.netPayPsw,
                items: (data.items ?? []).map((item) => ({
                  name: item.name,
                  code: item.code,
                  amount: formatMoneyPsw(item.amountPsw, data.currencyCode),
                  itemType: item.itemType,
                  source: item.source,
                })),
              });

              if (getPrintRuntime() === 'desktop') {
                const result = await printViaDesktop({
                  html,
                  layout: 'invoice-a5',
                  title: data.payslipNumber,
                });
                if (result.ok) return;
              }

              printViaBrowserPopup(html);
            }}
          >
            Print payslip
          </Button>
        </div>
      </div>

      <ScrollableWrapper>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Employee</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div>{data.employeeName}</div>
                <div>{data.employeeNumber}</div>
                <div>{data.departmentName ?? '-'}</div>
                <div>{data.jobTitleName ?? '-'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Payroll Period</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div>{data.payrollCycleName}</div>
                <div>
                  {data.periodStart?.slice(0, 10)} to {data.periodEnd?.slice(0, 10)}
                </div>
                <div>Payment Date: {data.paymentDate?.slice(0, 10) ?? '-'}</div>
                <div>Issued: {data.issuedAt?.slice(0, 10) ?? '-'}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div>Base Pay: {formatMoneyPsw(data.basePayPsw, data.currencyCode)}</div>
                <div>Gross Pay: {formatMoneyPsw(data.grossPayPsw, data.currencyCode)}</div>
                <div>
                  Total Deductions: {formatMoneyPsw(data.totalDeductionsPsw, data.currencyCode)}
                </div>
                <div className="font-semibold">
                  Net Pay: {formatMoneyPsw(data.netPayPsw, data.currencyCode)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.length ? (
                    earnings.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.code}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.source ?? '-'}</TableCell>
                        <TableCell className="text-right">
                          {formatMoneyPsw(item.amountPsw, data.currencyCode)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4}>No earnings found on this payslip.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deductions.length ? (
                    deductions.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.code}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.source ?? '-'}</TableCell>
                        <TableCell className="text-right">
                          {formatMoneyPsw(item.amountPsw, data.currencyCode)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4}>No deductions found on this payslip.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </ScrollableWrapper>
    </div>
  );
}

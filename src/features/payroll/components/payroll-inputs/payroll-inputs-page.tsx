import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useListPayrollCyclesQuery } from '../../api/payroll.api';
import { AddManualAdjustmentDialog } from './add-manual-adjustment-dialog';
import { AddOvertimeDialog } from './add-overtime-dialog';
import { ManualAdjustmentsCard } from './manual-adjustments-card';
import { OvertimeEntriesCard } from './overtime-entries-card';

export function PayrollInputsPage() {
  const [searchParams] = useSearchParams();
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [overtimeDialogOpen, setOvertimeDialogOpen] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const initialCycleId = searchParams.get('cycleId') ?? '';
  const activeCycleId = selectedCycleId || initialCycleId;
  const { data: cyclesData } = useListPayrollCyclesQuery({ pageSize: 100 });
  const cycles = cyclesData?.data ?? [];
  const selectedCycle = useMemo(
    () => cycles.find((cycle) => cycle.id === activeCycleId) ?? null,
    [activeCycleId, cycles],
  );

  return (
    <div className="w-full space-y-4 p-4">
      <ScrollableWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Payroll Inputs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={selectedCycleId}
                onChange={(event) => setSelectedCycleId(event.target.value)}
              >
                <option value="">Select payroll cycle</option>
                {cycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </option>
                ))}
              </select>
              <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                {selectedCycle
                  ? `${selectedCycle.periodStart?.slice(0, 10)} to ${selectedCycle.periodEnd?.slice(0, 10)}`
                  : 'Choose a cycle to manage variable payroll inputs'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overtime" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overtime">Overtime</TabsTrigger>
            <TabsTrigger value="adjustments">Manual adjustments</TabsTrigger>
          </TabsList>
          <TabsContent value="overtime">
            <OvertimeEntriesCard
              payrollCycleId={activeCycleId}
              onAdd={() => setOvertimeDialogOpen(true)}
            />
          </TabsContent>
          <TabsContent value="adjustments">
            <ManualAdjustmentsCard
              payrollCycleId={activeCycleId}
              onAdd={() => setAdjustmentDialogOpen(true)}
            />
          </TabsContent>
        </Tabs>
      </ScrollableWrapper>

      <AddOvertimeDialog
        open={overtimeDialogOpen}
        onOpenChange={setOvertimeDialogOpen}
        payrollCycleId={activeCycleId}
      />
      <AddManualAdjustmentDialog
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        payrollCycleId={activeCycleId}
      />
    </div>
  );
}

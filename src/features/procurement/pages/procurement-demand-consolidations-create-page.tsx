import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ScrollableWrapper from '@/components/ui/scroll-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useConsolidateProcurementDemandsMutation } from '../api/procurement.api';

function parseIds(value: string): string[] {
  return value
    .split(/[,\n]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProcurementDemandConsolidationsCreatePage() {
  const navigate = useNavigate();
  const [demandIdsInput, setDemandIdsInput] = useState('');
  const [sourceRootLocationId, setSourceRootLocationId] = useState('');
  const [targetMainStoreLocationId, setTargetMainStoreLocationId] = useState('');
  const [note, setNote] = useState('');
  const [createConsolidation, { isLoading }] = useConsolidateProcurementDemandsMutation();

  const onSubmit = async () => {
    const demandIds = parseIds(demandIdsInput);
    if (!demandIds.length) {
      toast.error('Provide at least one demand id');
      return;
    }

    try {
      const result = await createConsolidation({
        demandIds,
        sourceRootLocationId: sourceRootLocationId.trim() || null,
        targetMainStoreLocationId: targetMainStoreLocationId.trim() || null,
        note: note.trim() || null,
      }).unwrap();
      toast.success(`Consolidation ${result.consolidationNo} created.`);
      navigate('/procurement/demands/consolidations');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create consolidation');
    }
  };

  return (
    <ScrollableWrapper>
      <div className="w-full p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Demand Consolidation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Demand IDs (comma or newline separated)"
              value={demandIdsInput}
              onChange={(event) => setDemandIdsInput(event.target.value)}
            />
            <Input
              placeholder="Source root location id (optional)"
              value={sourceRootLocationId}
              onChange={(event) => setSourceRootLocationId(event.target.value)}
            />
            <Input
              placeholder="Target main store location id (optional)"
              value={targetMainStoreLocationId}
              onChange={(event) => setTargetMainStoreLocationId(event.target.value)}
            />
            <Textarea
              placeholder="Note (optional)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <Button onClick={onSubmit} disabled={isLoading}>
              Create consolidation
            </Button>
          </CardContent>
        </Card>
      </div>
    </ScrollableWrapper>
  );
}

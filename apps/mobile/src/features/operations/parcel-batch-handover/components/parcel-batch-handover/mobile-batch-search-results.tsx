import { Text } from 'react-native';
import { AppButton } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { MAX_BATCH_PARCELS } from '@/shared/shipments/parcel-batch-handover';
import type { useMobileBatchHandover } from '../../hooks';
import { MobileBatchParcelRow } from './mobile-batch-parcel-row';

export function MobileBatchSearchResults({
  flow,
}: {
  flow: ReturnType<typeof useMobileBatchHandover>;
}) {
  const { theme } = useAppearance();
  return (
    <>
      {flow.page ? (
        <Text style={{ color: theme.colors.textMuted }}>
          {flow.page.rows.length
            ? `Results for ${flow.telephone}`
            : `No matching parcels found so far for ${flow.telephone}.`}
        </Text>
      ) : null}
      {flow.page?.rows.map((row) => {
        const checked = flow.selectedIds.has(row.id);
        return (
          <MobileBatchParcelRow
            key={row.id}
            row={row}
            checked={checked}
            disabled={flow.busy || (!checked && flow.selected.length >= MAX_BATCH_PARCELS)}
            toggle={flow.toggle}
          />
        );
      })}
      {flow.page?.next ? (
        <AppButton
          title="Load more parcels"
          variant="secondary"
          disabled={flow.busy}
          onPress={() => void flow.search(true)}
        />
      ) : null}
    </>
  );
}

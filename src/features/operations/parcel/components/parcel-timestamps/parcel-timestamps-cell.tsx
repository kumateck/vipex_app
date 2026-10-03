import { formatParcelTimestamp } from '../../utils/format-parcel-timestamp';

type ParcelTimestampsCellProps = {
  createdAt: string | null | undefined;
  receivedAt: string | null | undefined;
};

export function ParcelTimestampsCell({ createdAt, receivedAt }: ParcelTimestampsCellProps) {
  return (
    <div className="space-y-1 whitespace-nowrap text-sm">
      <div>
        <span className="text-muted-foreground">Created:</span> {formatParcelTimestamp(createdAt)}
      </div>
      <div>
        <span className="text-muted-foreground">Received:</span> {formatParcelTimestamp(receivedAt)}
      </div>
    </div>
  );
}

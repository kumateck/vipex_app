import { formatParcelTimestamp } from '../../utils/format-parcel-timestamp';

type ParcelTimestampsCellProps = {
  createdAt: string | null | undefined;
  receivedAt: string | null | undefined;
  deliveredAt?: string | null;
};

export function ParcelTimestampsCell({
  createdAt,
  receivedAt,
  deliveredAt,
}: ParcelTimestampsCellProps) {
  return (
    <div className="space-y-1 whitespace-nowrap text-sm">
      <div>
        <span className="text-muted-foreground">Created:</span> {formatParcelTimestamp(createdAt)}
      </div>
      <div>
        <span className="text-muted-foreground">Received:</span> {formatParcelTimestamp(receivedAt)}
      </div>
      {deliveredAt ? (
        <div>
          <span className="text-muted-foreground">Delivered:</span>{' '}
          {formatParcelTimestamp(deliveredAt)}
        </div>
      ) : null}
    </div>
  );
}

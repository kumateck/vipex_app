import { PermissionGuard } from '@/components/permissions/permission-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { PermissionKeys } from '@/shared/permissions/constants';

type StockRequestRejectCardProps = {
  rejectionReason: string;
  onRejectionReasonChange: (value: string) => void;
  onReject: () => void;
  isRejectingRequest: boolean;
};

export function StockRequestRejectCard({
  rejectionReason,
  onRejectionReasonChange,
  onReject,
  isRejectingRequest,
}: StockRequestRejectCardProps) {
  return (
    <PermissionGuard permissionKey={PermissionKeys.CanRejectStockRequest}>
      <Card>
        <CardHeader>
          <CardTitle>Reject request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field>
            <FieldLabel htmlFor="rejectionReason">Reason (optional)</FieldLabel>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(event) => onRejectionReasonChange(event.target.value)}
              placeholder="Add rejection reason"
            />
          </Field>
          <Button variant="destructive" onClick={onReject} disabled={isRejectingRequest}>
            {isRejectingRequest ? <Spinner /> : null}
            Reject
          </Button>
        </CardContent>
      </Card>
    </PermissionGuard>
  );
}

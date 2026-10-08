import { Link } from 'react-router-dom';
import { useShelfPickupReassignmentAccess } from '../hooks';
import { Button } from '@/components/ui/button';
import { shelfPickupReassignmentLink } from '../utils';

export function ShelfPickupReassignmentLink({
  bookingCode,
  disabled,
}: {
  bookingCode: string;
  disabled?: boolean;
}) {
  const canReassign = useShelfPickupReassignmentAccess();
  if (!canReassign) return null;
  return (
    <Button type="button" variant="outline" size="sm" disabled={disabled} asChild={!disabled}>
      {disabled ? (
        <span>Reassign Shelf Pickup</span>
      ) : (
        <Link to={shelfPickupReassignmentLink(bookingCode)}>Reassign Shelf Pickup</Link>
      )}
    </Button>
  );
}

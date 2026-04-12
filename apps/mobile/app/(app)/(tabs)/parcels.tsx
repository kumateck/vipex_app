import RiderScreen from '../rider';
import SuperSearchScreen from '../super-search';
import { useAuth } from '@mobile/providers/auth-provider';
import { canViewRiderScreen } from '@mobile/lib/permissions';
import { UserType } from '@mobile/constants/user-types';

export default function ParcelsTabScreen() {
  const { session } = useAuth();
  const permissions = session.user?.permissions ?? [];
  const isRider = session.user?.userType === UserType.RIDER;

  if (isRider || canViewRiderScreen(permissions)) {
    return <RiderScreen />;
  }

  return <SuperSearchScreen />;
}

import RiderScreen from '../rider';
import SuperSearchScreen from '../super-search';
import { useAuth } from '@mobile/providers/auth-provider';
import { canViewRiderScreen } from '@mobile/lib/permissions';
import { UserType } from '@mobile/constants/user-types';

export default function ParcelsTabScreen() {
  const { session } = useAuth();
  const permissions = session.user?.permissions ?? [];
  const userTypeRaw = session.user?.userType;
  const normalizedUserType =
    typeof userTypeRaw === 'number'
      ? userTypeRaw
      : typeof userTypeRaw === 'string'
        ? Number.parseInt(userTypeRaw, 10)
        : null;
  const roleName = session.user?.role?.name?.toLowerCase() ?? '';
  const isRider = normalizedUserType === UserType.RIDER || roleName.includes('rider');

  if (isRider || canViewRiderScreen(permissions)) {
    return <RiderScreen />;
  }

  return <SuperSearchScreen />;
}

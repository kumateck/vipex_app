import { Link } from 'expo-router';
import { Button, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/components/screen';
import { canUseQueueModule, canUseRiderModule, canUseTransitReceiveScan } from '@/lib/permissions';
import { useAuth } from '@/providers/auth-provider';

export default function MobileHomeScreen() {
  const { session, logout } = useAuth();
  const permissions = session.user?.permissions ?? [];
  const branchContact =
    session.user?.branch?.telephone?.trim() || session.user?.branch?.phone?.trim() || '-';
  const branchLocation =
    session.user?.location?.name?.trim() ||
    session.user?.branch?.location?.trim() ||
    session.user?.branch?.address?.trim() ||
    '-';

  const canQueue = canUseQueueModule(permissions);
  const canRider = canUseRiderModule(permissions);
  const canReceive = canUseTransitReceiveScan(permissions);

  return (
    <AppScreen>
      <Text style={styles.title}>
        Welcome, {session.user?.fullname ?? session.user?.email ?? 'User'}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile</Text>
        <Text style={styles.metaRow}>Full Name: {session.user?.fullname ?? '-'}</Text>
        <Text style={styles.metaRow}>Email: {session.user?.email ?? '-'}</Text>
        <Text style={styles.metaRow}>Role: {session.user?.role?.name ?? '-'}</Text>
        <Text style={styles.metaRow}>Company: {session.user?.company?.name ?? '-'}</Text>
        <Text style={styles.metaRow}>Branch: {session.user?.branch?.name ?? '-'}</Text>
        <Text style={styles.metaRow}>Branch Location: {branchLocation}</Text>
        <Text style={styles.metaRow}>Branch Contact: {branchContact}</Text>
        <Text style={styles.metaRow}>Permissions: {permissions.length}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Operations</Text>
        {canQueue ? (
          <Link href="/(app)/queue">
            <Text>Queue Creation</Text>
          </Link>
        ) : (
          <Text style={styles.disabled}>Queue module unavailable for your permissions.</Text>
        )}
        {canRider ? (
          <Link href="/(app)/rider">
            <Text>Rider Operations</Text>
          </Link>
        ) : (
          <Text style={styles.disabled}>Rider module unavailable for your permissions.</Text>
        )}
        {canReceive ? (
          <Link href="/(app)/receive">
            <Text>Scan To Receive (In Transit)</Text>
          </Link>
        ) : (
          <Text style={styles.disabled}>
            Transit receive scan unavailable for your permissions.
          </Text>
        )}
      </View>

      <Link href="/(app)/change-password">
        <Text>Change password</Text>
      </Link>
      <Button title="Logout" onPress={() => void logout()} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700' },
  metaRow: { color: '#475467' },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e7ec',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  cardTitle: { fontWeight: '700', fontSize: 16 },
  disabled: { color: '#667085' },
});

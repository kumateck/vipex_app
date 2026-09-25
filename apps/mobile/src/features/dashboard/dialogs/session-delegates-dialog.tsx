import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppSelectField } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing } from '@mobile/theme/layout';
import { useSessionDelegates } from '../hooks/use-session-delegates';

export function SessionDelegatesDialog({
  visible,
  sessionId,
  onClose,
}: {
  visible: boolean;
  sessionId: string;
  onClose: () => void;
}) {
  const { theme } = useAppearance();
  const delegates = useSessionDelegates(sessionId, visible);
  const assigned = new Set(delegates.data.assigned.map((person) => person.userId));
  const options = delegates.data.eligible
    .filter((person) => !assigned.has(person.id))
    .map((person) => ({ value: person.id, label: `${person.fullname} · ${person.email}` }));
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.bgElevated }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>To-be-paid delegates</Text>
          <Text style={{ color: theme.colors.textSubtle }}>
            Staff can complete receiver-paid parcels in your session until removed or your session
            closes.
          </Text>
          <AppSelectField
            label="Add staff member"
            value={delegates.selectedId}
            options={options}
            onValueChange={delegates.setSelectedId}
            placeholder="Choose staff"
          />
          <AppButton
            title="Add delegate"
            onPress={() => void delegates.add()}
            disabled={!delegates.selectedId || delegates.busy}
          />
          {delegates.error ? (
            <Text style={{ color: theme.colors.text }}>{delegates.error}</Text>
          ) : null}
          <ScrollView style={styles.list}>
            {delegates.data.assigned.length === 0 ? (
              <Text style={{ color: theme.colors.textMuted }}>No delegates assigned.</Text>
            ) : null}
            {delegates.data.assigned.map((person) => (
              <View key={person.userId} style={styles.person}>
                <Text style={[styles.personName, { color: theme.colors.text }]}>
                  {person.fullname}
                </Text>
                <AppButton
                  title="Remove"
                  variant="secondary"
                  disabled={delegates.busy}
                  onPress={() => void delegates.remove(person.userId)}
                />
              </View>
            ))}
          </ScrollView>
          <AppButton title="Done" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#0009',
    padding: mobileSpacing.lg,
  },
  sheet: { borderRadius: mobileRadius.lg, padding: mobileSpacing.lg, gap: mobileSpacing.md },
  title: { fontSize: 20, fontWeight: '700' },
  list: { maxHeight: 260 },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 6,
  },
  personName: { flex: 1 },
});

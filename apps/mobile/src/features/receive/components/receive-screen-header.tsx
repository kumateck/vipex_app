import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTypography } from '@mobile/theme/layout';

export type ReceiveMode = 'scan' | 'manual';

type ReceiveScreenHeaderProps = {
  mode: ReceiveMode;
  onChangeMode: (mode: ReceiveMode) => void;
  branchName?: string | null;
};

export function ReceiveScreenHeader({ mode, onChangeMode, branchName }: ReceiveScreenHeaderProps) {
  const { theme } = useAppearance();
  const navigation = useNavigation();

  return (
    <View style={styles.topRow}>
      <View style={styles.titleWrap}>
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={styles.menuButton}
            accessibilityRole="button"
            accessibilityLabel="Open side menu"
          >
            <Ionicons name="menu-outline" size={22} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.pageTitle, { color: theme.colors.text }]}>Parcel Scanner</Text>
        </View>
        <Text style={[styles.pageSubtitle, { color: theme.colors.textSubtle }]}>
          Mark as received • {branchName ?? '-'}
        </Text>
      </View>
      <View style={styles.modeTabs}>
        <ReceiveModeButton
          active={mode === 'scan'}
          icon="qr-code-outline"
          label="Scan"
          onPress={() => onChangeMode('scan')}
        />
        <ReceiveModeButton
          active={mode === 'manual'}
          icon="search-outline"
          label="Manual"
          onPress={() => onChangeMode('manual')}
        />
      </View>
    </View>
  );
}

function ReceiveModeButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  const { theme } = useAppearance();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.modeTabButton,
        {
          borderColor: active ? theme.colors.primary : theme.colors.border,
          backgroundColor: active ? theme.colors.primary : theme.colors.card,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={16}
        color={active ? theme.colors.primaryText : theme.colors.textMuted}
      />
      <Text
        style={[
          styles.modeTabLabel,
          { color: active ? theme.colors.primaryText : theme.colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: mobileSpacing.sm,
  },
  titleWrap: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuButton: { paddingHorizontal: 4, paddingVertical: 2 },
  pageTitle: { fontSize: mobileTypography.title, fontWeight: '800' },
  pageSubtitle: { fontSize: mobileTypography.subtitle, lineHeight: 20 },
  modeTabs: { flexDirection: 'row', gap: 6 },
  modeTabButton: {
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  modeTabLabel: { fontSize: 11, fontWeight: '700' },
});

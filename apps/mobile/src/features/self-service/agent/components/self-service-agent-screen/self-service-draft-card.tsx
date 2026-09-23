import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard, AppStatusChip } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { SelfServiceDraft } from '../../types';

type Props = { draft: SelfServiceDraft; disabled: boolean; opening: boolean; onPress: () => void };

export function SelfServiceDraftCard({ draft, disabled, opening, onPress }: Props) {
  const { theme } = useAppearance();
  return (
    <Pressable disabled={disabled} onPress={onPress} style={disabled ? styles.disabled : undefined}>
      <AppCard>
        <View style={styles.row}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{draft.parcelContent}</Text>
          <AppStatusChip label={opening ? 'Opening…' : draft.claimedBy ? 'Claimed' : 'Available'} />
        </View>
        <Text style={[styles.text, { color: theme.colors.textMuted }]}>
          Sender: {draft.senderFullname} · {draft.senderPhone}
        </Text>
        <Text style={[styles.text, { color: theme.colors.textMuted }]}>
          Receiver: {draft.receiverFullname} · {draft.receiverPhone}
        </Text>
        <Text style={[styles.text, { color: theme.colors.textMuted }]}>
          Declared value: GHS {(draft.parcelValuePsw / 100).toFixed(2)}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textSubtle }]}>
          Submitted {new Date(draft.createdAt).toLocaleString()}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textSubtle }]}>
          Expires {new Date(draft.expiresAt).toLocaleString()}
        </Text>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: mobileSpacing.sm },
  title: { ...mobileTextStyles.headline, flex: 1 },
  text: { ...mobileTextStyles.subhead },
  meta: { ...mobileTextStyles.caption1 },
  disabled: { opacity: 0.65 },
});

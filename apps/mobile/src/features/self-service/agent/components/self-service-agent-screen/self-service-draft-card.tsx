import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard, AppStatusChip } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import type { SelfServiceDraft } from '../../types';

type Props = { draft: SelfServiceDraft; onPress: () => void };

export function SelfServiceDraftCard({ draft, onPress }: Props) {
  const { theme } = useAppearance();
  return (
    <Pressable onPress={onPress}>
      <AppCard>
        <View style={styles.row}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{draft.parcelContent}</Text>
          <AppStatusChip label={draft.claimedBy ? 'Claimed' : 'Available'} />
        </View>
        <Text style={[styles.text, { color: theme.colors.textMuted }]}>
          Sender: {draft.senderFullname} · {draft.senderPhone}
        </Text>
        <Text style={[styles.text, { color: theme.colors.textMuted }]}>
          Receiver: {draft.receiverFullname} · {draft.receiverPhone}
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
});

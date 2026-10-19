import { Pressable, Text, View } from 'react-native';
import { AppLabel } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { useDeliveryHandoverForm } from '../../hooks';

export function RiderThirdPartyFields({
  receiver,
  disabled,
}: {
  receiver: ReturnType<typeof useDeliveryHandoverForm>['receiver'];
  disabled: boolean;
}) {
  const { theme } = useAppearance();
  return (
    <View style={{ gap: 10 }}>
      <AppLabel>Who is receiving the parcel?</AppLabel>
      {(['main', 'second'] as const).map((target) => {
        const unavailable = target === 'second' && !receiver.hasSecondReceiver;
        const selected = receiver.target === target;
        return (
          <Pressable
            key={target}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled: disabled || unavailable }}
            disabled={disabled || unavailable}
            onPress={() => receiver.setTarget(target)}
            style={{
              padding: 12,
              borderWidth: 1,
              borderRadius: 8,
              borderColor: selected ? theme.colors.primary : theme.colors.textMuted,
              opacity: unavailable ? 0.5 : 1,
            }}
          >
            <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
              {target === 'main'
                ? `Main receiver: ${receiver.mainName}`
                : `Second receiver: ${receiver.secondName}`}
            </Text>
            <Text style={{ color: theme.colors.textMuted }}>
              {target === 'main' ? receiver.mainPhone : receiver.secondPhone}
            </Text>
          </Pressable>
        );
      })}
      <Text style={{ color: theme.colors.textMuted }}>
        {receiver.hasSecondReceiver
          ? 'Ask the selected receiver to sign below.'
          : 'For third-party delivery, ask the delivery cashier to add a second receiver, then refresh.'}
      </Text>
      {receiver.error ? <Text style={{ color: theme.colors.danger }}>{receiver.error}</Text> : null}
    </View>
  );
}

import { useState } from 'react';
import { Keyboard, Text } from 'react-native';
import { AppButton, AppCard } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { PickupSignatureDialog } from '../../dialogs';
import { pickupStyles } from './office-pickup.styles';

type Props = {
  collector: string;
  signed: boolean;
  disabled: boolean;
  onSign: (image: string) => void;
};

export function PickupSignatureSection({ collector, signed, disabled, onSign }: Props) {
  const { theme } = useAppearance();
  const [signing, setSigning] = useState(false);
  return (
    <>
      <AppCard>
        <Text style={[pickupStyles.title, { color: theme.colors.text }]}>
          {collector} signature
        </Text>
        <Text style={[pickupStyles.hint, { color: theme.colors.textMuted }]}>
          {signed ? 'Signature captured' : 'Ask the collector to sign before handover.'}
        </Text>
        <AppButton
          title={signed ? 'Sign again' : 'Capture signature'}
          variant="secondary"
          disabled={disabled}
          onPress={() => {
            Keyboard.dismiss();
            setSigning(true);
          }}
        />
      </AppCard>
      {signing ? (
        <PickupSignatureDialog
          collector={collector}
          onClose={() => setSigning(false)}
          onSave={(image) => {
            onSign(image);
            setSigning(false);
          }}
        />
      ) : null}
    </>
  );
}

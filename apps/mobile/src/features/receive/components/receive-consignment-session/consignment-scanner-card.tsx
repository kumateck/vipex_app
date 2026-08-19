import { StyleSheet, Text } from 'react-native';
import { ScannerView } from '@mobile/components/courier';
import { AppButton, AppCard, AppInput, AppLabel } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileTextStyles } from '@mobile/theme/layout';

type ConsignmentScannerCardProps = {
  manualCode: string;
  scanBusy: boolean;
  onChangeManualCode: (value: string) => void;
  onReceive: (code: string) => void;
};

export function ConsignmentScannerCard({
  manualCode,
  scanBusy,
  onChangeManualCode,
  onReceive,
}: ConsignmentScannerCardProps) {
  const { theme } = useAppearance();
  const submit = () => {
    const code = manualCode.trim();
    if (!code) return;
    onChangeManualCode('');
    onReceive(code);
  };

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>Scanner</Text>
      <ScannerView onCodeScanned={onReceive} />
      {scanBusy ? (
        <Text style={[styles.helper, { color: theme.colors.textSubtle }]}>Processing scan...</Text>
      ) : null}
      <AppLabel>Or type tracking / booking code</AppLabel>
      <AppInput
        value={manualCode}
        onChangeText={onChangeManualCode}
        placeholder="Tracking or booking code"
        autoCapitalize="characters"
      />
      <AppButton
        title="Receive"
        onPress={submit}
        disabled={scanBusy || manualCode.trim().length === 0}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: { ...mobileTextStyles.headline },
  helper: { ...mobileTextStyles.subhead },
});

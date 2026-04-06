import { StyleSheet, Text, View } from 'react-native';
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { AppButton } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing } from '@mobile/theme/layout';

type ScannerViewProps = {
  onCodeScanned: (code: string) => void;
};

export function ScannerView({ onCodeScanned }: ScannerViewProps) {
  const { theme } = useAppearance();
  const [permission, requestPermission] = useCameraPermissions();

  const onScan = (result: BarcodeScanningResult) => {
    const value = result.data?.trim();
    if (!value) return;
    onCodeScanned(value);
  };

  return (
    <View>
      {!permission?.granted ? (
        <AppButton title="Enable Camera Access" onPress={() => void requestPermission()} />
      ) : (
        <View style={[styles.cameraWrap, { borderColor: theme.colors.border }]}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={onScan}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
        </View>
      )}
      <Text style={{ color: theme.colors.textSubtle }}>Scan booking QR code to continue.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraWrap: {
    borderWidth: 1,
    borderRadius: mobileRadius.lg,
    overflow: 'hidden',
    height: 240,
    marginBottom: mobileSpacing.sm,
  },
  camera: { flex: 1 },
});

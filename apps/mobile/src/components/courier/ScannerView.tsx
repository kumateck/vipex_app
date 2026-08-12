import { StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { AppButton } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing } from '@mobile/theme/layout';
import { useLockedCodeScanner } from './use-locked-code-scanner';

type ScannerViewProps = {
  onCodeScanned: (code: string) => void | Promise<void>;
};

export function ScannerView({ onCodeScanned }: ScannerViewProps) {
  const { theme } = useAppearance();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const codeScanner = useLockedCodeScanner(onCodeScanned);

  return (
    <View>
      {!hasPermission ? (
        <AppButton title="Enable Camera Access" onPress={() => void requestPermission()} />
      ) : device ? (
        <View style={[styles.cameraWrap, { borderColor: theme.colors.border }]}>
          <Camera style={styles.camera} device={device} isActive codeScanner={codeScanner} />
          <View
            pointerEvents="none"
            style={[
              styles.scanFrame,
              { borderColor: theme.colors.primary, backgroundColor: 'transparent' },
            ]}
          />
        </View>
      ) : null}
      <Text style={{ color: theme.colors.textSubtle }}>Align QR code inside frame to scan.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraWrap: {
    borderWidth: 1,
    borderRadius: mobileRadius.lg,
    overflow: 'hidden',
    height: 360,
    marginBottom: mobileSpacing.sm,
  },
  camera: { flex: 1 },
  scanFrame: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    top: '12%',
    bottom: '12%',
    borderWidth: 2,
    borderRadius: 18,
    borderStyle: 'dashed',
  },
});

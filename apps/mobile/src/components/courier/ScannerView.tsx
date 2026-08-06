import { StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  type Code,
} from 'react-native-vision-camera';
import { AppButton } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing } from '@mobile/theme/layout';

type ScannerViewProps = {
  onCodeScanned: (code: string) => void;
};

export function ScannerView({ onCodeScanned }: ScannerViewProps) {
  const { theme } = useAppearance();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const onScan = (codes: Code[]) => {
    const value = codes[0]?.value?.trim();
    if (!value) return;
    onCodeScanned(value);
  };

  return (
    <View>
      {!hasPermission ? (
        <AppButton title="Enable Camera Access" onPress={() => void requestPermission()} />
      ) : device ? (
        <View style={[styles.cameraWrap, { borderColor: theme.colors.border }]}>
          <Camera
            style={styles.camera}
            device={device}
            isActive
            codeScanner={{ codeTypes: ['qr'], onCodeScanned: onScan }}
          />
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
    height: 240,
    marginBottom: mobileSpacing.sm,
  },
  camera: { flex: 1 },
  scanFrame: {
    position: 'absolute',
    left: '16%',
    right: '16%',
    top: '18%',
    bottom: '18%',
    borderWidth: 2,
    borderRadius: 18,
    borderStyle: 'dashed',
  },
});

import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { AppButton } from '@mobile/components/ui';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing } from '@mobile/theme/layout';
import { useLockedCodeScanner } from './use-locked-code-scanner';

type ScannerViewProps = {
  onCodeScanned: (code: string) => void | Promise<void>;
  processing?: boolean;
};

export function ScannerView({ onCodeScanned, processing = false }: ScannerViewProps) {
  const { theme } = useAppearance();
  const isFocused = useIsFocused();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const codeScanner = useLockedCodeScanner(onCodeScanned);
  const scanProgress = useSharedValue(0);
  const [cameraError, setCameraError] = useState(false);
  const [cameraRetryKey, setCameraRetryKey] = useState(0);
  const [torchEnabled, setTorchEnabled] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setCameraError(false);
      setTorchEnabled(false);
    }, []),
  );

  const restartCamera = useCallback(() => {
    setCameraError(false);
    setCameraRetryKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!hasPermission || !device || !isFocused || processing || cameraError) {
      scanProgress.value = 0;
      return;
    }

    scanProgress.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(scanProgress);
  }, [cameraError, device, hasPermission, isFocused, processing, scanProgress]);

  const scanLineTransform = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: scanProgress.value * 230,
      },
    ],
  }));

  return (
    <View>
      {!hasPermission ? (
        <AppButton title="Enable Camera Access" onPress={() => void requestPermission()} />
      ) : device && isFocused ? (
        <View style={[styles.cameraWrap, { borderColor: theme.colors.border }]}>
          <Camera
            key={cameraRetryKey}
            style={styles.camera}
            device={device}
            isActive={!processing}
            codeScanner={codeScanner}
            torch={torchEnabled ? 'on' : 'off'}
            zoom={device.neutralZoom}
            enableZoomGesture
            onError={() => setCameraError(true)}
          />
          {!cameraError ? (
            <>
              <View
                pointerEvents="none"
                style={[
                  styles.scanFrame,
                  { borderColor: theme.colors.primary, backgroundColor: 'transparent' },
                ]}
              />
              <Animated.View pointerEvents="none" style={[styles.scanBand, scanLineTransform]}>
                <View style={[styles.scanLine, { backgroundColor: theme.colors.primary }]} />
              </Animated.View>
              {device.hasTorch ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    torchEnabled ? 'Turn scanner light off' : 'Turn scanner light on'
                  }
                  onPress={() => setTorchEnabled((enabled) => !enabled)}
                  style={({ pressed }) => [styles.torchButton, { opacity: pressed ? 0.72 : 1 }]}
                >
                  <Ionicons
                    name={torchEnabled ? 'flash' : 'flash-outline'}
                    size={18}
                    color="#ffffff"
                  />
                  <Text style={styles.torchButtonText}>{torchEnabled ? 'Light on' : 'Light'}</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}
          {processing && !cameraError ? (
            <View
              style={styles.processingOverlay}
              accessibilityRole="progressbar"
              accessibilityLiveRegion="assertive"
            >
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.processingTitle}>QR detected</Text>
              <Text style={styles.processingText}>Finding incoming parcel…</Text>
            </View>
          ) : null}
          {cameraError ? (
            <View style={styles.processingOverlay} accessibilityLiveRegion="assertive">
              <Text style={styles.processingTitle}>Camera session stopped</Text>
              <Text style={styles.processingText}>Restart the camera to continue scanning.</Text>
              <AppButton title="Restart Camera" onPress={restartCamera} />
            </View>
          ) : null}
        </View>
      ) : null}
      {hasPermission && device && isFocused && !processing && !cameraError ? (
        <View style={styles.scannerStatus} accessibilityLiveRegion="polite">
          <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
          <Text style={{ color: theme.colors.textSubtle }}>
            Scanner active — looking for a QR code
          </Text>
        </View>
      ) : null}
      <Text style={{ color: theme.colors.textSubtle }}>
        Align the QR inside the frame. For dark labels, avoid plastic glare and use Light if needed.
      </Text>
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
  scanBand: {
    position: 'absolute',
    left: '14%',
    right: '14%',
    top: '14%',
    height: 34,
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
  },
  scanLine: { height: 5, borderRadius: 3 },
  torchButton: {
    position: 'absolute',
    top: mobileSpacing.sm,
    right: mobileSpacing.sm,
    minHeight: 40,
    paddingHorizontal: mobileSpacing.sm,
    borderRadius: mobileRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  torchButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  scannerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.xs,
    marginBottom: mobileSpacing.xs,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: mobileSpacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.74)',
  },
  processingTitle: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  processingText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});

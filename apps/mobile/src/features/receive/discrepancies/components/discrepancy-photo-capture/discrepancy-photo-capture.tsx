import { getMobileErrorMessage } from '@mobile/lib/mobile-error-message';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppButton, AppCard } from '@mobile/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { notifyError } from '@mobile/lib/notify';
import { photoFileToDataUrl } from '../../utils';
import type { DiscrepancyPhoto } from '../../types';

type Props = { value: DiscrepancyPhoto | null; onChange: (photo: DiscrepancyPhoto | null) => void };

export function DiscrepancyPhotoCapture({ value, onChange }: Props) {
  const { theme } = useAppearance();
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const permission = useCameraPermission();
  const [active, setActive] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const openCamera = async () => {
    const granted = permission.hasPermission || (await permission.requestPermission());
    if (!granted)
      return notifyError(
        'Camera permission required',
        'Allow camera access to attach discrepancy evidence.',
      );
    setActive(true);
  };

  const capture = async () => {
    if (!camera.current) return;
    setCapturing(true);
    try {
      const photo = await camera.current.takePhoto();
      onChange({
        path: photo.path,
        dataUrl: await photoFileToDataUrl(photo.path),
        fileName: `discrepancy-${Date.now()}.jpg`,
      });
      setActive(false);
    } catch (error) {
      notifyError('Photo not captured', getMobileErrorMessage(error, '') || 'Try again.');
    } finally {
      setCapturing(false);
    }
  };

  if (active) {
    return (
      <View style={[styles.cameraWrap, { borderColor: theme.colors.border }]}>
        {device ? (
          <Camera ref={camera} style={styles.camera} device={device} isActive photo />
        ) : (
          <ActivityIndicator color={theme.colors.primary} />
        )}
        <View style={styles.controls}>
          <Pressable
            style={[styles.capture, { backgroundColor: theme.colors.primary }]}
            onPress={() => void capture()}
            disabled={capturing}
          >
            {capturing ? (
              <ActivityIndicator color={theme.colors.primaryText} />
            ) : (
              <Ionicons name="camera" size={26} color={theme.colors.primaryText} />
            )}
          </Pressable>
          <AppButton title="Cancel" variant="secondary" onPress={() => setActive(false)} />
        </View>
      </View>
    );
  }

  return (
    <AppCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>Photo evidence</Text>
      <Text style={[styles.text, { color: theme.colors.textMuted }]}>
        {value
          ? `Captured: ${value.fileName}`
          : 'Capture the parcel, label, damage, or receiving area as evidence.'}
      </Text>
      <AppButton
        title={value ? 'Retake photo' : 'Open camera'}
        variant="secondary"
        onPress={() => void openCamera()}
      />
      {value ? (
        <AppButton title="Remove photo" variant="plain" onPress={() => onChange(null)} />
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  cameraWrap: {
    height: 420,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mobileRadius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  camera: { ...StyleSheet.absoluteFillObject },
  controls: {
    position: 'absolute',
    left: mobileSpacing.md,
    right: mobileSpacing.md,
    bottom: mobileSpacing.md,
    gap: mobileSpacing.sm,
    alignItems: 'center',
  },
  capture: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...mobileTextStyles.headline },
  text: { ...mobileTextStyles.subhead },
});

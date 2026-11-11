import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '@mobile/providers/auth-provider';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { PermissionKeys } from '@/shared/permissions/constants';
import { ParcelHandoverNoteDialog } from '../../dialogs';
import type { ParcelHandoverNoteIndicator } from '../../types';

function CriticalIcon({ color }: { color: string }) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (!reduceMotion) opacity.value = withRepeat(withTiming(0.4, { duration: 750 }), -1, true);
    return () => {
      cancelAnimation(opacity);
      opacity.value = 1;
    };
  }, [opacity, reduceMotion]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={style}>
      <Ionicons name="warning-outline" size={18} color={color} />
    </Animated.View>
  );
}

export const ParcelHandoverNoteAction = memo(function ParcelHandoverNoteAction({
  parcelId,
  hasHandoverNote,
  handoverNoteCritical,
  allowEdit = false,
  onSaved,
}: ParcelHandoverNoteIndicator & {
  parcelId: string;
  allowEdit?: boolean;
  onSaved?: () => void;
}) {
  const { theme } = useAppearance();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const canWrite =
    allowEdit &&
    Boolean(session.user?.permissions?.includes(PermissionKeys.CanUpdateParcelHandoverNote));
  if (!hasHandoverNote && !canWrite) return null;
  const color = handoverNoteCritical ? theme.colors.danger : theme.colors.text;
  const label = handoverNoteCritical
    ? 'Critical note'
    : hasHandoverNote
      ? 'Handover note'
      : 'Add handover note';
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.action, { borderColor: color }]}
        onPress={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {handoverNoteCritical ? (
          <CriticalIcon color={color} />
        ) : (
          <Ionicons name="document-text-outline" size={18} color={color} />
        )}
        <Text style={[mobileTextStyles.footnote, { color }]}>{label}</Text>
      </Pressable>
      {open ? (
        <ParcelHandoverNoteDialog
          parcelId={parcelId}
          allowEdit={canWrite}
          adding={!hasHandoverNote}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            onSaved?.();
          }}
        />
      ) : null}
    </>
  );
});

const styles = StyleSheet.create({
  action: {
    minHeight: 44,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: mobileSpacing.xs,
    paddingHorizontal: mobileSpacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mobileRadius.md,
  },
});

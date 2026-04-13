import { useAppearance } from '@mobile/providers/appearance-provider';
import { NotifyVariant, registerNotifyHandler, unregisterNotifyHandler } from '@mobile/lib/notify';
import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AUTO_HIDE_MS = 3600;

type SnackbarState = {
  title: string;
  message: string;
  variant: NotifyVariant;
};

const variantLabel: Record<NotifyVariant, string> = {
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
};

const variantPalette = {
  success: { icon: '✓', background: '#DCFCE7', accent: '#15803D', border: '#86EFAC' },
  warning: { icon: '!', background: '#FEF3C7', accent: '#B45309', border: '#FCD34D' },
  error: { icon: '⨯', background: '#FEE2E2', accent: '#B91C1C', border: '#FCA5A5' },
} as const;

export function SnackbarProvider({ children }: PropsWithChildren) {
  const { theme } = useAppearance();
  const insets = useSafeAreaInsets();
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translateY = useRef(new Animated.Value(72)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const clearHideTimer = useCallback(() => {
    if (!hideTimerRef.current) return;
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  }, []);

  const hideSnackbar = useCallback(() => {
    clearHideTimer();
    Animated.parallel([
      Animated.timing(translateY, { toValue: 72, duration: 180, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        setVisible(false);
        setSnackbar(null);
      }
    });
  }, [clearHideTimer, opacity, translateY]);

  const showSnackbar = useCallback(
    ({ message, title, variant }: { message: string; title?: string; variant: NotifyVariant }) => {
      const trimmedMessage = message.trim();
      if (trimmedMessage.length === 0) return;
      clearHideTimer();
      setSnackbar({
        message: trimmedMessage,
        title: title?.trim() || variantLabel[variant],
        variant,
      });
      setVisible(true);
      translateY.setValue(72);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 18,
          bounciness: 6,
        }),
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start();
      hideTimerRef.current = setTimeout(() => {
        hideSnackbar();
      }, AUTO_HIDE_MS);
    },
    [clearHideTimer, hideSnackbar, opacity, translateY],
  );

  useEffect(() => {
    registerNotifyHandler(showSnackbar);
    return () => {
      unregisterNotifyHandler(showSnackbar);
      clearHideTimer();
    };
  }, [clearHideTimer, showSnackbar]);

  const colors = useMemo(() => {
    if (!snackbar) return null;
    return variantPalette[snackbar.variant];
  }, [snackbar]);

  const showSnackbarView = visible && snackbar && colors;

  return (
    <>
      {children}
      {showSnackbarView ? (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <View
            pointerEvents="box-none"
            style={[
              styles.anchor,
              {
                paddingBottom: Math.max(insets.bottom, 10),
              },
            ]}
          >
            <Animated.View
              style={[
                styles.container,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  shadowColor: colors.accent,
                  transform: [{ translateY }],
                  opacity,
                },
              ]}
            >
              <View style={styles.contentRow}>
                <View style={[styles.iconWrap, { backgroundColor: colors.accent }]}>
                  <Text style={styles.iconText}>{colors.icon}</Text>
                </View>
                <View style={styles.textWrap}>
                  <Text style={[styles.title, { color: colors.accent }]} numberOfLines={1}>
                    {snackbar.title}
                  </Text>
                  <Text style={[styles.message, { color: theme.colors.text }]} numberOfLines={3}>
                    {snackbar.message}
                  </Text>
                </View>
                <Pressable
                  onPress={hideSnackbar}
                  hitSlop={8}
                  style={styles.closeButton}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss notification"
                >
                  <Text style={[styles.closeText, { color: colors.accent }]}>×</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
  },
  container: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  contentRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 10,
  },
  iconText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  textWrap: { flex: 1, gap: 2 },
  title: { fontSize: 13, fontWeight: '800' },
  message: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  closeButton: { paddingLeft: 10, paddingVertical: 2 },
  closeText: { fontSize: 20, fontWeight: '700', lineHeight: 20 },
});

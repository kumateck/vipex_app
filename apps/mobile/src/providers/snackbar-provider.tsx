import { useAppearance } from '@mobile/providers/appearance-provider';
import { registerNotifyHandler, unregisterNotifyHandler } from '@mobile/lib/notify';
import type { NotifyVariant } from '@mobile/lib/notify';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { AppTheme } from '@mobile/theme/tokens';
import { mobileRadius, mobileShadow, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

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

const variantIcon: Record<NotifyVariant, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  warning: 'warning',
  error: 'close-circle',
};

function variantAccent(theme: AppTheme, variant: NotifyVariant) {
  if (variant === 'success') return theme.colors.success;
  if (variant === 'warning') return theme.colors.warning;
  return theme.colors.danger;
}

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

  const accent = useMemo(
    () => (snackbar ? variantAccent(theme, snackbar.variant) : null),
    [snackbar, theme],
  );

  const showSnackbarView = visible && snackbar && accent;

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
                mobileShadow.floating,
                {
                  backgroundColor: theme.colors.bgElevated,
                  borderColor: theme.scheme === 'dark' ? theme.colors.border : 'transparent',
                  borderWidth: theme.scheme === 'dark' ? StyleSheet.hairlineWidth : 0,
                  transform: [{ translateY }],
                  opacity,
                },
              ]}
            >
              <View style={styles.contentRow}>
                <View style={[styles.iconWrap, { backgroundColor: `${accent}1F` }]}>
                  <Ionicons name={variantIcon[snackbar.variant]} size={18} color={accent} />
                </View>
                <View style={styles.textWrap}>
                  <Text style={[styles.title, { color: accent }]} numberOfLines={1}>
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
                  <Ionicons name="close" size={18} color={theme.colors.textSubtle} />
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
    borderRadius: mobileRadius.lg,
    paddingHorizontal: mobileSpacing.md,
    paddingVertical: mobileSpacing.sm + 2,
  },
  contentRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: mobileRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    marginRight: mobileSpacing.sm + 2,
  },
  textWrap: { flex: 1, gap: 2 },
  title: { ...mobileTextStyles.footnote, fontWeight: '700' },
  message: { ...mobileTextStyles.footnote },
  closeButton: { paddingLeft: mobileSpacing.sm, paddingVertical: 2 },
});

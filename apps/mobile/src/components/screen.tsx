import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RefreshControl, ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import type { PropsWithChildren } from 'react';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileSpacing } from '@mobile/theme/layout';

type AppScreenProps = PropsWithChildren<ViewProps> & {
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function AppScreen({
  children,
  style,
  scrollable = true,
  refreshing,
  onRefresh,
  ...rest
}: AppScreenProps) {
  const { theme } = useAppearance();
  const insets = useSafeAreaInsets();
  const content = (
    <View
      style={[
        styles.container,
        {
          paddingBottom: mobileSpacing.xl + insets.bottom,
          backgroundColor: theme.colors.bg,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.colors.bg }]}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={Boolean(refreshing)}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flexGrow: 1 },
  container: {
    flex: 1,
    paddingHorizontal: mobileSpacing.lg,
    paddingTop: mobileSpacing.md,
    gap: mobileSpacing.md,
  },
});

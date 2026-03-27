import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import type { PropsWithChildren } from 'react';

export function AppScreen({ children, style, ...rest }: PropsWithChildren<ViewProps>) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.container, style]} {...rest}>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f7fb' },
  content: { flexGrow: 1 },
  container: { flex: 1, padding: 16, gap: 12 },
});

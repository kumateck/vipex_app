import React, { useEffect } from 'react';
import { Text, type TextProps } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { router } from './navigation-service';

type LinkProps = TextProps & {
  href: string | { pathname?: string; params?: Record<string, unknown> };
  asChild?: boolean;
  children?: React.ReactNode;
};

const NativeStack = createNativeStackNavigator();
const BottomTabs = createBottomTabNavigator();

export { router };

export function useLocalSearchParams<T extends Record<string, unknown>>() {
  const route = useRoute();
  return (route.params ?? {}) as T;
}

export function useRouter() {
  return router;
}

export function Redirect({ href }: { href: LinkProps['href'] }) {
  useEffect(() => {
    router.replace(href);
  }, [href]);
  return null;
}

export function Link({ href, asChild, children, onPress, ...props }: LinkProps) {
  const handlePress: NonNullable<TextProps['onPress']> = (event) => {
    onPress?.(event);
    router.push(href);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onPress: handlePress } as never);
  }

  return (
    <Text {...props} onPress={handlePress}>
      {children}
    </Text>
  );
}

export function Slot() {
  return null;
}

export const Stack = Object.assign(NativeStack.Navigator, { Screen: NativeStack.Screen });
export const Tabs = Object.assign(BottomTabs.Navigator, { Screen: BottomTabs.Screen });

import { useEffect } from 'react';
import {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export function useDashboardMotion() {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    progress.value = reduceMotion
      ? 1
      : withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) });
  }, [progress, reduceMotion]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.35], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [0, 0.4], [12, 0], Extrapolation.CLAMP) },
    ],
  }));

  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.12, 0.68], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [0.12, 0.7], [20, 0], Extrapolation.CLAMP) },
      { scale: interpolate(progress.value, [0.12, 0.65], [0.97, 1], Extrapolation.CLAMP) },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.36, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [0.36, 1], [22, 0], Extrapolation.CLAMP) },
    ],
  }));

  return { headerStyle, heroStyle, contentStyle };
}

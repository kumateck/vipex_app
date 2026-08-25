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

export function useAssignedDeliveriesMotion() {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    progress.value = reduceMotion
      ? 1
      : withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) });
  }, [progress, reduceMotion]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [0, 0.4], [10, 0], Extrapolation.CLAMP) },
    ],
  }));
  const summaryStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.1, 0.75], [0, 1], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(progress.value, [0.1, 0.75], [0.97, 1], Extrapolation.CLAMP) },
    ],
  }));
  const listStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.35, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(progress.value, [0.35, 1], [18, 0], Extrapolation.CLAMP) },
    ],
  }));

  return { headerStyle, summaryStyle, listStyle };
}

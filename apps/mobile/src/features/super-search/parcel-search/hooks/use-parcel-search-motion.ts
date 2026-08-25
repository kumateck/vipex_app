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

export function useParcelSearchMotion(resultKey: string) {
  const reduceMotion = useReducedMotion();
  const intro = useSharedValue(reduceMotion ? 1 : 0);
  const results = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    intro.value = reduceMotion
      ? 1
      : withTiming(1, { duration: 560, easing: Easing.out(Easing.cubic) });
  }, [intro, reduceMotion]);

  useEffect(() => {
    results.value = reduceMotion ? 1 : 0;
    results.value = reduceMotion
      ? 1
      : withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
  }, [reduceMotion, resultKey, results]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(intro.value, [0, 0.55], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(intro.value, [0, 0.6], [16, 0]) }],
  }));
  const formStyle = useAnimatedStyle(() => ({
    opacity: interpolate(intro.value, [0.2, 0.8], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(intro.value, [0.2, 0.85], [22, 0]) }],
  }));
  const resultsStyle = useAnimatedStyle(() => ({
    opacity: results.value,
    transform: [{ translateY: interpolate(results.value, [0, 1], [14, 0]) }],
  }));

  return { headerStyle, formStyle, resultsStyle };
}

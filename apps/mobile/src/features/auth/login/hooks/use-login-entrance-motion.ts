import { useEffect } from 'react';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export function useLoginEntranceMotion() {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    progress.value = reduceMotion
      ? 1
      : withTiming(1, {
          duration: 720,
          easing: Easing.out(Easing.cubic),
        });
  }, [progress, reduceMotion]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.42], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(progress.value, [0, 0.5], [18, 0], Extrapolation.CLAMP),
      },
      {
        scale: interpolate(progress.value, [0, 0.48], [0.96, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.18, 0.72], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(progress.value, [0.18, 0.78], [24, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.52, 1], [0, 1], Extrapolation.CLAMP),
  }));

  return { Animated, footerStyle, formStyle, heroStyle };
}

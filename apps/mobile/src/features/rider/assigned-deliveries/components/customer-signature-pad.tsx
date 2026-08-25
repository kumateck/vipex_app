import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';

type Point = { x: number; y: number };
type Stroke = Point[];

type Props = {
  disabled?: boolean;
  onChange: (signatureImage: string) => void;
};

function toSignatureDataUrl(strokes: Stroke[], width: number, height: number) {
  const pathParts: string[] = [];
  for (const stroke of strokes) {
    if (stroke.length > 1) {
      pathParts.push(`M ${stroke.map((point) => `${point.x} ${point.y}`).join(' L ')}`);
    }
  }
  const paths = pathParts.join(' ');
  if (!paths) return '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="white"/><path d="${paths}" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function SignatureLine({ from, to }: { from: Point; to: Point }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  return (
    <View
      pointerEvents="none"
      style={[
        styles.ink,
        {
          left: (from.x + to.x - length) / 2,
          top: (from.y + to.y) / 2 - 1.5,
          width: length,
          transform: [{ rotate: `${angle}rad` }],
        },
      ]}
    />
  );
}

export const CustomerSignaturePad = memo(function CustomerSignaturePad(props: Props) {
  const { theme } = useAppearance();
  const strokesRef = useRef<Stroke[]>([]);
  const sizeRef = useRef({ width: 1, height: 1 });
  const originRef = useRef({ x: 0, y: 0 });
  const padRef = useRef<View>(null);
  const [, setVersion] = useState(0);

  const getLocalPoint = useCallback((event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    return { x: pageX - originRef.current.x, y: pageY - originRef.current.y };
  }, []);

  const publish = useCallback(() => {
    const { width, height } = sizeRef.current;
    props.onChange(toSignatureDataUrl(strokesRef.current, width, height));
  }, [props.onChange]);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !props.disabled,
        onMoveShouldSetPanResponder: () => !props.disabled,
        onPanResponderGrant: (event) => {
          strokesRef.current.push([getLocalPoint(event)]);
          setVersion((value) => value + 1);
        },
        onPanResponderMove: (event) => {
          const stroke = strokesRef.current.at(-1);
          if (!stroke || stroke.length >= 300) return;
          const { x, y } = getLocalPoint(event);
          const previous = stroke.at(-1);
          if (previous && Math.abs(previous.x - x) + Math.abs(previous.y - y) < 2) return;
          stroke.push({ x, y });
          setVersion((value) => value + 1);
        },
        onPanResponderRelease: publish,
        onPanResponderTerminate: publish,
      }),
    [getLocalPoint, props.disabled, publish],
  );

  const clear = () => {
    strokesRef.current = [];
    setVersion((value) => value + 1);
    props.onChange('');
  };
  const onLayout = (event: LayoutChangeEvent) => {
    sizeRef.current = event.nativeEvent.layout;
    padRef.current?.measureInWindow((x, y) => {
      originRef.current = { x, y };
    });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.heading}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Customer signature</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear signature"
          disabled={props.disabled || strokesRef.current.length === 0}
          onPress={clear}
          style={({ pressed }) => [styles.clear, { opacity: pressed ? 0.55 : 1 }]}
        >
          <Ionicons name="refresh-outline" size={16} color={theme.colors.primary} />
          <Text style={[styles.clearText, { color: theme.colors.primary }]}>Clear</Text>
        </Pressable>
      </View>
      <View
        ref={padRef}
        {...panResponder.panHandlers}
        onLayout={onLayout}
        style={[styles.pad, { borderColor: theme.colors.border }]}
      >
        {strokesRef.current.length === 0 ? (
          <Text pointerEvents="none" style={styles.placeholder}>
            Sign here with a finger
          </Text>
        ) : null}
        {strokesRef.current.flatMap((stroke, strokeIndex) =>
          stroke
            .slice(1)
            .map((point, pointIndex) => (
              <SignatureLine
                key={`${strokeIndex}-${pointIndex}`}
                from={stroke[pointIndex]}
                to={point}
              />
            )),
        )}
        <View pointerEvents="none" style={styles.guide} />
      </View>
      <Text style={[styles.hint, { color: theme.colors.textSubtle }]}>
        Required before handover
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: mobileSpacing.xs },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { ...mobileTextStyles.subhead, fontWeight: '700' },
  clear: { flexDirection: 'row', alignItems: 'center', gap: 3, padding: 4 },
  clearText: { ...mobileTextStyles.footnote, fontWeight: '700' },
  pad: {
    height: 240,
    overflow: 'hidden',
    position: 'relative',
    borderRadius: mobileRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: '#FFFFFF',
  },
  placeholder: { color: '#9CA3AF', textAlign: 'center', marginTop: 72, fontSize: 14 },
  ink: { position: 'absolute', height: 3, borderRadius: 3, backgroundColor: '#111827' },
  guide: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 30,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#CBD5E1',
  },
  hint: { ...mobileTextStyles.caption1 },
});

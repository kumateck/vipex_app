import Ionicons from 'react-native-vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { useAppearance } from '@mobile/providers/appearance-provider';

export function VoiceControlIconButton({
  icon,
  label,
  active,
  disabled,
  onPress,
  primaryColor,
  textColor,
  mutedBg,
  iconButtonWrapStyle,
  iconButtonStyle,
  iconButtonLabelStyle,
}: {
  icon: string;
  label: string;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
  primaryColor: string;
  textColor: string;
  mutedBg: string;
  iconButtonWrapStyle: StyleProp<ViewStyle>;
  iconButtonStyle: StyleProp<ViewStyle>;
  iconButtonLabelStyle: StyleProp<TextStyle>;
}) {
  const { theme } = useAppearance();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[iconButtonWrapStyle, { opacity: disabled ? 0.55 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[iconButtonStyle, { backgroundColor: active ? primaryColor : mutedBg }]}>
        <Ionicons name={icon} size={20} color={active ? theme.colors.primaryText : textColor} />
      </View>
      <Text style={[iconButtonLabelStyle, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

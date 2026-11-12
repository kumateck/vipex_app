import { Text, type StyleProp, type TextStyle } from 'react-native';
import { pickupOfficeLabel } from '@/shared/shipments/receiving-office';

export function PickupOfficeText({
  location,
  office,
  style,
}: {
  location?: string | null;
  office?: string | null;
  style?: StyleProp<TextStyle>;
}) {
  const label = pickupOfficeLabel(location, office);
  return label ? <Text style={style}>Pickup: {label}</Text> : null;
}

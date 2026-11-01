import { useAppearance } from '@mobile/providers/appearance-provider';
import { mobileTextStyles } from '@mobile/theme/layout';
import { Text } from 'react-native';
import { AppButton, AppLabel, AppSelectField } from '@mobile/components/ui/mobile';
import { customerTypeLabel } from '@/shared/customers/customer-types';
import type { useParcelChargeExemption } from '../../hooks';

export function ParcelExemptionFields({
  exemption,
}: {
  exemption: ReturnType<typeof useParcelChargeExemption>;
}) {
  const { theme } = useAppearance();
  if (exemption.exemptionType == null) return null;
  return (
    <>
      <AppLabel>{customerTypeLabel(exemption.exemptionType)} — Exempt · GHS 0.00</AppLabel>
      <Text style={[mobileTextStyles.subhead, { color: theme.colors.textMuted }]}>
        Exempt from every charge, including storage and delivery fees.
      </Text>
      {exemption.exemptionType === 5 ? (
        <>
          <AppSelectField
            label="Receiving staff (required)"
            value={exemption.relatedStaffId}
            onValueChange={exemption.setStaffId}
            options={exemption.options}
            loading={exemption.loading}
            placeholder="Select receiving staff"
            searchPlaceholder="Search staff..."
          />
          <Text style={[mobileTextStyles.subhead, { color: theme.colors.textMuted }]}>
            The receiver can use the office number. Select the actual staff member receiving this
            parcel.
          </Text>
          {!exemption.loading && !exemption.failed && !exemption.options.length ? (
            <AppLabel>
              No active staff found. Select a destination branch with active staff.
            </AppLabel>
          ) : null}
          {exemption.failed ? (
            <AppButton title="Retry receiving staff" variant="plain" onPress={exemption.retry} />
          ) : null}
        </>
      ) : null}
    </>
  );
}

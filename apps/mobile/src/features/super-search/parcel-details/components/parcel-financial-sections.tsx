import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { ParcelFullDetails } from '@mobile/types/parcels';
import { mobileRadius, mobileSpacing, mobileTextStyles } from '@mobile/theme/layout';
import { formatCedis, formatDate, paymentMethodLabel } from '../utils';

function DetailRow({ label, value, first }: { label: string; value: string; first?: boolean }) {
  const { theme } = useAppearance();
  return (
    <View
      style={[
        styles.detailRow,
        !first && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.separator,
        },
      ]}
    >
      <Text style={[styles.detailLabel, { color: theme.colors.textSubtle }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

export function ParcelFinancialSections({ details }: { details: ParcelFullDetails }) {
  const { theme } = useAppearance();

  return (
    <>
      {details.payments.length ? (
        <AppCard>
          <Text style={[styles.title, { color: theme.colors.text }]}>Payments</Text>
          <View style={styles.detailList}>
            <DetailRow first label="Count" value={String(details.payments.length)} />
            <DetailRow
              label="Total Paid"
              value={formatCedis(
                details.payments.reduce((sum, payment) => sum + (payment.grossAmountPsw ?? 0), 0),
              )}
            />
          </View>
          {details.payments.map((payment) => (
            <View
              key={payment.id}
              style={[styles.recordItem, { backgroundColor: theme.colors.cardMuted }]}
            >
              <View style={styles.detailList}>
                <DetailRow first label="Amount" value={formatCedis(payment.grossAmountPsw)} />
                <DetailRow label="Method" value={paymentMethodLabel(payment.method)} />
                <DetailRow label="Received" value={formatDate(payment.receivedAt)} />
                <DetailRow label="Receipt" value={payment.receiptNo ?? '-'} />
                {payment.notes ? <DetailRow label="Notes" value={payment.notes} /> : null}
                {payment.voidedAt ? (
                  <View
                    style={[
                      styles.detailRow,
                      {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: theme.colors.separator,
                      },
                    ]}
                  >
                    <Text style={[styles.detailLabel, { color: theme.colors.textSubtle }]}>
                      Voided
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.danger }]}>
                      {`${formatDate(payment.voidedAt)} (${payment.voidReason ?? 'No reason'})`}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </AppCard>
      ) : null}

      {details.storageWaivers?.length ? (
        <AppCard>
          <Text style={[styles.title, { color: theme.colors.text }]}>Storage Waivers</Text>
          <View style={styles.detailList}>
            <DetailRow first label="Count" value={String(details.storageWaivers.length)} />
          </View>
          {details.storageWaivers.map((entry) => (
            <View
              key={entry.id}
              style={[styles.recordItem, { backgroundColor: theme.colors.cardMuted }]}
            >
              <View style={styles.detailList}>
                <DetailRow first label="Waived Amount" value={formatCedis(entry.waivedAmountPsw)} />
                <DetailRow label="Reason" value={entry.reason} />
                <DetailRow label="Waived By" value={entry.waivedByName ?? '-'} />
                <DetailRow label="Waived At" value={formatDate(entry.waivedAt)} />
              </View>
            </View>
          ))}
        </AppCard>
      ) : null}

      {details.storageSettlement ? (
        <AppCard>
          <Text style={[styles.title, { color: theme.colors.text }]}>Storage Settlement</Text>
          <View style={styles.detailList}>
            <DetailRow
              first
              label="Accrued"
              value={formatCedis(details.storageSettlement.accruedPsw)}
            />
            <DetailRow label="Paid" value={formatCedis(details.storageSettlement.paidPsw)} />
            <DetailRow label="Waived" value={formatCedis(details.storageSettlement.waivedPsw)} />
            <DetailRow
              label="Outstanding"
              value={formatCedis(details.storageSettlement.outstandingPsw)}
            />
          </View>
        </AppCard>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  title: { ...mobileTextStyles.title3 },
  detailList: { marginTop: -mobileSpacing.xs },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: mobileSpacing.sm,
    paddingVertical: mobileSpacing.sm,
  },
  detailLabel: { ...mobileTextStyles.subhead, flexShrink: 0 },
  detailValue: { ...mobileTextStyles.subhead, fontWeight: '600', flex: 1, textAlign: 'right' },
  recordItem: {
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpacing.md,
    marginTop: mobileSpacing.xs,
  },
});

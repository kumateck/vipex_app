import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '@/components/ui/mobile';
import { useAppearance } from '@mobile/providers/appearance-provider';
import type { ParcelFullDetails } from '@mobile/types/parcels';
import { detailLine, formatCedis, formatDate, paymentMethodLabel } from '../utils';

const sectionStyles = StyleSheet.create({
  recordItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    gap: 2,
  },
  title: { fontSize: 18, fontWeight: '700' },
});

export function ParcelFinancialSections({ details }: { details: ParcelFullDetails }) {
  const { theme } = useAppearance();

  return (
    <>
      {details.payments.length ? (
        <AppCard>
          <Text style={[sectionStyles.title, { color: theme.colors.text }]}>Payments</Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Count', String(details.payments.length))}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine(
              'Total Paid',
              formatCedis(
                details.payments.reduce((sum, payment) => sum + (payment.grossAmountPsw ?? 0), 0),
              ),
            )}
          </Text>
          {details.payments.map((payment) => (
            <View
              key={payment.id}
              style={[sectionStyles.recordItem, { borderTopColor: theme.colors.border }]}
            >
              <Text style={{ color: theme.colors.text }}>
                {detailLine('Amount', formatCedis(payment.grossAmountPsw))}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {detailLine('Method', paymentMethodLabel(payment.method))}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {detailLine('Received', formatDate(payment.receivedAt))}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {detailLine('Receipt', payment.receiptNo ?? '-')}
              </Text>
              {payment.notes ? (
                <Text style={{ color: theme.colors.textMuted }}>
                  {detailLine('Notes', payment.notes)}
                </Text>
              ) : null}
              {payment.voidedAt ? (
                <Text style={{ color: theme.colors.danger }}>
                  {detailLine(
                    'Voided',
                    `${formatDate(payment.voidedAt)} (${payment.voidReason ?? 'No reason'})`,
                  )}
                </Text>
              ) : null}
            </View>
          ))}
        </AppCard>
      ) : null}

      {details.storageWaivers?.length ? (
        <AppCard>
          <Text style={[sectionStyles.title, { color: theme.colors.text }]}>Storage Waivers</Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Count', String(details.storageWaivers.length))}
          </Text>
          {details.storageWaivers.map((entry) => (
            <View
              key={entry.id}
              style={[sectionStyles.recordItem, { borderTopColor: theme.colors.border }]}
            >
              <Text style={{ color: theme.colors.text }}>
                {detailLine('Waived Amount', formatCedis(entry.waivedAmountPsw))}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {detailLine('Reason', entry.reason)}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {detailLine('Waived By', entry.waivedByName ?? '-')}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {detailLine('Waived At', formatDate(entry.waivedAt))}
              </Text>
            </View>
          ))}
        </AppCard>
      ) : null}

      {details.storageSettlement ? (
        <AppCard>
          <Text style={[sectionStyles.title, { color: theme.colors.text }]}>
            Storage Settlement
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Accrued', formatCedis(details.storageSettlement.accruedPsw))}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Paid', formatCedis(details.storageSettlement.paidPsw))}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Waived', formatCedis(details.storageSettlement.waivedPsw))}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {detailLine('Outstanding', formatCedis(details.storageSettlement.outstandingPsw))}
          </Text>
        </AppCard>
      ) : null}
    </>
  );
}

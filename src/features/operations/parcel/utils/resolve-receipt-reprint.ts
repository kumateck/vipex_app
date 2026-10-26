import type { ReceiptPrintData } from '../components/parcel-receipt.types';
import type { ReceiptReprintTax } from '../services';

export function resolveReceiptReprint(
  receipt: ReceiptPrintData,
  recorded: ReceiptReprintTax | null,
): ReceiptPrintData {
  if (!recorded || recorded.grossAmountPsw <= 0) {
    if (recorded?.settlementMode === 'CREDIT') {
      return {
        ...receipt,
        settlementMode: 'CREDIT',
        senderPaidCedis: 0,
        amountPaidCedis: 0,
        receiverToPayCedis: 0,
        taxBreakdown: undefined,
      };
    }
    if ((receipt.amountPaidCedis ?? receipt.senderPaidCedis) === 0) return receipt;
    throw new Error('Recorded sender payment is unavailable; receipt reprint was cancelled');
  }
  const amountPaidCedis = recorded.grossAmountPsw / 100;
  return {
    ...receipt,
    settlementMode: undefined,
    amountPaidCedis,
    senderPaidCedis: amountPaidCedis,
    taxBreakdown: {
      vatCedis: recorded.vatPsw / 100,
      getfundCedis: recorded.getfundPsw / 100,
      nhilCedis: recorded.nhilPsw / 100,
      covidCedis: recorded.covidPsw / 100,
      taxTotalCedis: recorded.taxTotalPsw / 100,
      taxComponentKeys: recorded.taxComponentKeys,
    },
  };
}

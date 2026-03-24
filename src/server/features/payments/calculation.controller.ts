import { calculatePayment } from './calculation.service';
import { PaymentResponsibility } from '../../../db/schemas/enums';

export interface PaymentCalculationQuery {
  companyId: string;
  sourceBranchId: string;
  destinationBranchId: string;
  parcelValue: string;
  weight?: number;
  distanceKm?: number;
  paymentResponsibility?: PaymentResponsibility;
  customSplitPercentage?: number;
  includeInsurance?: boolean;
}

export async function calculatePaymentController(query: PaymentCalculationQuery) {
  const result = await calculatePayment({
    companyId: query.companyId,
    sourceBranchId: query.sourceBranchId,
    destinationBranchId: query.destinationBranchId,
    parcelValue: query.parcelValue,
    weight: query.weight,
    distanceKm: query.distanceKm,
    paymentResponsibility: query.paymentResponsibility,
    customSplitPercentage: query.customSplitPercentage,
    includeInsurance: query.includeInsurance,
  });

  return {
    success: true,
    calculation: result,
    message: 'Payment calculated successfully',
  };
}

export async function previewPaymentSplitsController(query: PaymentCalculationQuery) {
  // Get calculation for all payment responsibility types
  const senderResult = await calculatePayment({
    ...query,
    paymentResponsibility: 0, // SENDER
  });

  const recipientResult = await calculatePayment({
    ...query,
    paymentResponsibility: 1, // RECIPIENT
  });

  const splitResult = await calculatePayment({
    ...query,
    paymentResponsibility: 2, // SPLIT
  });

  return {
    success: true,
    options: {
      sender: {
        totalCharge: senderResult.totalCharge,
        senderAmount: senderResult.senderAmount,
        recipientAmount: senderResult.recipientAmount,
        taxBreakdown: {
          vat: senderResult.vat,
          getfund: senderResult.getfund,
          nhil: senderResult.nhil,
          covid: senderResult.covid,
          total: senderResult.taxTotal,
        },
      },
      recipient: {
        totalCharge: recipientResult.totalCharge,
        senderAmount: recipientResult.senderAmount,
        recipientAmount: recipientResult.recipientAmount,
        taxBreakdown: {
          vat: recipientResult.vat,
          getfund: recipientResult.getfund,
          nhil: recipientResult.nhil,
          covid: recipientResult.covid,
          total: recipientResult.taxTotal,
        },
      },
      split: {
        totalCharge: splitResult.totalCharge,
        senderAmount: splitResult.senderAmount,
        recipientAmount: splitResult.recipientAmount,
        taxBreakdown: {
          vat: splitResult.vat,
          getfund: splitResult.getfund,
          nhil: splitResult.nhil,
          covid: splitResult.covid,
          total: splitResult.taxTotal,
        },
      },
    },
    message: 'Payment options calculated successfully',
  };
}

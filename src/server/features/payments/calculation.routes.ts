import { Elysia, t } from 'elysia';
import { UUID, NonEmptyString255 } from '../../schemas/common';
import {
  calculatePaymentController,
  previewPaymentSplitsController,
} from './calculation.controller';

export const paymentCalculationRoutes = new Elysia({ name: 'payment-calculation' })
  // Calculate payment for specific parameters
  .post('/calculate', async ({ body }) => calculatePaymentController(body as any), {
    body: t.Object({
      companyId: UUID,
      sourceBranchId: UUID,
      destinationBranchId: UUID,
      parcelValue: NonEmptyString255, // in cedis
      weight: t.Optional(t.Number()), // in kg
      distanceKm: t.Optional(t.Number()), // distance between branches
      paymentResponsibility: t.Optional(t.Number()), // 0 = SENDER, 1 = RECIPIENT, 2 = SPLIT
      customSplitPercentage: t.Optional(t.Number()), // Override default split
      includeInsurance: t.Optional(t.Boolean()),
    }),
    detail: {
      tags: ['Payments'],
      summary: 'Calculate payment amounts and taxes',
      operationId: 'calculatePayment',
    },
  })

  // Preview all payment responsibility options
  .post('/preview-splits', async ({ body }) => previewPaymentSplitsController(body as any), {
    body: t.Object({
      companyId: UUID,
      sourceBranchId: UUID,
      destinationBranchId: UUID,
      parcelValue: NonEmptyString255, // in cedis
      weight: t.Optional(t.Number()), // in kg
      distanceKm: t.Optional(t.Number()), // distance between branches
      customSplitPercentage: t.Optional(t.Number()), // Override default split
      includeInsurance: t.Optional(t.Boolean()),
    }),
    detail: {
      tags: ['Payments'],
      summary: 'Preview all payment responsibility options',
      operationId: 'previewPaymentSplits',
    },
  });

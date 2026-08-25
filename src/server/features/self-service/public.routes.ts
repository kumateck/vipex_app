import { Elysia, t } from 'elysia';
import { UUID, Telephone } from '../../schemas/common';
import {
  getSelfServiceBranchInfoCtrl,
  issueSelfServiceSessionCtrl,
  listSelfServiceDestinationBranchesCtrl,
  listSelfServiceDestinationLocationsCtrl,
  lookupSelfServiceCustomerCtrl,
  submitSelfServiceDraftCtrl,
} from './public.controller';

function clientIp(request: Request): string | null {
  const header = request.headers.get('x-forwarded-for');
  return header?.split(',')[0]?.trim() || null;
}

function sessionToken(request: Request): string {
  return request.headers.get('x-self-service-session')?.trim() ?? '';
}

// Customers have no staff identity, so these routes use a short-lived,
// branch-bound self-service session instead of staff authentication.
export const selfServicePublicRoutes = new Elysia({ name: 'self-service-public' })
  .post(
    '/sessions',
    async ({ body, request }) =>
      issueSelfServiceSessionCtrl({ branchId: body.branchId, requestIp: clientIp(request) }),
    {
      body: t.Object({ branchId: UUID }),
      detail: { tags: ['Self-Service'], summary: 'Start a temporary self-service session' },
    },
  )
  .get(
    '/branches/:branchId',
    async ({ params, request }) =>
      getSelfServiceBranchInfoCtrl({
        branchId: params.branchId,
        sessionToken: sessionToken(request),
      }),
    {
      params: t.Object({ branchId: UUID }),
      detail: { tags: ['Self-Service'], summary: 'Get branch info for a self-service link' },
    },
  )
  .get(
    '/customers/lookup',
    async ({ query, request }) =>
      lookupSelfServiceCustomerCtrl({
        branchId: query.branchId,
        phone: query.phone,
        sessionToken: sessionToken(request),
        requestIp: clientIp(request),
      }),
    {
      query: t.Object({ branchId: UUID, phone: Telephone }),
      detail: {
        tags: ['Self-Service'],
        summary: 'Look up an existing customer by exact phone match (name only)',
      },
    },
  )
  .get(
    '/destinations/branches',
    async ({ query, request }) =>
      listSelfServiceDestinationBranchesCtrl({
        sourceBranchId: query.sourceBranchId,
        sessionToken: sessionToken(request),
      }),
    {
      query: t.Object({ sourceBranchId: UUID }),
      detail: { tags: ['Self-Service'], summary: 'List valid destination branches' },
    },
  )
  .get(
    '/destinations/locations',
    async ({ query, request }) =>
      listSelfServiceDestinationLocationsCtrl({
        sourceBranchId: query.sourceBranchId,
        destinationBranchId: query.destinationBranchId,
        sessionToken: sessionToken(request),
      }),
    {
      query: t.Object({ sourceBranchId: UUID, destinationBranchId: UUID }),
      detail: { tags: ['Self-Service'], summary: 'List locations for a destination branch' },
    },
  )
  .post(
    '/drafts',
    async ({ body, request }) =>
      submitSelfServiceDraftCtrl({
        branchId: body.branchId,
        sender: body.sender,
        receiver: body.receiver,
        destinationBranchId: body.destinationBranchId,
        destinationLocationId: body.destinationLocationId,
        parcelContent: body.parcelContent,
        parcelValueCedis: body.parcelValueCedis,
        callSender: body.callSender ?? false,
        requestIp: clientIp(request),
        sessionToken: sessionToken(request),
      }),
    {
      body: t.Object({
        branchId: UUID,
        sender: t.Object({
          fullname: t.String({ minLength: 1, maxLength: 255 }),
          phone: Telephone,
          phone2: t.Optional(t.Union([t.String({ maxLength: 30 }), t.Null()])),
          customerId: t.Optional(t.Union([UUID, t.Null()])),
        }),
        receiver: t.Object({
          fullname: t.String({ minLength: 1, maxLength: 255 }),
          phone: Telephone,
          phone2: t.Optional(t.Union([t.String({ maxLength: 30 }), t.Null()])),
          customerId: t.Optional(t.Union([UUID, t.Null()])),
        }),
        destinationBranchId: UUID,
        destinationLocationId: t.Optional(t.Union([UUID, t.Null()])),
        parcelContent: t.String({ minLength: 1, maxLength: 255 }),
        parcelValueCedis: t.Union([t.Number({ minimum: 0 }), t.String()]),
        callSender: t.Optional(t.Boolean()),
      }),
      detail: { tags: ['Self-Service'], summary: 'Submit a self-service booking draft' },
    },
  );

import { Elysia, t } from 'elysia';
import { getPublicReceiptSvc } from './public.service';

// Public: opened by customers from the link in a digital receipt message.
export const publicReceiptRoutes = new Elysia({ name: 'public-receipts' }).get(
  '/v1/public/receipts/:token',
  ({ params }) => getPublicReceiptSvc(params.token),
  {
    params: t.Object({ token: t.String({ minLength: 1, maxLength: 128 }) }),
    detail: {
      tags: ['Digital Receipts'],
      summary: 'Get the online copy of a receipt by its share token',
    },
  },
);

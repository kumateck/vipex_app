import { Elysia, t } from 'elysia';

import { computeGhanaTaxesFromPesewas } from '../../utils/tax/ghana';
import { fromPesewas, toPesewas } from '@/server/utils/gh-money';

export const accountingRoutes = new Elysia({ name: 'accounting' }).post(
  '/taxes/compute',
  async ({ body }) => {
    const psw = toPesewas((body as { principalCedis: number | string }).principalCedis);
    const b = computeGhanaTaxesFromPesewas(psw);
    return {
      principalCedis: fromPesewas(b.principal),
      netCedis: fromPesewas(b.net),
      vatCedis: fromPesewas(b.vat),
      getfundCedis: fromPesewas(b.getfund),
      nhilCedis: fromPesewas(b.nhil),
      covidCedis: fromPesewas(b.covid),
      taxTotalCedis: fromPesewas(b.totalTax),
      residualCedis: fromPesewas(b.residual),
    };
  },
  {
    body: t.Object({ principalCedis: t.Union([t.Number(), t.String()]) }),
    detail: {
      tags: ['Accounting'],
      summary: 'Compute Ghana taxes on principal (inclusive), in cedis',
    },
  },
);

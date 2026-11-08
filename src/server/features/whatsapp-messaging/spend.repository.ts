import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db/config';
import { notificationDispatches } from '@/db/schemas';
import type { WhatsAppMessagePricing } from './webhook-status';

/** Merges Meta's pricing into the dispatch metadata without touching other keys. */
export async function recordWhatsAppDispatchPricingRepo(
  id: string,
  companyId: string,
  pricing: WhatsAppMessagePricing,
) {
  await db
    .update(notificationDispatches)
    .set({
      metadataJson: sql`coalesce(${notificationDispatches.metadataJson}, '{}'::jsonb) || jsonb_build_object('whatsappPricing', ${JSON.stringify(pricing)}::jsonb)`,
    })
    .where(and(eq(notificationDispatches.id, id), eq(notificationDispatches.companyId, companyId)));
}

export type WhatsAppSpendRow = {
  day: string;
  eventCode: string | null;
  status: string;
  billable: string | null;
  category: string | null;
  count: number;
};

/**
 * WhatsApp dispatches grouped by day, event, status and Meta pricing.
 * `from`/`to` are inclusive YYYY-MM-DD strings, bound as text (see fd1dffe6).
 */
export async function listWhatsAppSpendRowsRepo(input: {
  companyId: string;
  from: string;
  to: string;
}): Promise<WhatsAppSpendRow[]> {
  const rows = await db.execute(sql<WhatsAppSpendRow>`
    SELECT
      to_char(${notificationDispatches.createdAt}, 'YYYY-MM-DD') AS day,
      ${notificationDispatches.metadataJson} ->> 'eventCode' AS "eventCode",
      ${notificationDispatches.status} AS status,
      ${notificationDispatches.metadataJson} -> 'whatsappPricing' ->> 'billable' AS billable,
      ${notificationDispatches.metadataJson} -> 'whatsappPricing' ->> 'category' AS category,
      count(*)::int AS count
    FROM ${notificationDispatches}
    WHERE ${notificationDispatches.companyId} = ${input.companyId}
      AND ${notificationDispatches.channel} = 'whatsapp'
      AND ${notificationDispatches.createdAt} >= ${input.from}::date
      AND ${notificationDispatches.createdAt} < (${input.to}::date + 1)
    GROUP BY 1, 2, 3, 4, 5
    ORDER BY 1
  `);
  return (rows as unknown as WhatsAppSpendRow[]).map((row) => ({
    ...row,
    count: Number(row.count),
  }));
}

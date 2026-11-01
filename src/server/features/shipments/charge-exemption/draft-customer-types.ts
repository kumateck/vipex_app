import { and, eq, inArray, or } from 'drizzle-orm';
import { db } from '@/db/config';
import { customers } from '@/db/schemas';

type Draft = {
  companyId: string;
  senderCustomerId: string | null;
  receiverCustomerId: string | null;
  senderPhone: string;
  receiverPhone: string;
};

/** One bounded customer query for the branch queue, including drafts resolved only by phone. */
export async function withDraftCustomerTypesList<T extends Draft>(drafts: T[]) {
  if (!drafts.length) return [];
  const ids = drafts
    .flatMap((d) => [d.senderCustomerId, d.receiverCustomerId])
    .filter((id): id is string => !!id);
  const phones = [...new Set(drafts.flatMap((d) => [d.senderPhone, d.receiverPhone]))];
  const rows = await db
    .select({
      id: customers.id,
      telephone: customers.telephone,
      telephone2: customers.telephone2,
      customerType: customers.customerType,
    })
    .from(customers)
    .where(
      and(
        eq(customers.companyId, drafts[0]!.companyId),
        eq(customers.isDeleted, false),
        or(
          inArray(customers.id, ids),
          inArray(customers.telephone, phones),
          inArray(customers.telephone2, phones),
        ),
      ),
    );
  const typesById = new Map(rows.map((row) => [row.id, row.customerType]));
  const typesByPhone = new Map(
    rows.flatMap((row) =>
      [row.telephone, row.telephone2]
        .filter((phone): phone is string => !!phone)
        .map((phone) => [phone, row.customerType] as const),
    ),
  );
  const type = (id: string | null, phone: string) =>
    (id ? typesById.get(id) : typesByPhone.get(phone)) ?? 0;
  return drafts.map((draft) => ({
    ...draft,
    senderCustomerType: type(draft.senderCustomerId, draft.senderPhone),
    receiverCustomerType: type(draft.receiverCustomerId, draft.receiverPhone),
  }));
}

export async function withDraftCustomerTypes<T extends Draft>(draft: T) {
  return (await withDraftCustomerTypesList([draft]))[0]!;
}

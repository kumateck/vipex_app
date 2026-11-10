import { describe, expect, test } from 'bun:test';
import { PgDialect } from 'drizzle-orm/pg-core';
import { ParcelStatus } from '@/db/schemas/enums';
import type { ListParcelsParams } from '../parcel-repositories/parcel-repository.types';
import { createParcelListContext } from './parcel-list-context';
import { createParcelListOrder } from './parcel-list-order';

function buildWhereClause(filters: Partial<ListParcelsParams>) {
  const params = { limit: 20, offset: 0, ...filters };
  const { whereClause } = createParcelListOrder(params, createParcelListContext(params));
  return new PgDialect().sqlToQuery(whereClause!);
}

describe('parcel list search', () => {
  test('matches both codes, sender and receiver names, and their two phone slots', () => {
    const query = buildWhereClause({ search: 'Find me' });
    for (const column of [
      '"parcels"."booking_code" ilike',
      '"parcels"."tracking_code" ilike',
      '"s"."fullname"',
      '"s"."telephone" ilike',
      '"s"."telephone2" ilike',
      '"r"."fullname"',
      '"r"."telephone" ilike',
      '"r"."telephone2" ilike',
    ]) {
      expect(query.sql).toContain(column);
    }
    expect(query.params).toContain('%Find me%');
  });

  test('matches the entire sticker code before pagination and keeps pickup filters', () => {
    const query = buildWhereClause({
      companyId: 'company-1',
      destinationId: 'branch-1',
      status: ParcelStatus.AWAITING_PICKUP,
      cashierCollectionRequired: false,
      parcelCode: ' TRK-1 ',
    });
    expect(query.sql).toMatch(
      /\("parcels"\."tracking_code" = \$\d+ or "parcels"\."booking_code" = \$\d+\)/,
    );
    expect(query.sql).toContain('"parcels"."company_id" =');
    expect(query.sql).toContain('"parcels"."destination_id" =');
    expect(query.sql).toContain('"parcels"."status" =');
    expect(query.sql).toContain('"parcels"."is_deleted" =');
    expect(query.sql).toContain('parcel_storage_waivers');
    expect(query.sql).not.toContain(' ilike ');
    expect(query.params.filter((param) => param === 'TRK-1')).toHaveLength(2);
  });
});

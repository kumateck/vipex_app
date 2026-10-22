import { describe, expect, test } from 'bun:test';
import { buildStickerPaymentQuery } from './parcel-sticker-payment.repository';

describe('sticker payment query correlation', () => {
  const query = buildStickerPaymentQuery('company', 'TRACK', 'BOOK').toSQL();
  const sql = query.sql.replace(/\s+/g, ' ');

  test('both payer totals reference the outer parcel, not the payment row id', () => {
    expect(sql.match(/"parcel_id" = "parcels"\."id"/g)).toHaveLength(2);
    expect(sql).not.toContain('"parcel_id" = "id"');
  });

  test('payment and credit company checks reference the outer company', () => {
    expect(sql.match(/"company_id" = "parcels"\."company_id"/g)).toHaveLength(3);
    expect(sql).not.toContain('"company_id" = "company_id"');
  });

  test('credit references the outer parcel and sender', () => {
    expect(sql).toContain('"reference_id" = "parcels"."id"');
    expect(sql).toContain('"customer_id" = "parcels"."sender_id"');
  });
});

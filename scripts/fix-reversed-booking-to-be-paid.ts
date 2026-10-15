import { config as loadEnv } from 'dotenv';
import postgres from 'postgres';

const shouldApply = process.argv.includes('--apply');
const bookingCodes = process.argv
  .slice(2)
  .filter((argument) => argument !== '--apply')
  .map((code) => code.trim())
  .filter(Boolean);
loadEnv({ path: '.env' });
loadEnv({ path: '.env.production', override: false });
const databaseUrl =
  process.env.PRODUCTION_DATABASE_URL ||
  process.env.MIGRATE_DATABASE_URL ||
  process.env.DATABASE_URL;

type BookingBalance = {
  parcel_id: string;
  booking_code: string;
  charge_psw: number;
  planned_tobepaid_psw: number;
  active_sender_principal_paid_psw: number;
  expected_tobepaid_psw: number;
  active_recipient_payment_count: number;
  active_recipient_payment_psw: number;
};

async function main() {
  if (bookingCodes.length === 0) {
    throw new Error(
      'Pass one or more booking codes: bun run scripts/fix-reversed-booking-to-be-paid.ts <booking-code> [booking-code ...] [--apply]',
    );
  }
  if (!databaseUrl) {
    throw new Error('Set DATABASE_URL (or PRODUCTION_DATABASE_URL/MIGRATE_DATABASE_URL) first.');
  }

  const sql = postgres(databaseUrl, { max: 1 });
  try {
    const rows = await sql<BookingBalance[]>`
      SELECT
        p.id AS parcel_id,
        p.booking_code,
        p.charge_psw::int AS charge_psw,
        p.planned_tobepaid_psw::int AS planned_tobepaid_psw,
        COALESCE(SUM(pay.gross_amount_psw) FILTER (
          WHERE pay.component = 0 AND pay.payer = 0 AND pay.voided_at IS NULL
        ), 0)::int AS active_sender_principal_paid_psw,
        GREATEST(
          p.charge_psw - COALESCE(SUM(pay.gross_amount_psw) FILTER (
            WHERE pay.component = 0 AND pay.payer = 0 AND pay.voided_at IS NULL
          ), 0),
          0
        )::int AS expected_tobepaid_psw,
        COUNT(pay.id) FILTER (
          WHERE pay.payer = 1 AND pay.voided_at IS NULL
        )::int AS active_recipient_payment_count,
        COALESCE(SUM(pay.gross_amount_psw) FILTER (
          WHERE pay.payer = 1 AND pay.voided_at IS NULL
        ), 0)::int AS active_recipient_payment_psw
      FROM parcels p
      LEFT JOIN payments pay ON pay.parcel_id = p.id
      WHERE p.booking_code IN ${sql(bookingCodes)}
        AND p.is_deleted = false
      GROUP BY p.id
      ORDER BY p.booking_code, p.id
    `;

    const foundCodes = new Set(rows.map((row) => row.booking_code));
    const missingCodes = bookingCodes.filter((code) => !foundCodes.has(code));
    if (missingCodes.length)
      throw new Error(`No active parcel found for: ${missingCodes.join(', ')}`);

    console.table(
      rows.map((row) => ({
        booking: row.booking_code,
        parcelId: row.parcel_id,
        chargePsw: row.charge_psw,
        currentToBePaidPsw: row.planned_tobepaid_psw,
        activeSenderPrincipalPaidPsw: row.active_sender_principal_paid_psw,
        correctedToBePaidPsw: row.expected_tobepaid_psw,
        activeRecipientPayments: row.active_recipient_payment_count,
        activeRecipientPaymentPsw: row.active_recipient_payment_psw,
      })),
    );

    if (!shouldApply) {
      console.log(
        `Dry run only. Re-run with --apply to void recipient payments and restore balances for: ${bookingCodes.join(', ')}.`,
      );
      return;
    }

    await sql.begin(async (tx) => {
      for (const row of rows) {
        if (row.active_recipient_payment_count === 0 || row.active_recipient_payment_psw === 0) {
          throw new Error(
            `No active recipient payment is present for ${row.booking_code}; refusing to apply repair.`,
          );
        }
        const voided = await tx.unsafe(
          `
          UPDATE payments pay
          SET voided_at = NOW(),
              void_reason = 'Production repair: restore to-be-paid balance after returned-paid reversal'
          FROM parcels p
          WHERE pay.parcel_id = p.id
            AND p.id = $1
            AND p.booking_code = $2
            AND p.is_deleted = false
            AND pay.payer = 1
            AND pay.voided_at IS NULL
            AND pay.gross_amount_psw > 0
          RETURNING pay.id
        `,
          [row.parcel_id, row.booking_code],
        );
        if (voided.length !== row.active_recipient_payment_count) {
          throw new Error(
            `Recipient payments changed for ${row.booking_code}; transaction rolled back.`,
          );
        }

        const updated = await tx.unsafe(
          `
          UPDATE parcels p
          SET planned_tobepaid_psw = GREATEST(
                p.charge_psw - COALESCE((
                  SELECT SUM(pay.gross_amount_psw)
                  FROM payments pay
                  WHERE pay.parcel_id = p.id
                    AND pay.component = 0
                    AND pay.payer = 0
                    AND pay.voided_at IS NULL
                ), 0),
                0
              ),
              updated_at = NOW()
          WHERE p.id = $1
            AND p.booking_code = $2
            AND p.is_deleted = false
          RETURNING p.id
        `,
          [row.parcel_id, row.booking_code],
        );
        if (updated.length !== 1) {
          throw new Error(
            `Parcel ${row.booking_code} changed during repair; transaction rolled back.`,
          );
        }
      }
    });

    console.log(
      `Voided active recipient payments and restored to-be-paid balances for: ${bookingCodes.join(', ')}.`,
    );
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error('[fix-reversed-booking-to-be-paid] failed:', error);
  process.exitCode = 1;
});

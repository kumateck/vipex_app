-- Emergency repair for AS7749418G only.
-- Run with: bun run scripts/run-repair-as7749418g.ts (reads DATABASE_URL from .env)
-- Review the NOTICE and final SELECT before allowing another payment or delivery action.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';

DO $$
DECLARE
  target RECORD;
  matches integer;
  active_principal_psw bigint;
  corrected_psw bigint;
  changed integer;
BEGIN
  SELECT COUNT(*) INTO matches
  FROM parcels
  WHERE (booking_code = 'AS7749418G' OR tracking_code = 'AS7749418G')
    AND is_deleted = false;
  IF matches <> 1 THEN
    RAISE EXCEPTION 'Expected one active parcel for AS7749418G; found %', matches;
  END IF;

  SELECT id, company_id, booking_code, tracking_code, status,
         charge_psw, planned_tobepaid_psw
  INTO target
  FROM parcels
  WHERE (booking_code = 'AS7749418G' OR tracking_code = 'AS7749418G')
    AND is_deleted = false
  FOR UPDATE;

  -- 5 = AWAITING_PICKUP; 10 = RIDER_GIVEN_PARCEL_TO_CUSTOMER.
  IF target.status NOT IN (5, 10) THEN
    RAISE EXCEPTION 'Parcel is not in a reversed delivery state (status %)', target.status;
  END IF;
  IF NOT (
    EXISTS (
      SELECT 1 FROM audit_logs
      WHERE entity_type = 'parcel' AND entity_id = target.id
        AND action = 'PARCEL_DELIVERY_REVERSED'
    ) OR EXISTS (
      SELECT 1 FROM payments
      WHERE parcel_id = target.id AND payer = 1
        AND void_reason LIKE 'Delivery confirmation reversed:%'
    )
  ) THEN
    RAISE EXCEPTION 'No delivery reversal evidence found for AS7749418G';
  END IF;

  -- 0 = principal. Include all non-voided principal payments, including sender payments.
  SELECT COALESCE(SUM(gross_amount_psw), 0) INTO active_principal_psw
  FROM payments
  WHERE parcel_id = target.id AND component = 0 AND voided_at IS NULL;
  corrected_psw := GREATEST(target.charge_psw - active_principal_psw, 0);
  IF corrected_psw <= 0 THEN
    RAISE EXCEPTION 'No unpaid principal remains (charge %, active principal paid %); no repair made',
      target.charge_psw, active_principal_psw;
  END IF;
  IF target.planned_tobepaid_psw = corrected_psw THEN
    RAISE NOTICE 'AS7749418G already has the correct to-be-paid balance: % pesewas', corrected_psw;
    RETURN;
  END IF;

  UPDATE parcels
  SET planned_tobepaid_psw = corrected_psw, updated_at = NOW()
  WHERE id = target.id AND planned_tobepaid_psw = target.planned_tobepaid_psw;
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 1 THEN
    RAISE EXCEPTION 'Parcel balance changed concurrently; no repair made';
  END IF;

  INSERT INTO audit_logs
    (id, company_id, entity_type, entity_id, action, message, metadata)
  VALUES
    (SUBSTR(MD5(RANDOM()::text || CLOCK_TIMESTAMP()::text), 1, 25),
     target.company_id, 'parcel', target.id,
     'PARCEL_TO_BE_PAID_BALANCE_REPAIRED',
     'Restored to-be-paid balance after delivery reversal for AS7749418G',
     JSON_BUILD_OBJECT('previousPsw', target.planned_tobepaid_psw,
                       'restoredPsw', corrected_psw,
                       'activePrincipalPaidPsw', active_principal_psw));

  RAISE NOTICE 'AS7749418G: to-be-paid restored from % to % pesewas (charge %, active principal paid %)',
    target.planned_tobepaid_psw, corrected_psw, target.charge_psw, active_principal_psw;
END;
$$;

COMMIT;

SELECT booking_code, tracking_code, charge_psw,
       planned_tobepaid_psw AS to_be_paid_psw
FROM parcels
WHERE (booking_code = 'AS7749418G' OR tracking_code = 'AS7749418G')
  AND is_deleted = false;

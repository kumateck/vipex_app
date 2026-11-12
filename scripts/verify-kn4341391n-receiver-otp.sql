-- Run as a single script on vipex_live_db after the named approver has approved.
-- The same cashier who requested the main receiver's latest OTP should reopen
-- KN4341391N in Receiver Cashier after COMMIT. Do not send another OTP.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';

DO $verify$
DECLARE
  parcel parcels%ROWTYPE;
  otp parcel_receiver_otps%ROWTYPE;
  cashier_email text;
  named_approver_id text;
  v_now timestamp := clock_timestamp() AT TIME ZONE 'UTC';
  v_expiry timestamp := v_now + interval '10 minutes';
  v_email constant text := 'g.agamah@vipex.com.gh';
  v_tracking constant text := 'KN4341391N';
BEGIN
  IF current_database() <> 'vipex_live_db' THEN
    RAISE EXCEPTION 'Expected vipex_live_db, connected to %', current_database();
  END IF;

  SELECT p.* INTO STRICT parcel
  FROM parcels p
  WHERE (p.tracking_code = v_tracking OR p.booking_code = v_tracking)
    AND NOT p.is_deleted
  FOR UPDATE;

  -- Parcel status 5 is Awaiting Pickup.
  IF parcel.status <> 5 OR parcel.confirmed_at IS NOT NULL
     OR parcel.pending_receiver_handover IS NOT NULL THEN
    RAISE EXCEPTION 'Parcel % is no longer waiting for cashier verification', v_tracking;
  END IF;

  -- Staff status 0 is Active. The DB operator records the named approver
  -- after obtaining approval. This does not assert an authenticated app action.
  SELECT u.id INTO STRICT named_approver_id
  FROM users u
  WHERE u.company_id = parcel.company_id AND lower(u.email) = v_email AND u.status = 0;

  SELECT o.* INTO otp
  FROM parcel_receiver_otps o
  JOIN customers c ON c.id = parcel.receiver_id AND c.company_id = parcel.company_id
  WHERE o.parcel_id = parcel.id AND o.company_id = parcel.company_id
    AND o.branch_id = parcel.destination_id AND o.target_receiver = 'main'
    AND NOT c.is_deleted AND o.phone IN (c.telephone, c.telephone2)
  ORDER BY o.created_at DESC, o.id DESC
  LIMIT 1
  FOR UPDATE OF o;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No matching OTP request. Have the cashier request one for the main receiver.';
  END IF;
  IF otp.verified_at IS NOT NULL THEN
    RAISE EXCEPTION 'Latest OTP was already verified. Reopen the parcel if the token is still valid, or request a new OTP.';
  END IF;

  SELECT u.email INTO cashier_email
  FROM users u
  WHERE u.id = otp.created_by AND u.company_id = parcel.company_id
    AND u.branch_id = parcel.destination_id AND u.status = 0
    AND EXISTS (
      SELECT 1 FROM role_permissions rp
      WHERE rp.company_id = u.company_id AND rp.role_id = u.role_id
        AND rp.permission = 'CanCreateReceiverPayments'
    );
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Latest OTP was not requested by an active receiver cashier at the destination branch. Have the cashier request one.';
  END IF;

  UPDATE parcel_receiver_otps
  SET verified_at = v_now,
      verification_token = replace(gen_random_uuid()::text, '-', ''),
      verification_token_expires_at = v_expiry
  WHERE id = otp.id;

  INSERT INTO audit_logs (id, company_id, entity_type, entity_id, action, message, metadata)
  VALUES (
    left(replace(gen_random_uuid()::text, '-', ''), 25),
    parcel.company_id, 'parcel', parcel.id, 'PARCEL_RECEIVER_OTP_MANUALLY_VERIFIED',
    'Receiver OTP marked verified by a database operator for Receiver Cashier',
    json_build_object(
      'reason', 'Customer could not access the collection OTP',
      'namedApproverEmail', v_email,
      'namedApproverId', named_approver_id,
      'databaseOperator', session_user,
      'otpRequestId', otp.id,
      'cashierUserId', otp.created_by,
      'verificationExpiresAt', v_expiry
    )
  );
  RAISE NOTICE 'OTP marked verified for %. Cashier % should reopen before % UTC.',
    v_tracking, cashier_email, v_expiry;
END;
$verify$;

COMMIT;

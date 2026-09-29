-- Additive nullable column and row trigger; existing parcels are not rewritten.
SET LOCAL lock_timeout = '3s';
--> statement-breakpoint
ALTER TABLE "parcels" ADD COLUMN "delivery_confirmation_snapshot" jsonb;
--> statement-breakpoint
CREATE FUNCTION capture_parcel_delivery_confirmation_snapshot()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  queue_id varchar(25);
  delivery_snapshot jsonb;
BEGIN
  IF NEW.status IN (6, 11)
     AND OLD.status IS DISTINCT FROM NEW.status
     AND OLD.status NOT IN (6, 11)
     AND NEW.delivery_confirmation_snapshot IS NULL THEN
    SELECT id INTO queue_id
    FROM pickup_queues
    WHERE parcel_id = OLD.id AND ended_at IS NULL
    ORDER BY queued_at DESC
    LIMIT 1;
    SELECT jsonb_build_object(
      'status', status,
      'amountPaidPsw', amount_paid_psw,
      'deliveredAt', delivered_at,
      'confirmedAt', confirmed_at,
      'confirmedBy', confirmed_by
    ) INTO delivery_snapshot
    FROM deliveries
    WHERE parcel_id = OLD.id AND is_deleted = false
    ORDER BY created_at DESC
    LIMIT 1;
    NEW.delivery_confirmation_snapshot := jsonb_build_object(
      'parcelStatus', OLD.status,
      'confirmedAt', OLD.confirmed_at,
      'confirmedBy', OLD.confirmed_by,
      'plannedToBePaidPsw', OLD.planned_tobepaid_psw,
      'paymentIds', '[]'::jsonb,
      'creditChargeIds', '[]'::jsonb,
      'pickupQueueId', queue_id,
      'handover', jsonb_build_object(
        'secondReceiverId', OLD.second_receiver_id,
        'secondReceiverNameSnapshot', OLD.second_receiver_name_snapshot,
        'cardId', OLD.card_id,
        'cardNumber', OLD.card_number,
        'secondCardId', OLD.second_card_id,
        'secondCardNumber', OLD.second_card_number
      ),
      'delivery', delivery_snapshot
    );
  ELSIF OLD.status IN (6, 11)
     AND NEW.status NOT IN (6, 11)
     AND OLD.delivery_confirmation_snapshot IS NOT NULL
     AND NEW.delivery_confirmation_snapshot IS NULL THEN
    -- This trigger runs after the customer-name trigger so the recorded name
    -- survives a profile rename between confirmation and reversal.
    NEW.second_receiver_name_snapshot :=
      OLD.delivery_confirmation_snapshot #>> '{handover,secondReceiverNameSnapshot}';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER parcels_delivery_confirmation_snapshot_trigger
BEFORE UPDATE OF status ON parcels
FOR EACH ROW EXECUTE FUNCTION capture_parcel_delivery_confirmation_snapshot();
--> statement-breakpoint
RESET lock_timeout;

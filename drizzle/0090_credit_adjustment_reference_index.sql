-- Supports credit charge corrections and existing delivery-credit reversals.
CREATE INDEX IF NOT EXISTS customer_credit_transactions_adjustment_reference_idx
  ON customer_credit_transactions (company_id, customer_id, reference_id)
  WHERE transaction_type = 2;

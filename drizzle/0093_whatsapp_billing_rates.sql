-- Additive: client price history for WhatsApp messages (WhatsApp spend report).
-- Each row applies from effective_from until the next row's start date.
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';
CREATE TABLE IF NOT EXISTS whatsapp_billing_rates (
  id varchar(25) PRIMARY KEY,
  company_id varchar(25) NOT NULL REFERENCES companies(id),
  effective_from date NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'USD',
  authentication_rate_micros bigint NOT NULL DEFAULT 0,
  utility_rate_micros bigint NOT NULL DEFAULT 0,
  marketing_rate_micros bigint NOT NULL DEFAULT 0,
  created_by varchar(25) REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_billing_rates_non_negative CHECK (
    authentication_rate_micros >= 0 AND utility_rate_micros >= 0 AND marketing_rate_micros >= 0
  )
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_billing_rates_company_effective_uq
  ON whatsapp_billing_rates (company_id, effective_from);

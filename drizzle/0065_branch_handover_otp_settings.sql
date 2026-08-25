ALTER TABLE "branches"
ADD COLUMN "require_pickup_otp" boolean DEFAULT true NOT NULL;

ALTER TABLE "branches"
ADD COLUMN "require_receiver_otp" boolean DEFAULT true NOT NULL;

ALTER TABLE "fleet_vehicles"
  ADD COLUMN IF NOT EXISTS "expected_km_per_liter" double precision;

CREATE TABLE IF NOT EXISTS "product_unit_conversions" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "product_id" varchar(25) NOT NULL,
  "unit_of_measure" smallint NOT NULL,
  "factor_to_base" bigint NOT NULL,
  "sort_order" smallint NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_unit_conversions_product_id_products_id_fk'
  ) THEN
    ALTER TABLE "product_unit_conversions"
      ADD CONSTRAINT "product_unit_conversions_product_id_products_id_fk"
      FOREIGN KEY ("product_id") REFERENCES "products"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "product_unit_conversions_product_idx"
  ON "product_unit_conversions" ("product_id");

CREATE INDEX IF NOT EXISTS "product_unit_conversions_product_sort_idx"
  ON "product_unit_conversions" ("product_id", "sort_order");

CREATE UNIQUE INDEX IF NOT EXISTS "product_unit_conversions_product_unit_uq"
  ON "product_unit_conversions" ("product_id", "unit_of_measure");

CREATE UNIQUE INDEX IF NOT EXISTS "product_unit_conversions_product_factor_uq"
  ON "product_unit_conversions" ("product_id", "factor_to_base");

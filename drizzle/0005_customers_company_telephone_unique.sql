CREATE UNIQUE INDEX "customers_company_telephone_active_uq"
  ON "customers" USING btree ("company_id", "telephone")
  WHERE ("is_deleted" = false AND "telephone" IS NOT NULL);

CREATE UNIQUE INDEX "customers_company_telephone2_active_uq"
  ON "customers" USING btree ("company_id", "telephone2")
  WHERE ("is_deleted" = false AND "telephone2" IS NOT NULL);

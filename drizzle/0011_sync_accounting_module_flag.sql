DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'company_modules'
  ) THEN
    UPDATE "companies" c
    SET "use_accounting" = cm."is_enabled"
    FROM "company_modules" cm
    WHERE cm."company_id" = c."id"
      AND cm."module_code" = 'accounting';
  END IF;
END $$;

INSERT INTO "module_catalog" (
  "id",
  "code",
  "name",
  "description",
  "is_core",
  "is_active"
)
VALUES (
  'mod_sticker_print',
  'sticker_print',
  'Sticker Print',
  'Controls parcel sticker printing for each company',
  true,
  true
)
ON CONFLICT DO NOTHING;

INSERT INTO "company_modules" (
  "id",
  "company_id",
  "module_code",
  "is_enabled",
  "enabled_at",
  "disabled_at",
  "configured_by"
)
SELECT
  substr(md5("companies"."id" || ':sticker_print'), 1, 25),
  "companies"."id",
  'sticker_print',
  true,
  now(),
  NULL,
  NULL
FROM "companies"
WHERE NOT EXISTS (
  SELECT 1
  FROM "company_modules"
  WHERE
    "company_modules"."company_id" = "companies"."id"
    AND lower("company_modules"."module_code") = 'sticker_print'
);

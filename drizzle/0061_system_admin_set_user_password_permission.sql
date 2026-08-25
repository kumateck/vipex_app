INSERT INTO "role_permissions" ("id", "role_id", "company_id", "permission")
SELECT
  'rp_' || substr(md5("roles"."id" || ':CanSetUserPassword'), 1, 22),
  "roles"."id",
  "roles"."company_id",
  'CanSetUserPassword'
FROM "roles"
WHERE "roles"."is_deleted" = false
  AND lower(trim("roles"."name")) = 'system admin'
  AND NOT EXISTS (
    SELECT 1
    FROM "role_permissions"
    WHERE "role_permissions"."role_id" = "roles"."id"
      AND "role_permissions"."company_id" = "roles"."company_id"
      AND "role_permissions"."permission" = 'CanSetUserPassword'
  )
ON CONFLICT ("id") DO NOTHING;

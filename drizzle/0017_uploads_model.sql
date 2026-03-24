CREATE TABLE "uploads" (
  "id" varchar(25) PRIMARY KEY NOT NULL,
  "company_id" varchar(25) NOT NULL,
  "model_type" varchar(80) NOT NULL,
  "model_id" varchar(80) NOT NULL,
  "file_name" varchar(255) NOT NULL,
  "content_type" varchar(120) NOT NULL,
  "object_key" varchar(500) NOT NULL,
  "file_url" varchar(500) NOT NULL,
  "size_bytes" double precision NOT NULL,
  "uploaded_by" varchar(25),
  "is_deleted" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "uploads"
  ADD CONSTRAINT "uploads_company_id_companies_id_fk"
  FOREIGN KEY ("company_id")
  REFERENCES "public"."companies"("id")
  ON DELETE no action
  ON UPDATE no action;

ALTER TABLE "uploads"
  ADD CONSTRAINT "uploads_uploaded_by_users_id_fk"
  FOREIGN KEY ("uploaded_by")
  REFERENCES "public"."users"("id")
  ON DELETE no action
  ON UPDATE no action;

CREATE INDEX "uploads_company_model_idx"
  ON "uploads" USING btree ("company_id","model_type","model_id");

CREATE UNIQUE INDEX "uploads_object_key_uq"
  ON "uploads" USING btree ("object_key");

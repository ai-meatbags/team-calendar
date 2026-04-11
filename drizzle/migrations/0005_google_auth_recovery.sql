ALTER TABLE "accounts" ADD COLUMN "auth_status" text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "auth_status_updated_at" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "auth_status_reason" text;--> statement-breakpoint
UPDATE "accounts" SET "auth_status" = 'active' WHERE "auth_status" IS NULL;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "auth_status" SET NOT NULL;

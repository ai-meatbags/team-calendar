ALTER TABLE "team_webhook_subscriptions" ADD COLUMN "jwt_secret_encrypted" text;--> statement-breakpoint
ALTER TABLE "team_webhook_subscriptions" ADD COLUMN "jwt_audience" text;--> statement-breakpoint
ALTER TABLE "team_webhook_subscriptions" ADD COLUMN "secret_last_rotated_at" text;--> statement-breakpoint
UPDATE "team_webhook_subscriptions"
SET
  "jwt_secret_encrypted" = '__teamcal_jwt_secret_cutover_required__',
  "jwt_audience" = 'team-webhook:' || "id"
WHERE "jwt_secret_encrypted" IS NULL OR "jwt_audience" IS NULL;--> statement-breakpoint
ALTER TABLE "team_webhook_subscriptions" ALTER COLUMN "jwt_secret_encrypted" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "team_webhook_subscriptions" ALTER COLUMN "jwt_audience" SET NOT NULL;

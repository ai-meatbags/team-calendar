CREATE TABLE "team_webhook_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id_raw" text NOT NULL,
	"event_type" text DEFAULT 'booking.requested' NOT NULL,
	"target_url" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by_user_id_raw" text NOT NULL,
	"updated_by_user_id_raw" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"last_delivery_status" text DEFAULT 'never' NOT NULL,
	"last_delivery_at" text,
	"last_error" text
);--> statement-breakpoint
CREATE UNIQUE INDEX "team_webhook_subscription_target_uq" ON "team_webhook_subscriptions" USING btree ("team_id_raw","event_type","target_url");

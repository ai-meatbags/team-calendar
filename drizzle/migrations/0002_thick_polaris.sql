ALTER TABLE "rate_limit_counters" ALTER COLUMN "window_start_ms" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "rate_limit_counters" ALTER COLUMN "expires_at_ms" SET DATA TYPE bigint;
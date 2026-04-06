ALTER TABLE "sessions"
ALTER COLUMN "expires" SET DATA TYPE timestamp
USING "expires"::timestamp;--> statement-breakpoint
ALTER TABLE "verification_tokens"
ALTER COLUMN "expires" SET DATA TYPE timestamp
USING "expires"::timestamp;

CREATE TABLE "user_slot_rule_settings" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "days" integer NOT NULL,
  "workday_start_hour" integer NOT NULL,
  "workday_end_hour" integer NOT NULL,
  "min_notice_hours" integer NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "user_slot_rule_settings_user_uq" ON "user_slot_rule_settings" ("user_id");--> statement-breakpoint
CREATE TABLE "team_member_slot_rule_overrides" (
  "id" text PRIMARY KEY NOT NULL,
  "team_member_id" text NOT NULL,
  "days" integer NOT NULL,
  "workday_start_hour" integer NOT NULL,
  "workday_end_hour" integer NOT NULL,
  "min_notice_hours" integer NOT NULL,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "team_member_slot_rule_overrides_member_uq" ON "team_member_slot_rule_overrides" ("team_member_id");--> statement-breakpoint
INSERT INTO "user_slot_rule_settings" (
  "id",
  "user_id",
  "days",
  "workday_start_hour",
  "workday_end_hour",
  "min_notice_hours",
  "created_at",
  "updated_at"
)
SELECT
  'slot-rule-default-' || "id",
  "id",
  14,
  10,
  20,
  12,
  "created_at",
  "updated_at"
FROM "users"
WHERE NOT EXISTS (
  SELECT 1
  FROM "user_slot_rule_settings"
  WHERE "user_slot_rule_settings"."user_id" = "users"."id"
);--> statement-breakpoint

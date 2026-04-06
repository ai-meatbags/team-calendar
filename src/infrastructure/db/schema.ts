import { pgTable, primaryKey, text, integer, uniqueIndex, timestamp, bigint } from 'drizzle-orm/pg-core';
import { SCHEMA_MANIFEST, TABLE_NAMES } from './schema-common';

export const users = pgTable(
  TABLE_NAMES.users,
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    image: text('image'),
    calendarSelectionDefault: text('calendar_selection_default'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => [uniqueIndex('users_email_uq').on(table.email)]
);

export const accounts = pgTable(
  TABLE_NAMES.accounts,
  {
    userId: text('user_id').notNull(),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state')
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
    uniqueIndex('accounts_provider_account_uq').on(table.provider, table.providerAccountId)
  ]
);

export const sessions = pgTable(
  TABLE_NAMES.sessions,
  {
    sessionToken: text('session_token').primaryKey(),
    userId: text('user_id').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull()
  },
  (table) => [uniqueIndex('sessions_session_token_uq').on(table.sessionToken)]
);

export const verificationTokens = pgTable(
  TABLE_NAMES.verificationTokens,
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull()
  },
  (table) => [
    primaryKey({ columns: [table.identifier, table.token] }),
    uniqueIndex('verification_tokens_token_uq').on(table.token)
  ]
);

export const teams = pgTable(
  TABLE_NAMES.teams,
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    shareId: text('share_id').notNull(),
    ownerId: text('owner_id').notNull(),
    privacy: text('privacy').notNull().default('public'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => [uniqueIndex('teams_share_id_uq').on(table.shareId)]
);

export const teamMembers = pgTable(
  TABLE_NAMES.teamMembers,
  {
    id: text('id').primaryKey(),
    teamId: text('team_id').notNull(),
    userId: text('user_id').notNull(),
    memberPublicId: text('member_public_id').notNull(),
    calendarSelection: text('calendar_selection'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => [
    uniqueIndex('team_members_member_public_id_uq').on(table.memberPublicId),
    uniqueIndex('team_members_team_user_uq').on(table.teamId, table.userId)
  ]
);

export const teamWebhookSubscriptions = pgTable(
  TABLE_NAMES.teamWebhookSubscriptions,
  {
    id: text('id').primaryKey(),
    teamIdRaw: text('team_id_raw').notNull(),
    eventType: text('event_type').notNull().default('booking.requested'),
    targetUrl: text('target_url').notNull(),
    status: text('status').notNull().default('active'),
    createdByUserIdRaw: text('created_by_user_id_raw').notNull(),
    updatedByUserIdRaw: text('updated_by_user_id_raw'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    lastDeliveryStatus: text('last_delivery_status').notNull().default('never'),
    lastDeliveryAt: text('last_delivery_at'),
    lastError: text('last_error')
  },
  (table) => [
    uniqueIndex('team_webhook_subscription_target_uq').on(
      table.teamIdRaw,
      table.eventType,
      table.targetUrl
    )
  ]
);

export const rateLimitCounters = pgTable(
  TABLE_NAMES.rateLimitCounters,
  {
    id: text('id').primaryKey(),
    key: text('key').notNull(),
    windowStartMs: bigint('window_start_ms', { mode: 'number' }).notNull(),
    count: integer('count').notNull().default(0),
    expiresAtMs: bigint('expires_at_ms', { mode: 'number' }).notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => [uniqueIndex('rate_limit_key_window_uq').on(table.key, table.windowStartMs)]
);

export const schema = {
  users,
  accounts,
  sessions,
  verificationTokens,
  teams,
  teamMembers,
  teamWebhookSubscriptions,
  rateLimitCounters
};

export const schemaManifest = SCHEMA_MANIFEST;

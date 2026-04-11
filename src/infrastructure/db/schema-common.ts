export const PRIVACY_VALUES = ['public', 'private'] as const;

export const TABLE_NAMES = {
  users: 'users',
  accounts: 'accounts',
  sessions: 'sessions',
  verificationTokens: 'verification_tokens',
  teams: 'teams',
  teamMembers: 'team_members',
  userSlotRuleSettings: 'user_slot_rule_settings',
  teamMemberSlotRuleOverrides: 'team_member_slot_rule_overrides',
  teamWebhookSubscriptions: 'team_webhook_subscriptions',
  rateLimitCounters: 'rate_limit_counters'
} as const;

export const SCHEMA_MANIFEST = {
  users: {
    columns: [
      'id',
      'email',
      'name',
      'image',
      'calendar_selection_default',
      'created_at',
      'updated_at'
    ],
    unique: [['email']],
    notNull: ['id', 'email', 'name', 'created_at', 'updated_at']
  },
  accounts: {
    columns: [
      'user_id',
      'type',
      'provider',
      'provider_account_id',
      'refresh_token',
      'access_token',
      'expires_at',
      'token_type',
      'scope',
      'id_token',
      'session_state'
    ],
    unique: [['provider', 'provider_account_id']],
    notNull: ['user_id', 'type', 'provider', 'provider_account_id']
  },
  sessions: {
    columns: ['session_token', 'user_id', 'expires'],
    unique: [['session_token']],
    notNull: ['session_token', 'user_id', 'expires']
  },
  verification_tokens: {
    columns: ['identifier', 'token', 'expires'],
    unique: [
      ['token'],
      ['identifier', 'token']
    ],
    notNull: ['identifier', 'token', 'expires']
  },
  teams: {
    columns: ['id', 'name', 'share_id', 'owner_id', 'privacy', 'created_at', 'updated_at'],
    unique: [['share_id']],
    notNull: ['id', 'name', 'share_id', 'owner_id', 'privacy', 'created_at', 'updated_at']
  },
  team_members: {
    columns: [
      'id',
      'team_id',
      'user_id',
      'member_public_id',
      'calendar_selection',
      'created_at',
      'updated_at'
    ],
    unique: [
      ['member_public_id'],
      ['team_id', 'user_id']
    ],
    notNull: ['id', 'team_id', 'user_id', 'member_public_id', 'created_at', 'updated_at']
  },
  user_slot_rule_settings: {
    columns: [
      'id',
      'user_id',
      'days',
      'workday_start_hour',
      'workday_end_hour',
      'min_notice_hours',
      'created_at',
      'updated_at'
    ],
    unique: [['user_id']],
    notNull: [
      'id',
      'user_id',
      'days',
      'workday_start_hour',
      'workday_end_hour',
      'min_notice_hours',
      'created_at',
      'updated_at'
    ]
  },
  team_member_slot_rule_overrides: {
    columns: [
      'id',
      'team_member_id',
      'days',
      'workday_start_hour',
      'workday_end_hour',
      'min_notice_hours',
      'created_at',
      'updated_at'
    ],
    unique: [['team_member_id']],
    notNull: [
      'id',
      'team_member_id',
      'days',
      'workday_start_hour',
      'workday_end_hour',
      'min_notice_hours',
      'created_at',
      'updated_at'
    ]
  },
  team_webhook_subscriptions: {
    columns: [
      'id',
      'team_id_raw',
      'event_type',
      'target_url',
      'status',
      'created_by_user_id_raw',
      'updated_by_user_id_raw',
      'created_at',
      'updated_at',
      'last_delivery_status',
      'last_delivery_at',
      'last_error',
      'jwt_secret_encrypted',
      'jwt_audience',
      'secret_last_rotated_at'
    ],
    unique: [['team_id_raw', 'event_type', 'target_url']],
    notNull: [
      'id',
      'team_id_raw',
      'event_type',
      'target_url',
      'status',
      'created_by_user_id_raw',
      'created_at',
      'updated_at',
      'last_delivery_status',
      'jwt_secret_encrypted',
      'jwt_audience'
    ]
  },
  rate_limit_counters: {
    columns: ['id', 'key', 'window_start_ms', 'count', 'expires_at_ms', 'created_at', 'updated_at'],
    unique: [['key', 'window_start_ms']],
    notNull: ['id', 'key', 'window_start_ms', 'count', 'expires_at_ms', 'created_at', 'updated_at']
  }
} as const;

export type PrivacyValue = (typeof PRIVACY_VALUES)[number];

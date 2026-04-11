import { randomUUID } from 'node:crypto';
import { auth } from '@/infrastructure/auth/auth-options';
import { getServerRuntime } from '@/composition/server-runtime';
import { isSameOriginRequest } from '@/interface/http/request';
import { createTeamSlotRulesDeleteHandler, createTeamSlotRulesPatchHandler } from './handler';

export const runtime = 'nodejs';

export const PATCH = createTeamSlotRulesPatchHandler({
  auth,
  createDbClient: () => getServerRuntime().dbClient,
  generateId: randomUUID,
  isSameOriginRequest
});

export const DELETE = createTeamSlotRulesDeleteHandler({
  auth,
  createDbClient: () => getServerRuntime().dbClient,
  generateId: randomUUID,
  isSameOriginRequest
});

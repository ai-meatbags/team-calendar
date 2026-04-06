import crypto from 'node:crypto';
import { auth } from '@/infrastructure/auth/auth-options';
import { getServerRuntime } from '@/composition/server-runtime';
import { isSameOriginRequest } from '@/interface/http/request';
import { createTeamsGetHandler, createTeamsPostHandler } from './teams-handler';

export const runtime = 'nodejs';

function generateShareId() {
  return crypto.randomBytes(9).toString('base64url');
}

function generateMemberPublicId() {
  return crypto.randomBytes(12).toString('base64url');
}

export const GET = createTeamsGetHandler({
  auth,
  createDbClient: () => getServerRuntime().dbClient,
  generateId: crypto.randomUUID,
  generateMemberPublicId,
  generateShareId,
  isSameOriginRequest
});

export const POST = createTeamsPostHandler({
  auth,
  createDbClient: () => getServerRuntime().dbClient,
  generateId: crypto.randomUUID,
  generateMemberPublicId,
  generateShareId,
  isSameOriginRequest
});

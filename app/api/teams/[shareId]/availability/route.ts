import { enforceDbRateLimit } from '@/infrastructure/ratelimit/db-rate-limit';
import { getClientFingerprint } from '@/interface/http/request';
import { fetchBusyIntervals } from '@/infrastructure/google/freebusy';
import { getServerRuntime } from '@/composition/server-runtime';
import {
  createAvailabilityGetHandler,
  type AvailabilityRouteDeps
} from './get-handler';

export const runtime = 'nodejs';

const availabilityRouteDeps: AvailabilityRouteDeps = {
  createDbClient: () => getServerRuntime().dbClient,
  getConfig: () => getServerRuntime().env,
  getTokenVault: () => getServerRuntime().tokenVault,
  enforceDbRateLimit: (input) =>
    enforceDbRateLimit(input, {
      createDbClient: () => getServerRuntime().dbClient
    }),
  fetchBusyIntervals,
  getClientFingerprint
};

export const GET = createAvailabilityGetHandler(availabilityRouteDeps);

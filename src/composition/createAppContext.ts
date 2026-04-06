import { getServerRuntime } from './server-runtime';

export function createAppContext() {
  return getServerRuntime();
}

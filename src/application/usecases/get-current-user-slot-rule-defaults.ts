import { unauthorizedError } from '@/application/errors';
import { findUserById, requireUserDefaults, type SlotRuleSettingsDeps } from './slot-rule-settings-shared';

export async function getCurrentUserSlotRuleDefaults(userId: string, deps: SlotRuleSettingsDeps) {
  const user = await findUserById(deps.createDbClient, userId);
  if (!user) {
    throw unauthorizedError();
  }

  return {
    slotRuleDefaults: await requireUserDefaults(userId, deps)
  };
}

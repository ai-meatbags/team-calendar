import { badRequestError, unauthorizedError } from '@/application/errors';
import { parseSlotRuleSettingsStrict } from '@/domain/slot-rules';
import { eq } from 'drizzle-orm';
import {
  findUserById,
  getDbHandles,
  requireUserDefaults,
  toSlotRuleValues,
  type SlotRuleSettingsDeps
} from './slot-rule-settings-shared';

export async function patchCurrentUserSlotRuleDefaults(
  userId: string,
  payload: unknown,
  deps: SlotRuleSettingsDeps
) {
  const user = await findUserById(deps.createDbClient, userId);
  if (!user) {
    throw unauthorizedError();
  }
  await requireUserDefaults(userId, deps);

  const { settings, error } = parseSlotRuleSettingsStrict(payload);
  if (error || !settings) {
    throw badRequestError(error?.message || 'Invalid slot rule settings payload.', error?.code);
  }

  const { db, schema } = getDbHandles(deps.createDbClient);
  await db
    .update(schema.userSlotRuleSettings)
    .set({
      ...toSlotRuleValues(settings),
      updatedAt: new Date().toISOString()
    })
    .where(eq(schema.userSlotRuleSettings.userId, userId));

  return {
    slotRuleDefaults: settings
  };
}

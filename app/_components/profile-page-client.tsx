'use client';

import React from 'react';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { SYSTEM_SLOT_RULE_DEFAULTS, type SlotRuleSettings } from '@/domain/slot-rules';
import { useApp } from './app-context';
import { ProfileSettingsCard } from './profile-settings-card';
import { shouldRedirectProfile } from './profile-state';

export default function ProfilePageClient() {
  const { currentUser, isLoading, apiFetch, loadCurrentUser, showToast } = useApp();
  const [nameDraft, setNameDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [slotRuleDefaults, setSlotRuleDefaults] = useState<SlotRuleSettings>({ ...SYSTEM_SLOT_RULE_DEFAULTS });
  const [isSlotRuleLoading, setIsSlotRuleLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    setNameDraft(String(currentUser.name || '').trim());
  }, [currentUser]);

  useEffect(() => {
    if (shouldRedirectProfile({ hasUser: Boolean(currentUser), isLoading })) {
      router.replace('/');
    }
  }, [currentUser, isLoading, router]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    let isCancelled = false;
    setIsSlotRuleLoading(true);
    setProfileStatus('');
    void apiFetch('/api/me/settings')
      .then((data) => {
        if (isCancelled) {
          return;
        }

        const payload = data as { slotRuleDefaults?: Partial<SlotRuleSettings> };
        setSlotRuleDefaults({
          days: Number(payload.slotRuleDefaults?.days ?? SYSTEM_SLOT_RULE_DEFAULTS.days),
          workdayStartHour: Number(
            payload.slotRuleDefaults?.workdayStartHour ?? SYSTEM_SLOT_RULE_DEFAULTS.workdayStartHour
          ),
          workdayEndHour: Number(
            payload.slotRuleDefaults?.workdayEndHour ?? SYSTEM_SLOT_RULE_DEFAULTS.workdayEndHour
          ),
          minNoticeHours: Number(
            payload.slotRuleDefaults?.minNoticeHours ?? SYSTEM_SLOT_RULE_DEFAULTS.minNoticeHours
          )
        });
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Не удалось загрузить правила по умолчанию';
        setProfileStatus(message || 'Не удалось загрузить правила по умолчанию');
      })
      .finally(() => {
        if (!isCancelled) {
          setIsSlotRuleLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [apiFetch, currentUser]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(nameDraft || '').trim();
    if (!name) {
      showToast('Введите имя.');
      return;
    }
    setProfileStatus('');
    setIsSaving(true);
    try {
      const userData = (await apiFetch('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ name })
      })) as { name?: string };
      setNameDraft(String(userData?.name || name));

      const settingsData = (await apiFetch('/api/me/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          slotRuleDefaults
        })
      })) as { slotRuleDefaults?: SlotRuleSettings };
      if (settingsData.slotRuleDefaults) {
        setSlotRuleDefaults(settingsData.slotRuleDefaults);
      }

      await loadCurrentUser();
      showToast('Профиль сохранён.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось сохранить профиль.';
      setProfileStatus(message || 'Не удалось сохранить профиль.');
      showToast(message || 'Не удалось сохранить профиль.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || !currentUser) {
    return null;
  }

  return (
    <ProfileSettingsCard
      isSaving={isSaving}
      nameDraft={nameDraft}
      slotRuleSettings={slotRuleDefaults}
      isLoadingSlotRules={isSlotRuleLoading}
      status={profileStatus}
      onNameChange={setNameDraft}
      onSubmit={handleSubmit}
      onSlotRuleChange={(key, value) => {
        setSlotRuleDefaults((current) => ({
          ...current,
          [key]: value
        }));
      }}
    />
  );
}

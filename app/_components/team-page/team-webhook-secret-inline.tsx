'use client';

import React from 'react';
import { TeamWebhookSecretField } from './team-webhook-secret-field';

export function TeamWebhookSecretInline({
  sharedSecret,
  onCopy
}: {
  sharedSecret: string;
  onCopy: () => void;
}) {
  return (
    <div className="min-w-0">
      <TeamWebhookSecretField value={sharedSecret} onCopy={onCopy} />
    </div>
  );
}

'use client';

import React from 'react';

export function TeamSettingsSectionCard({
  title,
  description,
  meta,
  children,
  className = ''
}: {
  title: string;
  description?: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`profile-settings-card__section team-settings-section ${className}`.trim()}>
      <div className="team-settings-section__header">
        <div className="profile-settings-card__section-copy">
          <h2>{title}</h2>
          {description ? <p className="panel__meta">{description}</p> : null}
        </div>
        {meta ? <div className="team-settings-section__meta">{meta}</div> : null}
      </div>
      <div className="team-settings-section__body">{children}</div>
    </section>
  );
}

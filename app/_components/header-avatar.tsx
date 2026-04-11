'use client';

import React from 'react';
import { ProfileIcon } from './icons/profile-icon';

export function HeaderAvatar({
  picture,
  label
}: {
  picture: string | null | undefined;
  label: string;
}) {
  if (picture) {
    return (
      <img
        className="user-menu__avatar"
        src={picture}
        alt={`Аватар ${label}`}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span className="user-menu__avatar user-menu__avatar--fallback" aria-hidden="true">
      <ProfileIcon />
    </span>
  );
}

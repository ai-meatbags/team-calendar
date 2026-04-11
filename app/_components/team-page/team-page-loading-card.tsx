'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { SlotsSkeleton } from './team-page-slot-skeleton';

function LoadingActionShell() {
  return (
    <div className="team-page-loading__actions" aria-hidden="true">
      <span className="team-page-loading__control team-page-loading__control--toggle">
        <span className="team-page-loading__control-segment" />
        <span className="team-page-loading__control-segment team-page-loading__control-segment--active" />
      </span>
      <span className="team-page-loading__control team-page-loading__control--button" />
      <span className="team-page-loading__control team-page-loading__control--icon" />
    </div>
  );
}

function LoadingFilters() {
  return (
    <div className="team-members" aria-hidden="true">
      <div className="team-members__row">
        <div className="toggle team-duration-toggle--skeleton">
          <span className="team-toggle-segment--skeleton">
            <span className="skeleton-line skeleton-line--short" />
          </span>
          <span className="team-toggle-segment--skeleton">
            <span className="skeleton-line skeleton-line--short" />
          </span>
        </div>
        <div className="toggle team-member-toggle team-member-toggle--skeleton">
          {Array.from({ length: 3 }).map((_, index) => (
            <span className="team-toggle-segment--skeleton" key={index}>
              <span className="skeleton-avatar" />
              <span className="skeleton-line skeleton-line--short" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TeamPageLoadingCard() {
  return (
    <Card className="team-page-card team-page-card--loading">
      <CardHeader className="team-page-card__header">
        <div className="team-page-loading__header" aria-hidden="true">
          <div className="team-page-loading__copy">
            <span className="skeleton-line team-page-loading__title" />
            <span className="skeleton-line team-page-loading__summary" />
          </div>
          <LoadingActionShell />
        </div>
      </CardHeader>
      <CardContent className="team-page-card__content">
        <LoadingFilters />
        <SlotsSkeleton mode="week" />
      </CardContent>
    </Card>
  );
}

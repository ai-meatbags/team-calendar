'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { useApp } from '../app-context';
import { getMemberDisplayName } from './team-page-members';
import { buildTeamPageShareToastMessage } from './team-page-time';
import { useTeamPageActions } from './team-page-actions';
import { useTeamPageAvailability } from './team-page-availability-hooks';
import { useTeamPageBooking } from './team-page-booking-hooks';
import {
  useDurationFilter,
  useMemberFilter,
  useTeamPageCore
} from './team-page-hooks';
import { TeamBookingModal } from './team-page-booking-modal';
import { NotFoundPanel } from './team-page-empty-state';
import { TeamHeaderActions, TeamHeaderControls } from './team-page-header';
import { TeamPageLoadingCard } from './team-page-loading-card';
import { TeamPageSlotRulesSummary } from './team-page-slot-rules-summary';
import { SlotsView, usePersistentSlotViewMode } from './team-page-slots-section';
import { SlotViewToggle } from './team-page-slot-view-toggle';

type TeamPageClientProps = {
  shareId: string;
};

export default function TeamPageClient({ shareId }: TeamPageClientProps) {
  const router = useRouter();
  const { apiFetch, showToast, openAuthPopup, currentUser } = useApp();
  const hasUser = Boolean(currentUser);

  const teamCore = useTeamPageCore({ shareId, apiFetch });
  const members = teamCore.teamData?.members || [];
  const isMember = Boolean(teamCore.teamData?.isMember);
  const durationFilter = useDurationFilter();
  const memberFilter = useMemberFilter({
    members,
    isEnabled: Boolean(teamCore.teamData)
  });
  const selectedMemberPublicId = memberFilter.selectedMemberPublicId;

  const targetMembers = useMemo(() => {
    if (!members.length) {
      return [];
    }
    return selectedMemberPublicId
      ? members.filter((member) => member.memberPublicId === selectedMemberPublicId)
      : members;
  }, [members, selectedMemberPublicId]);

  const selectedMemberName = useMemo(() => {
    if (!selectedMemberPublicId) {
      return '';
    }
    const selectedMember = members.find((member) => member.memberPublicId === selectedMemberPublicId);
    return selectedMember ? getMemberDisplayName(selectedMember) : '';
  }, [members, selectedMemberPublicId]);

  const availability = useTeamPageAvailability({
    shareId,
    apiFetch,
    isEnabled: Boolean(teamCore.teamData),
    selectedMemberPublicId,
    duration: durationFilter.duration
  });
  const { preferredViewMode, setPreferredViewMode } = usePersistentSlotViewMode('week');

  const booking = useTeamPageBooking({
    shareId,
    teamName: teamCore.teamName,
    apiFetch,
    showToast,
    currentUser,
    selectionMode: selectedMemberPublicId ? 'single' : 'all',
    selectedMembers: targetMembers
  });

  const actions = useTeamPageActions({
    shareId,
    hasUser,
    openAuthPopup,
    apiFetch,
    showToast,
    shareToastMessage: buildTeamPageShareToastMessage(selectedMemberName, durationFilter.duration),
    refresh: teamCore.refresh,
    navigateHome: () => router.push('/')
  });

  if (teamCore.notFound) {
    return <NotFoundPanel />;
  }

  if (!teamCore.teamData) {
    return <TeamPageLoadingCard />;
  }

  const slotViewToggle = (
    <SlotViewToggle mode={preferredViewMode} onModeChange={setPreferredViewMode} />
  );

  return (
    <>
      <Card className="team-page-card">
        <CardHeader className="team-page-card__header">
          <TeamHeaderActions
            teamName={teamCore.teamName}
            isMember={isMember}
            hasUser={hasUser}
            canJoin={Boolean(teamCore.teamData?.canJoin)}
            onJoin={actions.handleJoin}
            onShare={actions.handleShare}
            settingsHref={`/t/${shareId}/settings`}
            slotViewToggle={slotViewToggle}
          />
          <TeamPageSlotRulesSummary settingsSummary={availability.settingsSummary} />
        </CardHeader>
        <CardContent className="team-page-card__content">
          <TeamHeaderControls
            members={members}
            isMembersLoading={!teamCore.teamData}
            selectedMemberPublicId={selectedMemberPublicId}
            duration={durationFilter.duration}
            onDurationChange={durationFilter.setDuration}
            isSwitchesDisabled={availability.isSlotsLoading || !teamCore.teamData}
            onMemberFilterChange={memberFilter.setMemberFilter}
          />
          <SlotsView
            slots={availability.slots}
            isLoading={availability.isSlotsLoading}
            hasLoadedOnce={availability.hasLoadedOnce}
            slotsStatus={availability.slotsStatus}
            settingsSummary={availability.settingsSummary}
            onSlotClick={booking.openSlot}
            withCardShell={false}
            showRules={false}
            showTitle={false}
            showViewToggle={false}
            preferredViewMode={preferredViewMode}
            onPreferredViewModeChange={setPreferredViewMode}
          />
        </CardContent>
      </Card>

      <TeamBookingModal booking={booking} onClose={booking.closeBooking} />
    </>
  );
}

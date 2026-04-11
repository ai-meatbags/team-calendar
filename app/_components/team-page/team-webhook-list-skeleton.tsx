import React from 'react';
import { Skeleton } from '../../../components/ui/skeleton';

function TeamWebhookListSkeletonRow() {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 py-1">
        <div className="row-start-1 self-center">
        <Skeleton className="h-8 w-14 rounded-full bg-slate-900/10" />
        </div>
        <div className="row-start-1 min-w-0 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
          <Skeleton className="h-6 w-12 rounded-full bg-slate-900/10" />
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-6 w-full rounded-md bg-slate-900/10" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Skeleton className="h-8 w-52 rounded-full bg-slate-900/10" />
              <Skeleton className="h-8 w-28 rounded-full bg-red-100/90" />
            </div>
          </div>
        </div>
        <div className="col-start-2 min-w-0 grid gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-3 rounded-full bg-emerald-200/90" />
            <Skeleton className="h-5 w-40 rounded-md bg-slate-900/10" />
          </div>
        </div>
    </div>
  );
}

export function TeamWebhookListSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <TeamWebhookListSkeletonRow />
    </div>
  );
}

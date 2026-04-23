/**
 * Reusable loading, error, and empty state components for compliance UI.
 */

"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ─── Loading skeleton for the rule list table ────────────────────

export function RuleListSkeleton() {
  return (
    <div className="space-y-3" data-testid="rule-list-skeleton">
      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      {/* Table header */}
      <Skeleton className="h-10 w-full" />
      {/* Table rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

// ─── Loading skeleton for the rule detail page ───────────────────

export function RuleDetailSkeleton() {
  return (
    <div className="space-y-6" data-testid="rule-detail-skeleton">
      <Skeleton className="h-8 w-96" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

// ─── Error state ─────────────────────────────────────────────────

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Alert variant="destructive" data-testid="error-state">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-1">
        {message}
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-2 underline underline-offset-4 hover:no-underline"
          >
            Try again
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// ─── Empty state ─────────────────────────────────────────────────

export function EmptyState({
  title = "No rules found",
  message = "There are no compliance rules matching your criteria.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center"
      data-testid="empty-state"
    >
      <p className="text-lg font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

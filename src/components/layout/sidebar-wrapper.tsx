"use client";

import React from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/get-fetcher';
import { AppSidebar } from './sidebar';

export function SidebarWrapper() {
  // Fetch sessions data at parent level with disabled auto-revalidation
  const { data: sessions = [], error, isLoading, mutate } = useSWR('/sessions', fetcher, {
    revalidateOnFocus: false,    // Don't revalidate when window regains focus
    revalidateOnReconnect: false, // Don't revalidate when network reconnects
    revalidateIfStale: false,   // Don't revalidate if data is stale
    revalidateOnMount: true,    // Only revalidate on mount
    dedupingInterval: 0,        // Disable deduplication
  });

  return (
    <AppSidebar 
      sessions={sessions}
      error={error}
      isLoading={isLoading}
      mutate={mutate}
    />
  );
}

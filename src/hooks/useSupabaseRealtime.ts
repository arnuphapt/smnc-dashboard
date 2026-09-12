'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient, QueryKey } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface RealtimeChannelConfig {
  /** Unique channel name (must not collide with any other subscribed channel). */
  channelName: string
  table: string
  /** Optional postgres_changes filter, e.g. `category=eq.research`. */
  filter?: string
  /** Query keys to invalidate on any change event for this table. */
  queryKeys?: QueryKey[]
  /** Optional extra side-effect to run on any change event (e.g. a manual refetch function). */
  onEvent?: () => void
}

/**
 * Subscribes to one or more Supabase realtime channels for the lifetime of the
 * calling component, invalidating React Query keys and/or calling a custom
 * callback on any postgres_changes event.
 *
 * `channels` may be a fresh array/object literal on every render — only the
 * primitive shape (channel name/table/filter) is used as the effect's
 * dependency (via a stable serialized key), so passing a new array identity
 * each render does NOT cause a re-subscribe loop. The `queryKeys`/`onEvent`
 * callbacks are read from a ref updated every render, so they always see
 * fresh closures without needing to be in the dependency array.
 */
export function useSupabaseRealtime(channels: RealtimeChannelConfig[]) {
  const queryClient = useQueryClient()
  const channelsRef = useRef(channels)
  channelsRef.current = channels

  // Only the parts that determine *which* channels to open are allowed to
  // trigger a re-subscribe — not the callback identities.
  const subscriptionKey = channels.map((c) => `${c.channelName}|${c.table}|${c.filter || ''}`).join(',')

  useEffect(() => {
    const current = channelsRef.current
    const liveChannels = current.map((cfg) =>
      supabase
        .channel(cfg.channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: cfg.table, ...(cfg.filter ? { filter: cfg.filter } : {}) },
          () => {
            const latest = channelsRef.current.find((c) => c.channelName === cfg.channelName)
            latest?.queryKeys?.forEach((key) => queryClient.invalidateQueries({ queryKey: key }))
            latest?.onEvent?.()
          }
        )
        .subscribe()
    )

    return () => {
      liveChannels.forEach((ch) => supabase.removeChannel(ch))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionKey, queryClient])
}

import { supabase } from './supabase';
import type { EventRsvp, EventRsvpCounts, EventRsvpStatus } from '../types';

const RSVP_STORAGE_PREFIX = 'event_rsvp_';

export function getStoredAnonymousToken(eventId: string): string | null {
  return localStorage.getItem(`${RSVP_STORAGE_PREFIX}${eventId}`);
}

export function setStoredAnonymousToken(eventId: string, token: string): void {
  localStorage.setItem(`${RSVP_STORAGE_PREFIX}${eventId}`, token);
}

export const eventRsvpsService = {
  async getCounts(eventId: string): Promise<EventRsvpCounts> {
    const { data, error } = await supabase.rpc('get_event_rsvp_counts', {
      p_event_id: eventId,
    });

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    return {
      attending: Number(row?.attending ?? 0),
      maybe: Number(row?.maybe ?? 0),
      not_attending: Number(row?.not_attending ?? 0),
    };
  },

  async getForVisitor(
    eventId: string,
    anonymousToken?: string | null
  ): Promise<EventRsvp | null> {
    const token = anonymousToken ?? getStoredAnonymousToken(eventId);

    const { data, error } = await supabase.rpc('get_event_rsvp_for_visitor', {
      p_event_id: eventId,
      p_anonymous_token: token || null,
    });

    if (error) throw error;
    return data || null;
  },

  async upsert(params: {
    eventId: string;
    status: EventRsvpStatus;
    guestName?: string;
    memberId?: string;
    anonymousToken?: string | null;
  }): Promise<{ rsvp: EventRsvp; anonymousToken?: string }> {
    const storedToken =
      params.anonymousToken ?? getStoredAnonymousToken(params.eventId);

    const { data, error } = await supabase.rpc('upsert_event_rsvp', {
      p_event_id: params.eventId,
      p_status: params.status,
      p_guest_name: params.guestName ?? null,
      p_anonymous_token: storedToken || null,
      p_member_id: params.memberId ?? null,
    });

    if (error) throw error;

    const rsvp = data as EventRsvp;

    if (!rsvp.user_id && rsvp.anonymous_token) {
      setStoredAnonymousToken(params.eventId, rsvp.anonymous_token);
    }

    return {
      rsvp,
      anonymousToken: rsvp.anonymous_token,
    };
  },
};

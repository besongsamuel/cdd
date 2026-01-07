import { supabase } from './supabase';
import type { OutreachEvent } from '../types';

export const outreachEventsService = {
  async getAll(): Promise<OutreachEvent[]> {
    const { data, error } = await supabase
      .from('outreach_events')
      .select('*, ministries(name)')
      .order('event_date', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      ministry_name: item.ministries?.name,
    }));
  },

  async getByMinistry(ministryId: string): Promise<OutreachEvent[]> {
    const { data, error } = await supabase
      .from('outreach_events')
      .select('*, ministries(name)')
      .eq('ministry_id', ministryId)
      .order('event_date', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      ministry_name: item.ministries?.name,
    }));
  },

  async getById(id: string): Promise<OutreachEvent> {
    const { data, error } = await supabase
      .from('outreach_events')
      .select('*, ministries(name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return {
      ...data,
      ministry_name: (data as any).ministries?.name,
    };
  },

  async create(
    event: Omit<OutreachEvent, 'id' | 'created_at' | 'updated_at' | 'ministry_name'>
  ): Promise<OutreachEvent> {
    const { data, error } = await supabase
      .from('outreach_events')
      .insert(event)
      .select('*, ministries(name)')
      .single();

    if (error) throw error;
    return {
      ...data,
      ministry_name: (data as any).ministries?.name,
    };
  },

  async update(
    id: string,
    event: Partial<Omit<OutreachEvent, 'id' | 'created_at' | 'updated_at' | 'ministry_name'>>
  ): Promise<OutreachEvent> {
    const { data, error } = await supabase
      .from('outreach_events')
      .update({ ...event, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, ministries(name)')
      .single();

    if (error) throw error;
    return {
      ...data,
      ministry_name: (data as any).ministries?.name,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('outreach_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};


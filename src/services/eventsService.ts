import { supabase } from './supabase';
import type { Event } from '../types';
import { slugify, slugWithSuffix } from '../utils/slugify';

const eventSelect = `
  *,
  ministries:ministry_id ( name ),
  departments:department_id ( name )
`;

function mapEvent(row: Record<string, unknown>): Event {
  const ministries = row.ministries as { name?: string } | null;
  const departments = row.departments as { name?: string } | null;
  const { ministries: _m, departments: _d, ...rest } = row;

  return {
    ...(rest as unknown as Event),
    ministry_name: ministries?.name,
    department_name: departments?.name,
  };
}

async function generateUniqueSlug(
  title: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(title);
  let suffix = 1;
  let candidate = base;

  while (!(await eventsService.isSlugAvailable(candidate, excludeId))) {
    suffix += 1;
    candidate = slugWithSuffix(base, suffix);
  }

  return candidate;
}

export const eventsService = {
  async getAll(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select(eventSelect)
      .order('event_date', { ascending: true });

    if (error) throw error;
    return (data || []).map((row) => mapEvent(row as Record<string, unknown>));
  },

  async getBySlug(slug: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select(eventSelect)
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapEvent(data as Record<string, unknown>);
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select(eventSelect)
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true });

    if (error) throw error;
    return (data || []).map((row) => mapEvent(row as Record<string, unknown>));
  },

  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    let query = supabase.from('events').select('id').eq('slug', slug);
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return !data;
  },

  async create(
    event: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'ministry_name' | 'department_name'>
  ): Promise<Event> {
    const slug =
      event.slug?.trim() ||
      (await generateUniqueSlug(event.title));

    const payload = {
      title: event.title,
      description: event.description ?? null,
      event_date: event.event_date,
      event_time: event.event_time ?? null,
      location: event.location ?? null,
      slug,
      image_url: event.image_url ?? null,
      ministry_id: event.ministry_id ?? null,
      department_id: event.department_id ?? null,
    };

    const { data, error } = await supabase
      .from('events')
      .insert(payload)
      .select(eventSelect)
      .single();

    if (error) throw error;
    return mapEvent(data as Record<string, unknown>);
  },

  async update(
    id: string,
    event: Partial<Omit<Event, 'ministry_name' | 'department_name'>>
  ): Promise<Event> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (event.title !== undefined) updatePayload.title = event.title;
    if (event.description !== undefined) updatePayload.description = event.description;
    if (event.event_date !== undefined) updatePayload.event_date = event.event_date;
    if (event.event_time !== undefined) updatePayload.event_time = event.event_time;
    if (event.location !== undefined) updatePayload.location = event.location;
    if (event.slug !== undefined) updatePayload.slug = event.slug;
    if (event.image_url !== undefined) updatePayload.image_url = event.image_url;
    if (event.ministry_id !== undefined) updatePayload.ministry_id = event.ministry_id;
    if (event.department_id !== undefined) updatePayload.department_id = event.department_id;

    const { data, error } = await supabase
      .from('events')
      .update(updatePayload)
      .eq('id', id)
      .select(eventSelect)
      .single();

    if (error) throw error;
    return mapEvent(data as Record<string, unknown>);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
  },

  generateUniqueSlug,
};

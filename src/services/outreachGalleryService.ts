import { supabase } from './supabase';
import type { OutreachGalleryPhoto } from '../types';

export const outreachGalleryService = {
  async getAll(): Promise<OutreachGalleryPhoto[]> {
    const { data, error } = await supabase
      .from('outreach_gallery_photos')
      .select('*, outreach_events(title, ministry_id, ministries(name))')
      .order('taken_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      outreach_event_title: item.outreach_events?.title,
      ministry_id: item.outreach_events?.ministry_id,
      ministry_name: item.outreach_events?.ministries?.name,
    }));
  },

  async getByEvent(eventId: string): Promise<OutreachGalleryPhoto[]> {
    const { data, error } = await supabase
      .from('outreach_gallery_photos')
      .select('*, outreach_events(title, ministry_id, ministries(name))')
      .eq('outreach_event_id', eventId)
      .order('is_cover', { ascending: false }) // Cover photos first
      .order('taken_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      outreach_event_title: item.outreach_events?.title,
      ministry_id: item.outreach_events?.ministry_id,
      ministry_name: item.outreach_events?.ministries?.name,
    }));
  },

  async getByMinistry(ministryId: string): Promise<OutreachGalleryPhoto[]> {
    const { data, error } = await supabase
      .from('outreach_gallery_photos')
      .select('*, outreach_events!inner(title, ministry_id, ministries(name))')
      .eq('outreach_events.ministry_id', ministryId)
      .order('taken_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      outreach_event_title: item.outreach_events?.title,
      ministry_id: item.outreach_events?.ministry_id,
      ministry_name: item.outreach_events?.ministries?.name,
    }));
  },

  async create(
    photo: Omit<OutreachGalleryPhoto, 'id' | 'created_at' | 'outreach_event_title' | 'ministry_id' | 'ministry_name'>
  ): Promise<OutreachGalleryPhoto> {
    const { data, error } = await supabase
      .from('outreach_gallery_photos')
      .insert(photo)
      .select('*, outreach_events(title, ministry_id, ministries(name))')
      .single();

    if (error) throw error;
    return {
      ...data,
      outreach_event_title: (data as any).outreach_events?.title,
      ministry_id: (data as any).outreach_events?.ministry_id,
      ministry_name: (data as any).outreach_events?.ministries?.name,
    };
  },

  async createMultiple(
    photos: Omit<OutreachGalleryPhoto, 'id' | 'created_at' | 'outreach_event_title' | 'ministry_id' | 'ministry_name'>[]
  ): Promise<OutreachGalleryPhoto[]> {
    const { data, error } = await supabase
      .from('outreach_gallery_photos')
      .insert(photos)
      .select('*, outreach_events(title, ministry_id, ministries(name))');

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      outreach_event_title: item.outreach_events?.title,
      ministry_id: item.outreach_events?.ministry_id,
      ministry_name: item.outreach_events?.ministries?.name,
    }));
  },

  async update(
    id: string,
    photo: Partial<Omit<OutreachGalleryPhoto, 'id' | 'created_at' | 'outreach_event_title' | 'ministry_id' | 'ministry_name'>>
  ): Promise<OutreachGalleryPhoto> {
    const { data, error } = await supabase
      .from('outreach_gallery_photos')
      .update(photo)
      .eq('id', id)
      .select('*, outreach_events(title, ministry_id, ministries(name))')
      .single();

    if (error) throw error;
    return {
      ...data,
      outreach_event_title: (data as any).outreach_events?.title,
      ministry_id: (data as any).outreach_events?.ministry_id,
      ministry_name: (data as any).outreach_events?.ministries?.name,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('outreach_gallery_photos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async setCoverPhoto(photoId: string, eventId: string): Promise<OutreachGalleryPhoto> {
    // First, unset all cover photos for this event
    await supabase
      .from('outreach_gallery_photos')
      .update({ is_cover: false })
      .eq('outreach_event_id', eventId)
      .eq('is_cover', true);

    // Then set this photo as cover
    const { data, error } = await supabase
      .from('outreach_gallery_photos')
      .update({ is_cover: true })
      .eq('id', photoId)
      .select('*, outreach_events(title, ministry_id, ministries(name))')
      .single();

    if (error) throw error;
    return {
      ...data,
      outreach_event_title: (data as any).outreach_events?.title,
      ministry_id: (data as any).outreach_events?.ministry_id,
      ministry_name: (data as any).outreach_events?.ministries?.name,
    };
  },
};


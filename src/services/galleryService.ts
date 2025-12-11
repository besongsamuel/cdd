import { supabase } from './supabase';
import type { GalleryPhoto } from '../types';

export const galleryService = {
  async getAll(): Promise<GalleryPhoto[]> {
    const { data, error } = await supabase
      .from('gallery_photos')
      .select('*, events(title)')
      .order('taken_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      ...item,
      event_name: item.events?.title,
    }));
  },

  async getByEvent(eventId: string): Promise<GalleryPhoto[]> {
    const { data, error } = await supabase
      .from('gallery_photos')
      .select('*')
      .eq('event_id', eventId)
      .order('taken_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(photo: Omit<GalleryPhoto, 'id' | 'created_at'>): Promise<GalleryPhoto> {
    const { data, error } = await supabase
      .from('gallery_photos')
      .insert(photo)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, photo: Partial<GalleryPhoto>): Promise<GalleryPhoto> {
    const { data, error } = await supabase
      .from('gallery_photos')
      .update(photo)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('gallery_photos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};


import { supabase } from './supabase';
import type { ChurchInfo } from '../types';

export const churchInfoService = {
  async get(): Promise<ChurchInfo | null> {
    const { data, error } = await supabase
      .from('church_info')
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }
    return data;
  },

  async update(info: Partial<ChurchInfo>): Promise<ChurchInfo> {
    const { data, error } = await supabase
      .from('church_info')
      .update({ ...info, updated_at: new Date().toISOString() })
      .eq('id', info.id || '1')
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async create(info: Omit<ChurchInfo, 'id' | 'updated_at'>): Promise<ChurchInfo> {
    const { data, error } = await supabase
      .from('church_info')
      .insert(info)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};







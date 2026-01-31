import { supabase } from './supabase';
import type { RegularProgram } from '../types';

/**
 * Clean date fields: convert empty strings to undefined
 * This prevents database errors when empty strings are sent for DATE fields
 */
function cleanDateFields<T extends { start_date?: string; end_date?: string }>(
  data: T
): T {
  const cleaned = { ...data };
  if (cleaned.start_date === '') {
    delete cleaned.start_date;
  }
  if (cleaned.end_date === '') {
    delete cleaned.end_date;
  }
  return cleaned;
}

export const regularProgramsService = {
  async getAll(): Promise<RegularProgram[]> {
    const { data, error } = await supabase
      .from('regular_programs')
      .select('*')
      .order('order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(program: Omit<RegularProgram, 'id' | 'created_at' | 'updated_at'>): Promise<RegularProgram> {
    const cleanedProgram = cleanDateFields(program);
    const { data, error } = await supabase
      .from('regular_programs')
      .insert(cleanedProgram)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, program: Partial<RegularProgram>): Promise<RegularProgram> {
    const cleanedProgram = cleanDateFields(program);
    const { data, error } = await supabase
      .from('regular_programs')
      .update({ ...cleanedProgram, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('regular_programs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};









import { supabase } from './supabase';
import type { RegularProgram } from '../types';

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
    const { data, error } = await supabase
      .from('regular_programs')
      .insert(program)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, program: Partial<RegularProgram>): Promise<RegularProgram> {
    const { data, error } = await supabase
      .from('regular_programs')
      .update({ ...program, updated_at: new Date().toISOString() })
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







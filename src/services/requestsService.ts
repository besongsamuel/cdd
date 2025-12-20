import { supabase } from './supabase';
import type { Request } from '../types';

export const requestsService = {
  async getAll(): Promise<Request[]> {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByType(type: Request['type']): Promise<Request[]> {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(request: Omit<Request, 'id' | 'created_at' | 'status'>): Promise<Request> {
    const { data, error } = await supabase
      .from('requests')
      .insert({ ...request, status: 'pending' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: Request['status']): Promise<Request> {
    const { data, error } = await supabase
      .from('requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};







import { supabase } from './supabase';
import type { Member } from '../types';

export const membersService = {
  async getAll(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getLeaders(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('type', 'leader')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getRegularMembers(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('type', 'regular')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(member: Omit<Member, 'id' | 'created_at' | 'updated_at'>): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .insert(member)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, member: Partial<Member>): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .update({ ...member, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};




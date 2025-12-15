import type { Department, Ministry } from '../types';
import { supabase } from './supabase';

export const roleService = {
  /**
   * Check if a member is a lead of a specific department
   */
  async isDepartmentLead(
    departmentId: string,
    memberId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('department_members')
      .select('is_lead')
      .eq('department_id', departmentId)
      .eq('member_id', memberId)
      .eq('is_lead', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned"
      console.error('Error checking department lead:', error);
      return false;
    }

    return !!data;
  },

  /**
   * Check if a member is a lead of a specific ministry
   */
  async isMinistryLead(
    ministryId: string,
    memberId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('ministry_members')
      .select('is_lead')
      .eq('ministry_id', ministryId)
      .eq('member_id', memberId)
      .eq('is_lead', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking ministry lead:', error);
      return false;
    }

    return !!data;
  },

  /**
   * Get all departments where a member is a lead
   */
  async getUserDepartments(memberId: string): Promise<Department[]> {
    const { data, error } = await supabase
      .from('department_members')
      .select(
        `
        department_id,
        departments (
          id,
          name,
          description,
          image_url,
          display_order,
          is_active,
          created_at,
          updated_at
        )
      `
      )
      .eq('member_id', memberId)
      .eq('is_lead', true);

    if (error) {
      console.error('Error getting user departments:', error);
      return [];
    }

    return (data || [])
      .map((item: any) => item.departments)
      .filter((dept: Department | null) => dept !== null) as Department[];
  },

  /**
   * Get all ministries where a member is a lead
   */
  async getUserMinistries(memberId: string): Promise<Ministry[]> {
    const { data, error } = await supabase
      .from('ministry_members')
      .select(
        `
        ministry_id,
        ministries (
          id,
          name,
          description,
          image_url,
          display_order,
          is_active,
          details,
          created_at,
          updated_at
        )
      `
      )
      .eq('member_id', memberId)
      .eq('is_lead', true);

    if (error) {
      console.error('Error getting user ministries:', error);
      return [];
    }

    return (data || [])
      .map((item: any) => item.ministries)
      .filter((ministry: Ministry | null) => ministry !== null) as Ministry[];
  },

  /**
   * Get all department IDs where a member is a lead
   */
  async getUserDepartmentIds(memberId: string): Promise<string[]> {
    const departments = await this.getUserDepartments(memberId);
    return departments.map((dept) => dept.id);
  },

  /**
   * Get all ministry IDs where a member is a lead
   */
  async getUserMinistryIds(memberId: string): Promise<string[]> {
    const ministries = await this.getUserMinistries(memberId);
    return ministries.map((ministry) => ministry.id);
  },
};



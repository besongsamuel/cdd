import type { Department, Ministry, Role, Permission } from '../types';
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

  /**
   * Check if a member has a specific permission
   */
  async hasPermission(memberId: string, permissionName: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('member_has_permission', {
      member_id: memberId,
      permission_name: permissionName,
    });

    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }

    return data === true;
  },

  /**
   * Get all resolved permissions for a member
   */
  async getMemberPermissions(memberId: string): Promise<string[]> {
    const { data, error } = await supabase.rpc('get_member_permissions', {
      member_id: memberId,
    });

    if (error) {
      console.error('Error getting member permissions:', error);
      return [];
    }

    return (data || []).map((row: { permission_name: string }) => row.permission_name);
  },

  /**
   * Check if a member is a superuser
   */
  async isSuperuser(memberId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_superuser', {
      member_id: memberId,
    });

    if (error) {
      console.error('Error checking superuser status:', error);
      return false;
    }

    return data === true;
  },

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        permissions:role_permissions (
          permission:permissions (
            id,
            name,
            description,
            created_at
          )
        )
      `)
      .order('name', { ascending: true });

    if (error) throw error;

    // Transform the nested structure
    return (data || []).map((role: any) => ({
      ...role,
      permissions: (role.permissions || []).map((rp: any) => rp.permission).filter(Boolean),
    }));
  },

  /**
   * Get roles for a specific member
   */
  async getMemberRoles(memberId: string): Promise<Role[]> {
    const { data, error } = await supabase
      .from('member_roles')
      .select(`
        role:roles (
          id,
          name,
          description,
          is_superuser,
          created_at
        )
      `)
      .eq('member_id', memberId);

    if (error) {
      console.error('Error getting member roles:', error);
      return [];
    }

    return (data || [])
      .map((item: any) => item.role)
      .filter((role: Role | null) => role !== null) as Role[];
  },

  /**
   * Get all member roles for multiple members in a single query
   * Returns a map of member_id -> Role[]
   */
  async getAllMemberRoles(memberIds: string[]): Promise<Record<string, Role[]>> {
    if (memberIds.length === 0) {
      return {};
    }

    const { data, error } = await supabase
      .from('member_roles')
      .select(`
        member_id,
        role:roles (
          id,
          name,
          description,
          is_superuser,
          created_at
        )
      `)
      .in('member_id', memberIds);

    if (error) {
      console.error('Error getting all member roles:', error);
      return {};
    }

    // Group roles by member_id
    const rolesMap: Record<string, Role[]> = {};
    
    // Initialize all member IDs with empty arrays
    memberIds.forEach(id => {
      rolesMap[id] = [];
    });

    // Populate with actual roles
    (data || []).forEach((item: any) => {
      if (item.role && item.member_id) {
        if (!rolesMap[item.member_id]) {
          rolesMap[item.member_id] = [];
        }
        rolesMap[item.member_id].push(item.role);
      }
    });

    return rolesMap;
  },

  /**
   * Assign a role to a member
   */
  async assignRole(memberId: string, roleId: string): Promise<void> {
    const { error } = await supabase
      .from('member_roles')
      .insert({
        member_id: memberId,
        role_id: roleId,
      });

    if (error) throw error;
  },

  /**
   * Remove a role from a member
   */
  async removeRole(memberId: string, roleId: string): Promise<void> {
    const { error } = await supabase
      .from('member_roles')
      .delete()
      .eq('member_id', memberId)
      .eq('role_id', roleId);

    if (error) throw error;
  },

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get direct permissions for a member
   */
  async getMemberDirectPermissions(memberId: string): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('member_permissions')
      .select(`
        permission:permissions (
          id,
          name,
          description,
          created_at
        )
      `)
      .eq('member_id', memberId);

    if (error) {
      console.error('Error getting member direct permissions:', error);
      return [];
    }

    return (data || [])
      .map((item: any) => item.permission)
      .filter((permission: Permission | null) => permission !== null) as Permission[];
  },

  /**
   * Assign a permission directly to a member
   */
  async assignPermission(memberId: string, permissionId: string): Promise<void> {
    const { error } = await supabase
      .from('member_permissions')
      .insert({
        member_id: memberId,
        permission_id: permissionId,
      });

    if (error) throw error;
  },

  /**
   * Remove a permission from a member
   */
  async removePermission(memberId: string, permissionId: string): Promise<void> {
    const { error } = await supabase
      .from('member_permissions')
      .delete()
      .eq('member_id', memberId)
      .eq('permission_id', permissionId);

    if (error) throw error;
  },

  /**
   * Create a role
   */
  async createRole(role: Omit<Role, 'id' | 'created_at' | 'permissions'>): Promise<Role> {
    const { data, error } = await supabase
      .from('roles')
      .insert(role)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a role
   */
  async updateRole(id: string, role: Partial<Role>): Promise<Role> {
    const { data, error } = await supabase
      .from('roles')
      .update(role)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a role
   */
  async deleteRole(id: string): Promise<void> {
    const { error } = await supabase.from('roles').delete().eq('id', id);

    if (error) throw error;
  },

  /**
   * Assign a permission to a role
   */
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    const { error } = await supabase
      .from('role_permissions')
      .insert({
        role_id: roleId,
        permission_id: permissionId,
      });

    if (error) throw error;
  },

  /**
   * Remove a permission from a role
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId);

    if (error) throw error;
  },
};


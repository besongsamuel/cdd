import type { Session, User } from "@supabase/supabase-js";
import React, { createContext, useCallback, useEffect, useState, useMemo } from "react";
import { membersService } from "../services/membersService";
import { roleService } from "../services/roleService";
import { supabase } from "../services/supabase";
import type { Member } from "../types";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  memberLoading: boolean;
  currentMember: Member | null;
  permissions: string[];
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getCurrentMember: () => Promise<Member | null>;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isSuperuser: boolean;
}

/* eslint-disable react-refresh/only-export-components */
// Context must be exported for useAuth hook (Fast Refresh limitation accepted)
export const AuthContextInternal = createContext<AuthContextType | undefined>(
  undefined
);
/* eslint-enable react-refresh/only-export-components */

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberLoading, setMemberLoading] = useState(false);

  useEffect(() => {
    // Helper function to perform account linking (must not run inside auth callbacks)
    const performAccountLinking = (userId: string | undefined) => {
      if (!userId) return;

      void (async () => {
        try {
          const { error } = await supabase.rpc(
            "link_current_user_to_member_by_email"
          );
          if (error) {
            console.debug(
              "Account linking attempt (non-fatal):",
              error.message
            );
          }
        } catch (error) {
          console.debug("Account linking error (non-fatal):", error);
        }
      })();
    };

    const scheduleAccountLinking = (userId: string | undefined) => {
      // Defer past the auth lock — async work in onAuthStateChange/getSession
      // callbacks can deadlock the client (no network, spinner forever).
      setTimeout(() => performAccountLinking(userId), 0);
    };

    const applySession = (
      _session: Session | null,
      options?: { linkAccount?: boolean }
    ) => {
      setSession(_session);
      setUser(_session?.user ?? null);
      setLoading(false);

      if (options?.linkAccount && _session?.user) {
        scheduleAccountLinking(_session.user.id);
      }
    };

    // Get initial session — keep callback synchronous (no await)
    supabase.auth
      .getSession()
      .then(({ data: { session: _session } }) => {
        applySession(_session, { linkAccount: true });
      })
      .catch((error) => {
        console.error("Error loading auth session:", error);
        applySession(null);
      });

    // Listen for auth changes — callback must stay synchronous
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      applySession(_session, {
        linkAccount: _event === "SIGNED_IN" && !!_session?.user,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load member when user changes
  useEffect(() => {
    if (!user?.id) {
      setCurrentMember(null);
      setPermissions([]);
      setMemberLoading(false);
      return;
    }

    let cancelled = false;
    setMemberLoading(true);

    const loadMemberData = async () => {
      try {
        const member = await membersService.getByUserId(user.id);
        if (cancelled) return;

        setCurrentMember(member);

        if (member) {
          try {
            const memberPermissions = await roleService.getMemberPermissions(
              member.id
            );
            if (!cancelled) {
              setPermissions(memberPermissions);
            }
          } catch (permError) {
            console.error("Error loading permissions:", permError);
            if (!cancelled) {
              setPermissions([]);
            }
          }
        } else {
          setPermissions([]);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading member:", error);
          setCurrentMember(null);
          setPermissions([]);
        }
      } finally {
        if (!cancelled) {
          setMemberLoading(false);
        }
      }
    };

    void loadMemberData();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    setSession(data.session);
    setUser(data.user);
  };

  const signUp = async (email: string, password: string) => {
    // Create auth user
    // Note: Supabase will send an email verification link
    // The user won't be automatically logged in until they verify their email
    // Member record will be created in CompleteProfilePage after email verification
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Failed to create user");

    // Don't set user or session yet - wait for email verification
    // The user will be redirected to the verify-email page
    // After email verification, they'll log in and be redirected to complete profile
    // Member will be created when they complete their profile
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setUser(null);
    setCurrentMember(null);
    setPermissions([]);
  };

  const getCurrentMember = useCallback(async (): Promise<Member | null> => {
    if (!user) return null;
    try {
      const member = await membersService.getByUserId(user.id);
      setCurrentMember(member);
      
      // Reload permissions when member is refreshed
      if (member) {
        try {
          const memberPermissions = await roleService.getMemberPermissions(member.id);
          setPermissions(memberPermissions);
        } catch (permError) {
          console.error("Error loading permissions:", permError);
          setPermissions([]);
        }
      } else {
        setPermissions([]);
      }
      
      return member;
    } catch (error) {
      console.error("Error loading member:", error);
      setCurrentMember(null);
      setPermissions([]);
      return null;
    }
  }, [user?.id]);

  // Check if current member has a specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!currentMember) return false;
    return permissions.includes(permission);
  }, [currentMember, permissions]);

  // Check if current member is admin
  const isAdmin = currentMember?.is_admin ?? false;

  // Check if current member is superuser
  const isSuperuser = useMemo(() => {
    if (!currentMember) return false;
    // Check if member has is_admin flag
    if (currentMember.is_admin) return true;
    // Check if member has superuser permission (all permissions)
    // Superuser effectively has all permissions, so we check if permissions array is very large
    // or if member has manage:roles permission (meta-permission)
    return permissions.includes('manage:roles') || permissions.length > 15;
  }, [currentMember, permissions]);

  return (
    <AuthContextInternal.Provider
      value={{
        user,
        session,
        loading,
        memberLoading,
        currentMember,
        permissions,
        signIn,
        signUp,
        signOut,
        getCurrentMember,
        hasPermission,
        isAdmin,
        isSuperuser,
      }}
    >
      {children}
    </AuthContextInternal.Provider>
  );
};

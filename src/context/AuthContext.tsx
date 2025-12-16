import type { Session, User } from "@supabase/supabase-js";
import React, { createContext, useCallback, useEffect, useState } from "react";
import { membersService } from "../services/membersService";
import { supabase } from "../services/supabase";
import type { Member } from "../types";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  memberLoading: boolean;
  currentMember: Member | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getCurrentMember: () => Promise<Member | null>;
  isAdmin: boolean;
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
  const [loading, setLoading] = useState(true);
  const [memberLoading, setMemberLoading] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: _session } }) => {
      setSession(_session);
      setUser(_session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      setSession(_session);
      setUser(_session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load member when user changes
  useEffect(() => {
    if (!user) {
      // Reset member state when user logs out
      queueMicrotask(() => {
        setCurrentMember(null);
        setMemberLoading(false);
      });
      return;
    }

    let cancelled = false;
    setMemberLoading(true);

    // Load member asynchronously
    const loadMemberData = async () => {
      try {
        const member = await membersService.getByUserId(user.id);
        if (!cancelled) {
          setCurrentMember(member);
          setMemberLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading member:", error);
          setCurrentMember(null);
          setMemberLoading(false);
        }
      }
    };

    loadMemberData();

    return () => {
      cancelled = true;
      setMemberLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  };

  const getCurrentMember = useCallback(async (): Promise<Member | null> => {
    if (!user) return null;
    try {
      const member = await membersService.getByUserId(user.id);
      setCurrentMember(member);
      return member;
    } catch (error) {
      console.error("Error loading member:", error);
      setCurrentMember(null);
      return null;
    }
  }, [user?.id]);

  // Check if current member is admin
  const isAdmin = currentMember?.is_admin ?? false;

  return (
    <AuthContextInternal.Provider
      value={{
        user,
        session,
        loading,
        memberLoading,
        currentMember,
        signIn,
        signUp,
        signOut,
        getCurrentMember,
        isAdmin,
      }}
    >
      {children}
    </AuthContextInternal.Provider>
  );
};

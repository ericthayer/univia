import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { ensureSession } from '../services/session';
import { UserProfile } from '../types/auth';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  profileLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (
    provider: 'google' | 'github' | 'apple',
    options?: { linkAnonymous?: boolean },
  ) => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAnonymous: boolean;
  isRegistered: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  };

  const refreshProfile = async () => {
    if (!user || user.is_anonymous) {
      return;
    }

    setProfileLoading(true);
    const profileData = await fetchUserProfile(user.id);
    setProfile(profileData);
    setProfileLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const applySession = async (nextSession: Session | null) => {
      if (!mounted) return;

      const nextUser = nextSession?.user ?? null;
      const isRegisteredUser = Boolean(nextUser && !nextUser.is_anonymous);
      setSession(nextSession);
      setUser(nextUser);
      setProfileLoading(isRegisteredUser);

      if (isRegisteredUser && nextUser) {
        const profileData = await fetchUserProfile(nextUser.id);
        if (mounted) setProfile(profileData);
      } else if (mounted) {
        setProfile(null);
      }

      if (mounted) setProfileLoading(false);
    };

    const initializeSession = async () => {
      try {
        const currentSession = await ensureSession({
          allowAnonymous: !['/signin', '/signup', '/forgot-password', '/reset-password', '/auth/callback']
            .includes(window.location.pathname),
        });
        await applySession(currentSession);
      } catch (error) {
        console.error('Error initializing authentication session:', error);
        await applySession(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => {
      mounted = false;
      void subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = user?.is_anonymous
      ? await supabase.auth.updateUser({
          email,
          password,
          data: { full_name: fullName },
        })
      : await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

    if (!error) {
      await refreshProfile();
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      await refreshProfile();
    }

    return { error };
  };

  const signInWithOAuth = async (
    provider: 'google' | 'github' | 'apple',
    { linkAnonymous = false }: { linkAnonymous?: boolean } = {},
  ) => {
    const callbackUrl = `${window.location.origin}/auth/callback`;
    console.log('AuthContext: Initiating OAuth sign-in', { provider, callbackUrl });

    const oauthOptions = {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    };

    const { error } = user?.is_anonymous && linkAnonymous
      ? await supabase.auth.linkIdentity({ provider, options: oauthOptions })
      : await supabase.auth.signInWithOAuth({
        provider,
        options: oauthOptions,
      });

    if (error) {
      console.error('AuthContext: OAuth sign-in error:', error.message);
    }

    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    try {
      const guestSession = await ensureSession();
      setSession(guestSession);
      setUser(guestSession?.user ?? null);
      setProfile(null);
    } catch (error) {
      console.error('Error creating guest session after sign out:', error);
      setUser(null);
      setProfile(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        profileLoading,
        signUp,
        signIn,
        signInWithOAuth,
        resetPassword,
        updatePassword,
        signOut,
        refreshProfile,
        isAnonymous: Boolean(user?.is_anonymous),
        isRegistered: Boolean(user && !user.is_anonymous),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

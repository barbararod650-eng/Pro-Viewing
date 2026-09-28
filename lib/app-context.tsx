'use client';

export type ViewingStatus =
  | 'idle'
  | 'scheduled'
  | 'verified'
  | 'paid';

export interface ViewingBooking {
  status: ViewingStatus;
  date: string | null;
  timeSlot: string | null;
  accessCode: string;
}

export interface AuthUser {
  email: string;
  name: string;
}

export type VerificationState = 'unknown' | 'none' | 'pending' | 'approved' | 'rejected';
export type PaymentState =
  | 'unknown'
  | 'none'
  | 'pending_admin_assignment'
  | 'awaiting_payment'
  | 'reported_paid'
  | 'confirmed'
  | 'cancelled';

export interface AppState {
  user: AuthUser | null;
  authLoading: boolean;
  verification: VerificationState;
  payment: PaymentState;
  refreshStatus: () => Promise<void>;
  booking: ViewingBooking;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  scheduleViewing: (date: string, timeSlot: string) => void;
  setVerified: () => void;
  setPaid: () => void;
  resetBooking: () => void;
}

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { Session } from '@supabase/supabase-js';

const BOOKING_STORAGE_KEY = 'keyview_booking_v1';

function generateAccessCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

const defaultBooking: ViewingBooking = {
  status: 'idle',
  date: null,
  timeSlot: null,
  accessCode: '8492',
};

function loadBooking(): ViewingBooking {
  if (typeof window === 'undefined') return defaultBooking;
  try {
    const raw = localStorage.getItem(BOOKING_STORAGE_KEY);
    if (!raw) return defaultBooking;
    return JSON.parse(raw);
  } catch {
    return defaultBooking;
  }
}

function userFromSession(session: Session | null): AuthUser | null {
  if (!session?.user?.email) return null;
  const name =
    (session.user.user_metadata?.full_name as string | undefined) ||
    session.user.email.split('@')[0];
  return { email: session.user.email, name };
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [booking, setBooking] = useState<ViewingBooking>(defaultBooking);
  const [hydrated, setHydrated] = useState(false);
  const [verification, setVerification] = useState<VerificationState>('unknown');
  const [payment, setPayment] = useState<PaymentState>('unknown');
  const email = user?.email;

  const refreshStatus = useCallback(async () => {
    if (!email) return;
    try {
      const [vRes, pRes] = await Promise.all([
        fetch(`/api/verify/status?email=${encodeURIComponent(email)}`),
        fetch(`/api/payment/status?email=${encodeURIComponent(email)}`),
      ]);
      const v = await vRes.json();
      const p = await pRes.json();
      setVerification(v.verification?.status ?? 'none');
      setPayment(p.paymentRequest?.status ?? 'none');
    } catch {
      // keep whatever we had on a transient network error
    }
  }, [email]);

  useEffect(() => {
    if (email) {
      refreshStatus();
    } else {
      setVerification('unknown');
      setPayment('unknown');
    }
  }, [email, refreshStatus]);

  useEffect(() => {
    setBooking(loadBooking());
    setHydrated(true);

    supabase.auth.getSession().then(({ data }) => {
      setUser(userFromSession(data.session));
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(userFromSession(session));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(booking));
  }, [booking, hydrated]);

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}/auth` : undefined,
      },
    });

    if (error) return { error: error.message, needsEmailConfirmation: false };

    // If Supabase returns a session immediately, email confirmation is OFF
    // for this project and the user is already logged in.
    const needsEmailConfirmation = !data.session;
    return { error: null, needsEmailConfirmation };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setBooking(defaultBooking);
  };

  const scheduleViewing = (date: string, timeSlot: string) => {
    setBooking((prev) => ({
      ...prev,
      status: 'scheduled',
      date,
      timeSlot,
      accessCode: prev.accessCode || generateAccessCode(),
    }));
  };

  const setVerified = () =>
    setBooking((prev) => ({ ...prev, status: 'verified' }));

  const setPaid = () =>
    setBooking((prev) => ({ ...prev, status: 'paid' }));

  const resetBooking = () => setBooking(defaultBooking);

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        verification,
        payment,
        refreshStatus,
        booking,
        signUp,
        signIn,
        logout,
        scheduleViewing,
        setVerified,
        setPaid,
        resetBooking,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
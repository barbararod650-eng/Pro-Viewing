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
  propertyId: string | null;
}

// A viewing that's saved in the database (never includes the access code).
export interface Viewing {
  id: string;
  property_id: string;
  slot_date: string; // "2026-10-05", the calendar date at the property
  slot_label: string; // "9:00 AM – 9:30 AM"
  slot_start: string; // ISO timestamp
  slot_end: string; // ISO timestamp
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
  viewing: Viewing | null;
  viewingLoaded: boolean;
  refreshStatus: () => Promise<void>;
  booking: ViewingBooking;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  scheduleViewing: (dateStr: string, timeSlot: string, propertyId: string) => void;
  setVerified: () => void;
  setPaid: () => void;
  resetBooking: () => void;
}

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase-client';
import { authFetch } from '@/lib/auth-fetch';
import type { Session } from '@supabase/supabase-js';

const PENDING_STORAGE_KEY = 'keyview_pending_slot_v2';

const emptyBooking: ViewingBooking = {
  status: 'idle',
  date: null,
  timeSlot: null,
  accessCode: '',
  propertyId: null,
};

function loadPending(): ViewingBooking {
  if (typeof window === 'undefined') return emptyBooking;
  try {
    const raw = localStorage.getItem(PENDING_STORAGE_KEY);
    if (!raw) return emptyBooking;
    return JSON.parse(raw);
  } catch {
    return emptyBooking;
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
  const [pending, setPending] = useState<ViewingBooking>(emptyBooking);
  const [hydrated, setHydrated] = useState(false);
  const [verification, setVerification] = useState<VerificationState>('unknown');
  const [payment, setPayment] = useState<PaymentState>('unknown');
  const [viewing, setViewing] = useState<Viewing | null>(null);
  const [viewingLoaded, setViewingLoaded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const email = user?.email;

  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const claimingRef = useRef(false);

  const refreshStatus = useCallback(async () => {
    if (!email) return;
    try {
      const targetPropertyId = pendingRef.current.propertyId || viewing?.property_id;
      const propertyQuery = targetPropertyId ? `&propertyId=${encodeURIComponent(targetPropertyId)}` : '';
      const [vRes, pRes, bRes] = await Promise.all([
        fetch(`/api/verify/status?email=${encodeURIComponent(email)}${propertyQuery}`),
        fetch(`/api/payment/status?email=${encodeURIComponent(email)}${propertyQuery}`),
        authFetch(`/api/booking${targetPropertyId ? `?propertyId=${encodeURIComponent(targetPropertyId)}` : ''}`),
      ]);
      const v = await vRes.json();
      const p = await pRes.json();
      setVerification(v.verification?.status ?? 'none');
      setPayment(p.paymentRequest?.status ?? 'none');

      if (!bRes.ok) return;
      const b = await bRes.json();
      let current: Viewing | null = b.viewing ?? null;

      const chosen = pendingRef.current;
      if (!current && chosen.date && chosen.timeSlot && chosen.propertyId) {
        if (claimingRef.current) return;
        claimingRef.current = true;
        try {
          const claim = await authFetch('/api/booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: chosen.date.slice(0, 10),
              slot: chosen.timeSlot,
              propertyId: chosen.propertyId,
            }),
          });
          const c = await claim.json();
          if (claim.ok) {
            current = c.viewing;
          } else {
            setNotice(
              `${c.error || "We couldn't reserve the time you picked."} Please choose a new time from your dashboard.`
            );
          }
        } finally {
          claimingRef.current = false;
          setPending(emptyBooking);
        }
      }

      setViewing(current);
      setViewingLoaded(true);
    } catch {
      // keep whatever we had on a transient network error
    }
  }, [email, viewing?.property_id]);

  useEffect(() => {
    if (email) {
      refreshStatus();
    } else {
      setVerification('unknown');
      setPayment('unknown');
      setViewing(null);
      setViewingLoaded(false);
    }
  }, [email, refreshStatus]);

  useEffect(() => {
    setPending(loadPending());
    setHydrated(true);

    const applySession = (session: Session | null) => {
      const next = userFromSession(session);
      setUser((prev) =>
        prev && next && prev.email === next.email && prev.name === next.name ? prev : next
      );
    };

    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(pending));
  }, [pending, hydrated]);

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) return { error: error.message, needsEmailConfirmation: false };

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
    setPending(emptyBooking);
    setViewing(null);
    setViewingLoaded(false);
  };

  const scheduleViewing = (dateStr: string, timeSlot: string, propertyId: string) => {
    setPending({
      status: 'scheduled',
      date: `${dateStr}T12:00:00Z`,
      timeSlot,
      accessCode: '',
      propertyId,
    });
  };

  const setVerified = useCallback(() => {}, []);
  const setPaid = useCallback(() => {}, []);

  const resetBooking = () => setPending(emptyBooking);

  const booking: ViewingBooking = !user
    ? pending
    : viewing
      ? {
          status:
            payment === 'confirmed' ? 'paid' : verification === 'approved' ? 'verified' : 'scheduled',
          date: `${viewing.slot_date}T12:00:00Z`,
          timeSlot: viewing.slot_label,
          accessCode: '',
          propertyId: viewing.property_id,
        }
      : viewingLoaded
        ? emptyBooking
        : pending;

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        verification,
        payment,
        viewing,
        viewingLoaded,
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
      {notice && (
        <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-destructive/30 bg-card px-4 py-3 text-sm shadow-lg">
          <p className="text-primary">{notice}</p>
          <button
            onClick={() => setNotice(null)}
            className="mt-2 text-xs font-medium text-muted-foreground underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
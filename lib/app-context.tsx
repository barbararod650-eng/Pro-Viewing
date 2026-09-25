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

export interface AppState {
  user: AuthUser | null;
  booking: ViewingBooking;
  login: (email: string, name: string) => void;
  logout: () => void;
  scheduleViewing: (date: string, timeSlot: string) => void;
  setVerified: () => void;
  setPaid: () => void;
  resetBooking: () => void;
}

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const STORAGE_KEY = 'keyview_state_v1';

function generateAccessCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

const defaultBooking: ViewingBooking = {
  status: 'idle',
  date: null,
  timeSlot: null,
  accessCode: '8492',
};

function loadState(): { user: AuthUser | null; booking: ViewingBooking } {
  if (typeof window === 'undefined') return { user: null, booking: defaultBooking };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, booking: defaultBooking };
    const parsed = JSON.parse(raw);
    return {
      user: parsed.user ?? null,
      booking: parsed.booking ?? defaultBooking,
    };
  } catch {
    return { user: null, booking: defaultBooking };
  }
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [booking, setBooking] = useState<ViewingBooking>(defaultBooking);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const { user: u, booking: b } = loadState();
    setUser(u);
    setBooking(b);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, booking }));
  }, [user, booking, hydrated]);

  const login = (email: string, name: string) => setUser({ email, name });

  const logout = () => {
    setUser(null);
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
      value={{ user, booking, login, logout, scheduleViewing, setVerified, setPaid, resetBooking }}
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

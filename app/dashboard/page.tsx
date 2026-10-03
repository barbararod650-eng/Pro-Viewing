'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/lib/app-context';
import { authFetch } from '@/lib/auth-fetch';
import { PROPERTY } from '@/lib/property';
import { ScheduleModal } from '@/components/schedule-modal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Lock,
  Unlock,
  Check,
  ShieldCheck,
  AlertCircle,
  Timer,
  Eye,
  EyeOff,
  Home,
  Bed,
  Bath,
  Maximize,
  Loader2,
  CalendarPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AccessState = 'loading' | 'no_booking' | 'unverified' | 'unpaid' | 'before' | 'during' | 'after';

function formatCountdown(ms: number): { hours: string; minutes: string; seconds: string } {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
  };
}

export default function DashboardPage() {
  const { user, authLoading, viewing, viewings, viewingLoaded, refreshStatus } = useApp();
  const router = useRouter();

  const [accessState, setAccessState] = useState<AccessState>('loading');
  const [opensAt, setOpensAt] = useState<number | null>(null);
  const [closesAt, setClosesAt] = useState<number | null>(null);
  const [clockOffset, setClockOffset] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [code, setCode] = useState<string | null>(null);
  const [codeVisible, setCodeVisible] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
  const [propertyInfo, setPropertyInfo] = useState<{
    name: string;
    time_slots: string[];
    timezone: string;
  } | null>(null);

  useEffect(() => {
    if (!viewing) {
      setPropertyInfo(null);
      return;
    }
    fetch(`/api/properties/${viewing.property_id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setPropertyInfo(data?.property ?? null))
      .catch(() => setPropertyInfo(null));
  }, [viewing]);
  const revealingRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
  }, [authLoading, user, router]);

  const syncAccess = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch(
        `/api/booking/access${viewing?.property_id ? `?propertyId=${encodeURIComponent(viewing.property_id)}` : ''}`
      );
      const data = await res.json();
      if (!res.ok) return;
      setAccessState(data.state);
      setOpensAt(data.opensAt ? new Date(data.opensAt).getTime() : null);
      setClosesAt(data.closesAt ? new Date(data.closesAt).getTime() : null);
      setClockOffset(data.serverNow - Date.now());
    } catch {
      // keep last known state on a transient network error
    }
  }, [user]);

  useEffect(() => {
    if (!user || !viewingLoaded) return;
    syncAccess();
    const interval = setInterval(syncAccess, 10000);
    return () => clearInterval(interval);
  }, [user, viewingLoaded, viewing?.id, syncAccess]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + clockOffset), 1000);
    return () => clearInterval(t);
  }, [clockOffset]);

  useEffect(() => {
    if (accessState !== 'during' || code || revealingRef.current) return;
    revealingRef.current = true;
    authFetch('/api/booking/access', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.code) setCode(data.code);
      })
      .finally(() => {
        revealingRef.current = false;
      });
  }, [accessState, code]);

  useEffect(() => {
    if (accessState === 'after') {
      setCode(null);
      setCodeVisible(false);
    }
  }, [accessState]);

  const handleScheduled = () => {
    refreshStatus();
    syncAccess();
  };

  if (authLoading || !viewingLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const viewingDate = viewing
    ? new Date(`${viewing.slot_date}T12:00:00Z`).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : '';

  const countdown = opensAt ? formatCountdown(opensAt - now) : formatCountdown(0);
  const opensAtLabel = opensAt
    ? new Date(opensAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';
  const closesAtLabel = closesAt
    ? new Date(closesAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <Badge variant="secondary" className="gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          Access Portal
        </Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-primary">
          Welcome{user ? `, ${user.name}` : ''}!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your viewing details and secure access code are below.
        </p>
      </motion.div>

      {viewings.length > 1 && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-primary">Your scheduled viewings</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {viewings.map((item) => (
              <Link
                key={item.id}
                href={`/property/${item.property_id}`}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm transition-colors hover:border-accent/50 hover:bg-secondary',
                  item.id === viewing?.id ? 'border-accent bg-accent/5' : 'border-border'
                )}
              >
                <span className="block font-medium text-primary">
                  {new Date(`${item.slot_date}T12:00:00Z`).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'UTC',
                  })}
                </span>
                <span className="text-xs text-muted-foreground">{item.slot_label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {accessState === 'no_booking' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <CalendarPlus className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-primary">No viewing scheduled yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Pick a date and time to get started.
          </p>
                    <Button asChild className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/">
              <Calendar className="mr-1.5 h-4 w-4" />
              Browse Properties
            </Link>
          </Button>
        </motion.div>
      )}

      {viewing && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Account', done: true },
                { label: 'Viewing Scheduled', done: true },
                { label: 'ID Verified', done: accessState !== 'unverified' && accessState !== 'loading' },
                { label: 'Payment Complete', done: !['unverified', 'unpaid', 'loading'].includes(accessState) },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium',
                    item.done ? 'border-accent/30 bg-accent/5 text-accent' : 'border-border text-muted-foreground'
                  )}
                >
                  {item.done ? <Check className="h-4 w-4 text-accent" /> : <AlertCircle className="h-4 w-4" />}
                  {item.label}
                </div>
              ))}
            </div>
            {accessState !== 'during' && (
              <Button variant="outline" size="sm" onClick={() => setScheduleOpen(true)}>
                <Calendar className="mr-1.5 h-4 w-4" />
                Reschedule
              </Button>
            )}
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="lg:col-span-2"
            >
              <Card className="overflow-hidden shadow-sm">
                <div className="relative h-48 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={PROPERTY.imageUrl} alt={PROPERTY.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-xl font-bold text-white">{PROPERTY.name}</h2>
                    <div className="mt-1 flex items-center gap-1.5 text-white/80">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{PROPERTY.address}</span>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p className="text-sm font-semibold text-primary">{viewingDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Time Window</p>
                        <p className="text-sm font-semibold text-primary">{viewing.slot_label}</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Bed className="h-5 w-5 text-accent" />
                      <div>
                        <p className="text-lg font-bold text-primary">{PROPERTY.beds}</p>
                        <p className="text-xs text-muted-foreground">Beds</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath className="h-5 w-5 text-accent" />
                      <div>
                        <p className="text-lg font-bold text-primary">{PROPERTY.baths}</p>
                        <p className="text-xs text-muted-foreground">Baths</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Maximize className="h-5 w-5 text-accent" />
                      <div>
                        <p className="text-lg font-bold text-primary">{PROPERTY.sqft.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Sq Ft</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lock className="h-5 w-5 text-accent" />
                    Access Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {accessState === 'unverified' && (
                      <motion.div key="unverified" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center">
                        <AlertCircle className="mb-4 h-10 w-10 text-muted-foreground" />
                        <p className="text-sm font-medium text-primary">Identity verification needed</p>
                        <p className="mt-1 text-sm text-muted-foreground">Complete verification to unlock your access code.</p>
                        <Button className="mt-6 w-full" onClick={() => router.push('/verify')}>
                          Verify Identity
                        </Button>
                      </motion.div>
                    )}

                    {accessState === 'unpaid' && (
                      <motion.div key="unpaid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center text-center">
                        <AlertCircle className="mb-4 h-10 w-10 text-muted-foreground" />
                        <p className="text-sm font-medium text-primary">Payment needed</p>
                        <p className="mt-1 text-sm text-muted-foreground">Complete your inspection fee payment to unlock your access code.</p>
                        <Button className="mt-6 w-full" onClick={() => router.push('/payment')}>
                          Go to Checkout
                        </Button>
                      </motion.div>
                    )}

                    {accessState === 'before' && (
                      <motion.div key="before" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                          <Timer className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Your access code will be revealed when the viewing window opens.
                        </p>
                        <div className="mt-6 flex items-center gap-2">
                          <CountdownUnit value={countdown.hours} label="Hrs" />
                          <span className="text-2xl font-bold text-muted-foreground">:</span>
                          <CountdownUnit value={countdown.minutes} label="Min" />
                          <span className="text-2xl font-bold text-muted-foreground">:</span>
                          <CountdownUnit value={countdown.seconds} label="Sec" />
                        </div>
                        <div className="mt-6 w-full rounded-lg border border-border bg-secondary/30 p-3">
                          <p className="text-xs text-muted-foreground">
                            Viewing window opens at <span className="font-semibold text-primary">{opensAtLabel}</span>
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {accessState === 'during' && (
                      <motion.div key="during" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent"
                        >
                          <Unlock className="h-8 w-8 text-accent-foreground" />
                        </motion.div>
                        <p className="text-sm font-medium text-accent">Viewing window is open!</p>

                        <div className="mt-4 w-full rounded-xl border-2 border-accent/30 bg-accent/5 p-6">
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your Access Code</p>
                          <div className="mt-2 flex items-center justify-center gap-3">
                            {!code ? (
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            ) : codeVisible ? (
                              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold tracking-[0.3em] text-primary">
                                {code}
                              </motion.p>
                            ) : (
                              <p className="text-4xl font-bold tracking-[0.3em] text-muted-foreground">••••••</p>
                            )}
                          </div>
                          <Button
                            onClick={() => setCodeVisible(!codeVisible)}
                            variant="outline"
                            size="sm"
                            className="mt-4 w-full"
                            disabled={!code}
                          >
                            {codeVisible ? (
                              <>
                                <EyeOff className="mr-1.5 h-4 w-4" />
                                Hide Code
                              </>
                            ) : (
                              <>
                                <Eye className="mr-1.5 h-4 w-4" />
                                Reveal Access Code
                              </>
                            )}
                          </Button>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          Window closes at {closesAtLabel}
                        </div>
                      </motion.div>
                    )}

                    {accessState === 'after' && (
                      <motion.div key="after" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                          <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <p className="text-sm font-medium text-destructive">Viewing window expired</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          The viewing window has closed. Schedule a new time to get another access code.
                        </p>
                        <Button className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setScheduleOpen(true)}>
                          <Calendar className="mr-1.5 h-4 w-4" />
                          Schedule New Viewing
                        </Button>
                        <Button variant="outline" className="mt-2 w-full" onClick={() => router.push('/')}>
                          <Home className="mr-1.5 h-4 w-4" />
                          Back to Property
                        </Button>
                      </motion.div>
                    )}

                    {accessState === 'loading' && (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
      >
        <ShieldCheck className="h-5 w-5 shrink-0 text-accent" />
        <div>
          <p className="text-sm font-medium text-primary">How time-gated access works</p>
          <p className="mt-1 text-sm text-muted-foreground">
            For your security, the access code is only available during your scheduled viewing window.
            Before the window opens, you'll see a countdown. After it closes, the code is no longer
            accessible. This ensures only verified visitors can enter during approved times.
          </p>
        </div>
      </motion.div>

            {viewing && propertyInfo && (
        <ScheduleModal
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          propertyId={viewing.property_id}
          timeSlots={propertyInfo.time_slots}
          timezone={propertyInfo.timezone}
          propertyName={propertyInfo.name}
        />
      )}
    </div>
  );
}

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-primary text-2xl font-bold tabular-nums text-primary-foreground">
        {value}
      </div>
      <span className="mt-1.5 text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
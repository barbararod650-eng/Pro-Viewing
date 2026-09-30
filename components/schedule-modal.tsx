'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useApp, Viewing } from '@/lib/app-context';
import { authFetch } from '@/lib/auth-fetch';
import { useRouter } from 'next/navigation';
import { Check, Clock, CalendarDays, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  timeSlots: string[];
  timezone: string;
  propertyName?: string;
}

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function tzLabel(timezone: string) {
  return (
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')?.value || timezone
  );
}

export function ScheduleModal({
  open,
  onOpenChange,
  propertyId,
  timeSlots,
  timezone,
  propertyName,
}: ScheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingViewing, setExistingViewing] = useState<Viewing | null>(null);
  const { user, scheduleViewing, refreshStatus } = useApp();
  const router = useRouter();

  const rescheduling = !!existingViewing;

  useEffect(() => {
    if (!open || !user) {
      setExistingViewing(null);
      return;
    }
    authFetch(`/api/booking?propertyId=${propertyId}`)
      .then((res) => (res.ok ? res.json() : { viewing: null }))
      .then((data) => setExistingViewing(data.viewing ?? null))
      .catch(() => setExistingViewing(null));
  }, [open, user, propertyId]);

  const loadAvailability = useCallback(
    async (date: Date) => {
      setLoadingSlots(true);
      try {
        const res = await fetch(
          `/api/booking/availability?date=${toDateStr(date)}&propertyId=${propertyId}`
        );
        const data = await res.json();
        setUnavailable(data.unavailable || []);
      } catch {
        setUnavailable([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    [propertyId]
  );

  useEffect(() => {
    setSelectedSlot(null);
    setError('');
    if (selectedDate) loadAvailability(selectedDate);
  }, [selectedDate, loadAvailability]);

  useEffect(() => {
    if (!open) {
      setSelectedDate(undefined);
      setSelectedSlot(null);
      setUnavailable([]);
      setError('');
      setSubmitting(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedSlot) return;
    const dateStr = toDateStr(selectedDate);

    if (!user) {
      scheduleViewing(dateStr, selectedSlot, propertyId);
      onOpenChange(false);
      router.push('/auth');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await authFetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, slot: selectedSlot, propertyId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        if (res.status === 409) {
          setSelectedSlot(null);
          loadAvailability(selectedDate);
        }
        return;
      }

      await refreshStatus();
      onOpenChange(false);
      router.push(rescheduling ? `/dashboard?property=${propertyId}` : `/verify?property=${propertyId}`);
    } catch {
      setError('Network error — please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentSlotText = existingViewing
    ? `${new Date(`${existingViewing.slot_date}T12:00:00Z`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })}, ${existingViewing.slot_label}`
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {rescheduling
              ? 'Reschedule your viewing'
              : propertyName
                ? `Schedule a viewing of ${propertyName}`
                : 'Schedule a Viewing'}
          </DialogTitle>
          <DialogDescription>
            {rescheduling
              ? `Your current viewing is ${currentSlotText}. Pick a new date and time below.`
              : "Pick a date and time slot that works for you. You'll then verify your identity and pay the inspection fee."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-medium">Select a date</p>
            <div className="flex justify-center rounded-lg border border-border p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="mx-auto"
              />
            </div>
          </div>

          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">Select a time slot</p>
                  <p className="text-xs text-muted-foreground">
                    Times are in property local time ({tzLabel(timezone)})
                  </p>
                </div>

                {loadingSlots ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {timeSlots.map((slot) => {
                        const taken = unavailable.includes(slot);
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            disabled={taken}
                            className={cn(
                              'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all',
                              taken
                                ? 'cursor-not-allowed border-border bg-secondary/40 text-muted-foreground/60 line-through'
                                : selectedSlot === slot
                                  ? 'border-accent bg-accent/10 text-accent'
                                  : 'border-border hover:border-accent/50 hover:bg-secondary'
                            )}
                          >
                            <Clock className="h-4 w-4 shrink-0" />
                            {slot}
                            {taken && (
                              <span className="ml-auto text-xs font-normal no-underline">Unavailable</span>
                            )}
                            {!taken && selectedSlot === slot && <Check className="ml-auto h-4 w-4" />}
                          </button>
                        );
                      })}
                    </div>
                    {unavailable.length === timeSlots.length && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        No times left on this day — try another date.
                      </p>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {selectedDate
                ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                : 'No date selected'}
            </div>
            <Button
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedSlot || submitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                <>
                  {rescheduling ? 'Confirm new time' : 'Continue'}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { useState } from 'react';
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
import { TIME_SLOTS, PROPERTY } from '@/lib/property';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'next/navigation';
import { Check, Clock, MapPin, CalendarDays, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleModal({ open, onOpenChange }: ScheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const { scheduleViewing } = useApp();
  const router = useRouter();

  const handleConfirm = () => {
    if (!selectedDate || !selectedSlot) return;
    scheduleViewing(selectedDate.toISOString(), selectedSlot);
    onOpenChange(false);
    router.push('/auth');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Schedule a Viewing</DialogTitle>
          <DialogDescription>
            Pick a date and time slot that works for you. You'll then verify your identity and pay the inspection fee.
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
                <p className="mb-2 text-sm font-medium">Select a time slot</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all',
                        selectedSlot === slot
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border hover:border-accent/50 hover:bg-secondary'
                      )}
                    >
                      <Clock className="h-4 w-4 shrink-0" />
                      {slot}
                      {selectedSlot === slot && <Check className="ml-auto h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {selectedDate
                ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                : 'No date selected'}
            </div>
            <Button
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedSlot}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Continue
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

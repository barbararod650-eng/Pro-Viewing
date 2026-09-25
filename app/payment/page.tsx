'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/lib/app-context';
import { PROPERTY, INSPECTION_FEE } from '@/lib/property';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  Lock,
  Check,
  ShieldCheck,
  Calendar,
  MapPin,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export default function PaymentPage() {
  const [processing, setProcessing] = useState(false);
  const [paid, setPaidState] = useState(false);
  const { user, booking, setPaid } = useApp();
  const router = useRouter();

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setPaidState(true);
      setProcessing(false);
      setPaid();
      setTimeout(() => router.push('/dashboard'), 1200);
    }, 2000);
  };

  const viewingDate = booking.date
    ? new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : 'Not scheduled';

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-1.5">
            <Lock className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">Secure Checkout</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Inspection Fee</h1>
          <p className="mt-2 text-muted-foreground">
            Pay the one-time inspection fee to unlock your access code.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Order Summary */}
          <div className="lg:col-span-3">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Property info */}
                <div className="flex items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={PROPERTY.imageUrl}
                    alt={PROPERTY.name}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-primary">{PROPERTY.name}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {PROPERTY.address}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {viewingDate}
                      {booking.timeSlot && ` at ${booking.timeSlot}`}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Line items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Property Inspection Fee</span>
                    <span className="font-medium text-primary">${INSPECTION_FEE}.00</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Processing Fee</span>
                    <span className="font-medium text-accent">Free</span>
                  </div>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">Total Due</span>
                  <span className="text-2xl font-bold text-primary">${INSPECTION_FEE}.00</span>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
                  <span>
                    The inspection fee covers the cost of a verified property visit. It is non-refundable
                    but ensures only verified visitors gain access.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment form */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                {paid ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-8 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent"
                    >
                      <Check className="h-8 w-8 text-accent-foreground" />
                    </motion.div>
                    <p className="font-semibold text-primary">Payment Successful</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Redirecting to your access portal...
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-primary">Card Number</label>
                      <div className="relative mt-1.5">
                        <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="4242 4242 4242 4242"
                          className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          defaultValue="4242 4242 4242 4242"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-primary">Expiry</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          defaultValue="12/28"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-primary">CVC</label>
                        <input
                          type="text"
                          placeholder="123"
                          className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          defaultValue="123"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handlePay}
                      disabled={processing}
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      {processing ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing payment...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Pay ${INSPECTION_FEE}.00 with Card
                        </span>
                      )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                      This is a demo. No real payment will be charged.
                    </p>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      256-bit SSL encrypted
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Status badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Badge variant={user ? 'default' : 'outline'} className="gap-1.5">
            <Check className={`h-3 w-3 ${user ? 'text-accent' : ''}`} />
            Account
          </Badge>
          <Badge variant={booking.status !== 'idle' ? 'default' : 'outline'} className="gap-1.5">
            <Check className={`h-3 w-3 ${booking.status !== 'idle' ? 'text-accent' : ''}`} />
            Viewing Scheduled
          </Badge>
          <Badge variant={booking.status === 'verified' || booking.status === 'paid' ? 'default' : 'outline'} className="gap-1.5">
            <Check className={`h-3 w-3 ${booking.status === 'verified' || booking.status === 'paid' ? 'text-accent' : ''}`} />
            ID Verified
          </Badge>
          <Badge variant={booking.status === 'paid' ? 'default' : 'outline'} className="gap-1.5">
            <Check className={`h-3 w-3 ${booking.status === 'paid' ? 'text-accent' : ''}`} />
            Payment
          </Badge>
        </div>
      </motion.div>
    </div>
  );
}

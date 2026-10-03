'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/lib/app-context';
import { PROPERTY, INSPECTION_FEE } from '@/lib/property';
import { formatMoney } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Check,
  ShieldCheck,
  Calendar,
  MapPin,
  Loader2,
  Copy,
  Landmark,
  Wallet,
  ArrowRightLeft,
} from 'lucide-react';

type Method = 'revolut' | 'wero' | 'bank_transfer' | 'paypal';

interface PaymentRequestData {
  id: string;
  method: Method;
  amount: number;
  currency: string;
  status: 'pending_admin_assignment' | 'awaiting_payment' | 'reported_paid' | 'confirmed' | 'cancelled';
  account_details: string | null;
}

const methods: { id: Method; label: string; icon: typeof Wallet; blurb: string }[] = [
  { id: 'revolut', label: 'Revolut', icon: Wallet, blurb: 'Send via Revolut tag or phone number' },
  { id: 'wero', label: 'Wero', icon: ArrowRightLeft, blurb: 'European instant bank-to-bank payment' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: Landmark, blurb: 'Direct transfer using account/IBAN details' },
  { id: 'paypal', label: 'PayPal', icon: Wallet, blurb: 'Send to a PayPal email address' },
];

export default function PaymentPage() {
  const { user, booking, setPaid } = useApp();
  const router = useRouter();
  const [request, setRequest] = useState<PaymentRequestData | null | 'loading'>('loading');
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reportingPaid, setReportingPaid] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!user) return;
    try {
      const propertyQuery = booking.propertyId ? `&propertyId=${encodeURIComponent(booking.propertyId)}` : '';
      const res = await fetch(`/api/payment/status?email=${encodeURIComponent(user.email)}${propertyQuery}`);
      const data = await res.json();
      setRequest(data.paymentRequest || null);
      if (data.paymentRequest?.status === 'confirmed' && booking.status !== 'paid') {
        setPaid();
      }
    } catch {
      // leave current state as-is on transient errors
    }
  }, [user, booking.status, booking.propertyId, setPaid]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (request === 'loading' || request === null) return;
    if (request.status === 'confirmed') {
      const t = setTimeout(() => router.push('/dashboard'), 1500);
      return () => clearTimeout(t);
    }
    if (request.status === 'pending_admin_assignment' || request.status === 'reported_paid') {
      const interval = setInterval(fetchStatus, 4000);
      return () => clearInterval(interval);
    }
  }, [request, fetchStatus, router]);

  const handleRequestInstructions = async () => {
    if (!user || !selectedMethod) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/payment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          method: selectedMethod,
          propertyId: booking.propertyId,
        }),
      });
      const data = await res.json();
      if (res.ok) setRequest(data.paymentRequest);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportPaid = async () => {
    if (request === 'loading' || !request) return;
    setReportingPaid(true);
    try {
      const res = await fetch('/api/payment/report-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: request.id }),
      });
      const data = await res.json();
      if (res.ok) setRequest(data.paymentRequest);
    } finally {
      setReportingPaid(false);
    }
  };

  const copyDetails = () => {
    if (request === 'loading' || !request?.account_details) return;
    navigator.clipboard.writeText(request.account_details);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const viewingDate = booking.date
    ? new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : 'Not scheduled';

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-1.5">
            <Lock className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">Secure Checkout</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Inspection Fee</h1>
          <p className="mt-2 text-muted-foreground">
            Choose how you'd like to pay — we'll send you the account details to complete it.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={PROPERTY.imageUrl} alt={PROPERTY.name} className="h-16 w-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="font-semibold text-primary">{PROPERTY.name}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {PROPERTY.address}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {viewingDate}
                      {booking.timeSlot && ` at ${booking.timeSlot}`}
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">Total Due</span>
                  <span className="text-2xl font-bold text-primary">{formatMoney(INSPECTION_FEE, request && request !== 'loading' ? request.currency : 'USD')}</span>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
                  <span>Your payment is reviewed and confirmed manually by our team before access is unlocked.</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {request === 'loading' && (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {request === null && (
                    <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {methods.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setSelectedMethod(m.id)}
                            className={`flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all ${
                              selectedMethod === m.id
                                ? 'border-accent bg-accent/5'
                                : 'border-border hover:border-accent/50 hover:bg-secondary'
                            }`}
                          >
                            <m.icon className={`h-5 w-5 ${selectedMethod === m.id ? 'text-accent' : 'text-muted-foreground'}`} />
                            <span className="text-sm font-semibold text-primary">{m.label}</span>
                            <span className="text-xs text-muted-foreground">{m.blurb}</span>
                          </button>
                        ))}
                      </div>
                      <Button
                        onClick={handleRequestInstructions}
                        disabled={!selectedMethod || submitting}
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        {submitting ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending request...
                          </span>
                        ) : (
                          'Request Payment Instructions'
                        )}
                      </Button>
                    </motion.div>
                  )}

                  {request && request !== 'loading' && request.status === 'pending_admin_assignment' && (
                    <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-8 text-center">
                      <Loader2 className="mb-4 h-8 w-8 animate-spin text-accent" />
                      <p className="font-semibold text-primary">Request sent</p>
                      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                        We're preparing your {methods.find((m) => m.id === request.method)?.label} account details. This page will update automatically.
                      </p>
                    </motion.div>
                  )}

                  {request && request !== 'loading' && request.status === 'awaiting_payment' && (
                    <motion.div key="pay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Send <span className="font-semibold text-primary">{formatMoney(request.amount, request.currency)}</span> via{' '}
                        <span className="font-semibold text-primary">{methods.find((m) => m.id === request.method)?.label}</span> using these details:
                      </p>
                      <div className="rounded-lg border border-border bg-secondary/50 p-4">
                        <pre className="whitespace-pre-wrap font-sans text-sm text-primary">{request.account_details}</pre>
                      </div>
                      <Button variant="outline" onClick={copyDetails} className="w-full">
                        <Copy className="mr-1.5 h-4 w-4" />
                        {copied ? 'Copied!' : 'Copy details'}
                      </Button>
                      <Button
                        onClick={handleReportPaid}
                        disabled={reportingPaid}
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        {reportingPaid ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Marking as sent...
                          </span>
                        ) : (
                          "I've sent the payment"
                        )}
                      </Button>
                    </motion.div>
                  )}

                  {request && request !== 'loading' && request.status === 'reported_paid' && (
                    <motion.div key="confirming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-8 text-center">
                      <Loader2 className="mb-4 h-8 w-8 animate-spin text-accent" />
                      <p className="font-semibold text-primary">Confirming your payment</p>
                      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                        We'll unlock your access as soon as we confirm receipt. No need to refresh.
                      </p>
                    </motion.div>
                  )}

                  {request && request !== 'loading' && request.status === 'confirmed' && (
                    <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                        <Check className="h-8 w-8 text-accent-foreground" />
                      </div>
                      <p className="font-semibold text-primary">Payment confirmed</p>
                      <p className="mt-1 text-sm text-muted-foreground">Taking you to your access portal...</p>
                    </motion.div>
                  )}

                  {request && request !== 'loading' && request.status === 'cancelled' && (
                    <motion.div key="cancelled" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-8 text-center">
                      <p className="font-semibold text-primary">This request was cancelled</p>
                      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                        Please start a new payment request below.
                      </p>
                      <Button className="mt-4" onClick={() => setRequest(null)}>
                        Start over
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
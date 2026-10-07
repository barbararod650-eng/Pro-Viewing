'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert, RefreshCw, Send, Check, X, Loader2 } from 'lucide-react';
import { formatMoney } from '@/lib/utils';

interface PaymentRequest {
  id: string;
  user_email: string;
  user_name: string | null;
  amount: number;
  currency: string;
  method: string;
  status: 'pending_admin_assignment' | 'awaiting_payment' | 'reported_paid' | 'confirmed' | 'cancelled';
  account_details: string | null;
  created_at: string;
}

const methodLabels: Record<string, string> = {
  revolut: 'Revolut',
  wero: 'Wero',
  bank_transfer: 'Bank Transfer',
  paypal: 'PayPal',
  payoneer: 'Payoneer',
  wise: 'Wise',
  skrill: 'Skrill',
};

export default function AdminPaymentsPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<PaymentRequest[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [accessCodes, setAccessCodes] = useState<Record<string, string>>({});
  const [actingOn, setActingOn] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_password');
    if (saved) {
      setPassword(saved);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  async function fetchRequests() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/payments', {
        headers: { 'x-admin-password': password },
      });
      if (res.status === 401) {
        setAuthed(false);
        sessionStorage.removeItem('admin_password');
        setError('Incorrect password.');
        return;
      }
      const data = await res.json();
      setItems(data.paymentRequests || []);
    } catch {
      setError('Failed to load payment requests.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem('admin_password', password);
    setAuthed(true);
  }

  async function handleAction(id: string, action: 'assign' | 'confirm' | 'cancel') {
    setActingOn(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({
          action,
          accountDetails: action === 'assign' ? drafts[id] : undefined,
          accessCode: action === 'confirm' ? accessCodes[id] : undefined,
        }),
      });
      if (res.ok) {
        await fetchRequests();
      }
    } finally {
      setActingOn(null);
    }
  }

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <ShieldAlert className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Admin access</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              Enter
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const needsAccount = items.filter((i) => i.status === 'pending_admin_assignment');
  const awaitingConfirmation = items.filter((i) => i.status === 'reported_paid');
  const awaitingPayment = items.filter((i) => i.status === 'awaiting_payment');
  const done = items.filter((i) => i.status === 'confirmed' || i.status === 'cancelled');

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Payment requests</h1>
        <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading && items.length === 0 && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Needs account details ({needsAccount.length})
        </h2>
        {needsAccount.length === 0 && !loading && (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nothing waiting here.
          </p>
        )}
        <div className="space-y-4">
          {needsAccount.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-primary">{item.user_name || item.user_email}</p>
                  <p className="text-sm text-muted-foreground">{item.user_email}</p>
                </div>
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                  {methodLabels[item.method]} · {formatMoney(item.amount, item.currency)}
                </span>
              </div>
              <textarea
                value={drafts[item.id] ?? ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: e.target.value }))}
                placeholder={`Paste the ${methodLabels[item.method]} account details to send this renter...`}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <Button
                className="mt-3"
                onClick={() => handleAction(item.id, 'assign')}
                disabled={actingOn === item.id || !drafts[item.id]?.trim()}
              >
                <Send className="mr-1.5 h-4 w-4" />
                Send details
              </Button>
            </div>
          ))}
        </div>
      </section>

      {awaitingPayment.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Waiting on renter to pay ({awaitingPayment.length})
          </h2>
          <div className="space-y-2">
            {awaitingPayment.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border bg-card px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span>{item.user_name || item.user_email} — {methodLabels[item.method]} · {formatMoney(item.amount, item.currency)}</span>
                  <span className="text-xs text-muted-foreground">Details sent</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Renter says they paid — confirm receipt ({awaitingConfirmation.length})
        </h2>
        {awaitingConfirmation.length === 0 && !loading && (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nothing waiting here.
          </p>
        )}
        <div className="space-y-3">
          {awaitingConfirmation.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="mb-3">
                <p className="font-medium text-primary">{item.user_name || item.user_email}</p>
                <p className="text-sm text-muted-foreground">
                  {methodLabels[item.method]} · {formatMoney(item.amount, item.currency)} · {item.user_email}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={accessCodes[item.id] ?? ''}
                  onChange={(e) =>
                    setAccessCodes((codes) => ({
                      ...codes,
                      [item.id]: e.target.value.replace(/\D/g, '').slice(0, 6),
                    }))
                  }
                  placeholder="6-digit access code"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:w-48"
                />
                <Button
                  size="sm"
                  onClick={() => handleAction(item.id, 'confirm')}
                  disabled={actingOn === item.id || accessCodes[item.id]?.length !== 6}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Check className="mr-1.5 h-4 w-4" />
                  Confirm payment and code
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleAction(item.id, 'cancel')}
                  disabled={actingOn === item.id}
                >
                  <X className="mr-1.5 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">History</h2>
          <div className="space-y-2">
            {done.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm"
              >
                <span>{item.user_name || item.user_email} — {methodLabels[item.method]} · {formatMoney(item.amount, item.currency)}</span>
                <span className={item.status === 'confirmed' ? 'text-accent' : 'text-destructive'}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Check,
  X,
  Loader2,
  ShieldAlert,
  RefreshCw,
  Send,
  FileCheck,
  Wallet,
  Building2,
  Eye,
  EyeOff,
  Archive,
} from 'lucide-react';

// ── Types ──

interface Verification {
  id: string;
  user_email: string;
  user_name: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  id_document_url: string | null;
  selfie_url: string | null;
}

interface PaymentRequest {
  id: string;
  user_email: string;
  user_name: string | null;
  amount: number;
  method: string;
  status: 'pending_admin_assignment' | 'awaiting_payment' | 'reported_paid' | 'confirmed' | 'cancelled';
  account_details: string | null;
  created_at: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  price: number;
  status: 'draft' | 'published' | 'archived';
  image_url: string | null;
  created_at: string;
}

const methodLabels: Record<string, string> = {
  revolut: 'Revolut',
  wero: 'Wero',
  bank_transfer: 'Bank Transfer',
  paypal: 'PayPal',
};

type Tab = 'verifications' | 'payments' | 'properties';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState<Tab>('verifications');

  const [verLoading, setVerLoading] = useState(false);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [verActingOn, setVerActingOn] = useState<string | null>(null);

  const [payLoading, setPayLoading] = useState(false);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [payActingOn, setPayActingOn] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, string>>({});

  const [propLoading, setPropLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propActingOn, setPropActingOn] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_password');
    if (saved) {
      setPassword(saved);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchVerifications();
    fetchPayments();
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem('admin_password', password);
    setAuthed(true);
    setLoginError('');
  }

  function handleAuthFailure() {
    setAuthed(false);
    sessionStorage.removeItem('admin_password');
    setLoginError('Incorrect password.');
  }

  async function fetchVerifications() {
    setVerLoading(true);
    try {
      const res = await fetch('/api/admin/verifications', {
        headers: { 'x-admin-password': password },
      });
      if (res.status === 401) return handleAuthFailure();
      const data = await res.json();
      setVerifications(data.verifications || []);
    } catch {
      // ignore transient errors, user can hit refresh
    } finally {
      setVerLoading(false);
    }
  }

  async function fetchPayments() {
    setPayLoading(true);
    try {
      const res = await fetch('/api/admin/payments', {
        headers: { 'x-admin-password': password },
      });
      if (res.status === 401) return handleAuthFailure();
      const data = await res.json();
      setPayments(data.paymentRequests || []);
    } catch {
      // ignore transient errors, user can hit refresh
    } finally {
      setPayLoading(false);
    }
  }

  async function handleVerificationDecision(id: string, action: 'approve' | 'reject') {
    setVerActingOn(id);
    try {
      const res = await fetch(`/api/admin/verifications/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setVerifications((prev) =>
          prev.map((v) => (v.id === id ? { ...v, status: action === 'approve' ? 'approved' : 'rejected' } : v))
        );
      }
    } finally {
      setVerActingOn(null);
    }
  }
  async function fetchProperties() {
    setPropLoading(true);
    try {
      const res = await fetch('/api/admin/properties', {
        headers: { 'x-admin-password': password },
      });
      if (res.status === 401) return handleAuthFailure();
      const data = await res.json();
      setProperties(data.properties || []);
    } catch {
      // ignore transient errors, user can hit refresh
    } finally {
      setPropLoading(false);
    }
  }

  async function handlePropertyStatusChange(id: string, status: 'draft' | 'published' | 'archived') {
    setPropActingOn(id);
    try {
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await fetchProperties();
    } finally {
      setPropActingOn(null);
    }
  }

  async function handlePaymentAction(id: string, action: 'assign' | 'confirm' | 'cancel') {
    setPayActingOn(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ action, accountDetails: action === 'assign' ? drafts[id] : undefined }),
      });
      if (res.ok) await fetchPayments();
    } finally {
      setPayActingOn(null);
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
            {loginError && <p className="text-sm text-destructive">{loginError}</p>}
            <Button type="submit" className="w-full">
              Enter
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const pendingVer = verifications.filter((v) => v.status === 'pending');
  const reviewedVer = verifications.filter((v) => v.status !== 'pending');

  const needsAccount = payments.filter((p) => p.status === 'pending_admin_assignment');
  const awaitingPayment = payments.filter((p) => p.status === 'awaiting_payment');
  const awaitingConfirmation = payments.filter((p) => p.status === 'reported_paid');
  const donePayments = payments.filter((p) => p.status === 'confirmed' || p.status === 'cancelled');

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-primary">Admin</h1>

      <div className="mb-8 flex rounded-lg border border-border p-1">
        <button
          onClick={() => setTab('verifications')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
            tab === 'verifications' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          <FileCheck className="h-4 w-4" />
          Verifications
          {pendingVer.length > 0 && (
            <span className="rounded-full bg-accent px-1.5 text-xs text-accent-foreground">
              {pendingVer.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('payments')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
            tab === 'payments' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          <Wallet className="h-4 w-4" />
          Payments
          {(needsAccount.length + awaitingConfirmation.length) > 0 && (
            <span className="rounded-full bg-accent px-1.5 text-xs text-accent-foreground">
              {needsAccount.length + awaitingConfirmation.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('properties')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
            tab === 'properties' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Properties
        </button>
      </div>

      {tab === 'properties' && (
        <div>
          <div className="mb-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={fetchProperties} disabled={propLoading}>
              <RefreshCw className={`mr-1.5 h-4 w-4 ${propLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {properties.length === 0 && !propLoading && (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              No properties yet.
            </p>
          )}

          <div className="space-y-3">
            {properties.map((property) => (
              <div
                key={property.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {property.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={property.image_url}
                      alt={property.name}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-secondary">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-primary">{property.name}</p>
                    <p className="text-sm text-muted-foreground">{property.address}</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        property.status === 'published'
                          ? 'bg-accent/10 text-accent'
                          : property.status === 'draft'
                            ? 'bg-secondary text-muted-foreground'
                            : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {property.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {property.status !== 'published' && (
                    <Button
                      size="sm"
                      onClick={() => handlePropertyStatusChange(property.id, 'published')}
                      disabled={propActingOn === property.id}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Eye className="mr-1.5 h-4 w-4" />
                      Publish
                    </Button>
                  )}
                  {property.status === 'published' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePropertyStatusChange(property.id, 'draft')}
                      disabled={propActingOn === property.id}
                    >
                      <EyeOff className="mr-1.5 h-4 w-4" />
                      Unpublish
                    </Button>
                  )}
                  {property.status !== 'archived' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handlePropertyStatusChange(property.id, 'archived')}
                      disabled={propActingOn === property.id}
                    >
                      <Archive className="mr-1.5 h-4 w-4" />
                      Archive
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'verifications' && (
        <div>
          <div className="mb-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={fetchVerifications} disabled={verLoading}>
              <RefreshCw className={`mr-1.5 h-4 w-4 ${verLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {pendingVer.length === 0 && !verLoading && (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              No pending verifications right now.
            </p>
          )}

          <div className="space-y-4">
            {pendingVer.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary">{item.user_name || 'No name'}</p>
                    <p className="text-sm text-muted-foreground">{item.user_email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">ID document</p>
                    {item.id_document_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.id_document_url} alt="ID document" className="w-full rounded-lg border border-border object-cover" />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-lg bg-secondary text-xs text-muted-foreground">
                        Unavailable
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Selfie</p>
                    {item.selfie_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.selfie_url} alt="Selfie" className="w-full rounded-lg border border-border object-cover" />
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-lg bg-secondary text-xs text-muted-foreground">
                        Unavailable
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => handleVerificationDecision(item.id, 'approve')}
                    disabled={verActingOn === item.id}
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <Check className="mr-1.5 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleVerificationDecision(item.id, 'reject')}
                    disabled={verActingOn === item.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {reviewedVer.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Reviewed</h2>
              <div className="space-y-2">
                {reviewedVer.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
                    <span>{item.user_name || item.user_email} — {item.user_email}</span>
                    <span className={item.status === 'approved' ? 'text-accent' : 'text-destructive'}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'payments' && (
        <div>
          <div className="mb-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={fetchPayments} disabled={payLoading}>
              <RefreshCw className={`mr-1.5 h-4 w-4 ${payLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <section className="mb-10">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
              Needs account details ({needsAccount.length})
            </h2>
            {needsAccount.length === 0 && !payLoading && (
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
                      {methodLabels[item.method]} · ${item.amount}
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
                    onClick={() => handlePaymentAction(item.id, 'assign')}
                    disabled={payActingOn === item.id || !drafts[item.id]?.trim()}
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
                  <div key={item.id} className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>{item.user_name || item.user_email} — {methodLabels[item.method]} · ${item.amount}</span>
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
            {awaitingConfirmation.length === 0 && !payLoading && (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nothing waiting here.
              </p>
            )}
            <div className="space-y-3">
              {awaitingConfirmation.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div>
                    <p className="font-medium text-primary">{item.user_name || item.user_email}</p>
                    <p className="text-sm text-muted-foreground">
                      {methodLabels[item.method]} · ${item.amount} · {item.user_email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handlePaymentAction(item.id, 'confirm')}
                      disabled={payActingOn === item.id}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Check className="mr-1.5 h-4 w-4" />
                      Confirm received
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handlePaymentAction(item.id, 'cancel')}
                      disabled={payActingOn === item.id}
                    >
                      <X className="mr-1.5 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {donePayments.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">History</h2>
              <div className="space-y-2">
                {donePayments.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
                    <span>{item.user_name || item.user_email} — {methodLabels[item.method]} · ${item.amount}</span>
                    <span className={item.status === 'confirmed' ? 'text-accent' : 'text-destructive'}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
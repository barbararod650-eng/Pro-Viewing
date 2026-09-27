'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, ShieldAlert, RefreshCw } from 'lucide-react';

interface Verification {
  id: string;
  user_email: string;
  user_name: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  id_document_url: string | null;
  selfie_url: string | null;
}

export default function AdminVerificationsPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState<Verification[]>([]);
  const [actingOn, setActingOn] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_password');
    if (saved) {
      setPassword(saved);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchVerifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  async function fetchVerifications() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/verifications', {
        headers: { 'x-admin-password': password },
      });
      if (res.status === 401) {
        setAuthed(false);
        sessionStorage.removeItem('admin_password');
        setError('Incorrect password.');
        return;
      }
      const data = await res.json();
      setItems(data.verifications || []);
    } catch {
      setError('Failed to load verifications.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem('admin_password', password);
    setAuthed(true);
  }

  async function handleDecision(id: string, action: 'approve' | 'reject') {
    setActingOn(id);
    try {
      const res = await fetch(`/api/admin/verifications/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' }
              : item
          )
        );
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

  const pending = items.filter((i) => i.status === 'pending');
  const reviewed = items.filter((i) => i.status !== 'pending');

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Verification queue</h1>
        <Button variant="outline" size="sm" onClick={fetchVerifications} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading && items.length === 0 && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {pending.length === 0 && !loading && (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          No pending verifications right now.
        </p>
      )}

      <div className="space-y-4">
        {pending.map((item) => (
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
                  <img
                    src={item.id_document_url}
                    alt="ID document"
                    className="w-full rounded-lg border border-border object-cover"
                  />
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
                  <img
                    src={item.selfie_url}
                    alt="Selfie"
                    className="w-full rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-lg bg-secondary text-xs text-muted-foreground">
                    Unavailable
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => handleDecision(item.id, 'approve')}
                disabled={actingOn === item.id}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Check className="mr-1.5 h-4 w-4" />
                Approve
              </Button>
              <Button
                onClick={() => handleDecision(item.id, 'reject')}
                disabled={actingOn === item.id}
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

      {reviewed.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Reviewed</h2>
          <div className="space-y-2">
            {reviewed.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm"
              >
                <span>
                  {item.user_name || item.user_email} — {item.user_email}
                </span>
                <span
                  className={
                    item.status === 'approved' ? 'text-accent' : 'text-destructive'
                  }
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
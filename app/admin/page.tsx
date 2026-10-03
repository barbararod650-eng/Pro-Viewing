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
  Mail,
  Phone,
} from 'lucide-react';
import { formatMoney } from '@/lib/utils';

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
  currency: string;
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
  currency: string;
  status: 'draft' | 'published' | 'archived';
  image_url: string | null;
  created_at: string;
}

interface Inquiry {
  id: string;
  landlord_name: string;
  landlord_email: string;
  landlord_phone: string | null;
  property_address: string;
  property_details: string;
  status: 'new' | 'contacted' | 'approved' | 'declined';
  created_at: string;
}

const methodLabels: Record<string, string> = {
  revolut: 'Revolut',
  wero: 'Wero',
  bank_transfer: 'Bank Transfer',
  paypal: 'PayPal',
};

type Tab = 'verifications' | 'payments' | 'properties' | 'inquiries';

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
  const [accessCodes, setAccessCodes] = useState<Record<string, string>>({});

  const [propLoading, setPropLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propActingOn, setPropActingOn] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newFee, setNewFee] = useState('25');
  const [newBeds, setNewBeds] = useState('');
  const [newBaths, setNewBaths] = useState('');
  const [newSqft, setNewSqft] = useState('');
  const [newAmenities, setNewAmenities] = useState('');
  const [newCurrency, setNewCurrency] = useState<'USD' | 'EUR'>('USD');
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [newGalleryUrls, setNewGalleryUrls] = useState<string[]>([]);
  const [newVerified, setNewVerified] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [inqLoading, setInqLoading] = useState(false);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inqActingOn, setInqActingOn] = useState<string | null>(null);

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
    fetchInquiries();
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
  async function uploadPropertyImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/properties/upload-image', {
      method: 'POST',
      headers: { 'x-admin-password': password },
      body: formData,
    });
    const data = await res.json();
    return res.ok ? data.url : null;
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const url = await uploadPropertyImage(file);
    if (url) setNewImageUrl(url);
    setUploadingCover(false);
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingGallery(true);
    const urls = await Promise.all(files.map(uploadPropertyImage));
    setNewGalleryUrls((prev) => [...prev, ...urls.filter((u): u is string => !!u)]);
    setUploadingGallery(false);
  }

  function resetForm() {
    setNewName('');
    setNewAddress('');
    setNewDescription('');
    setNewPrice('');
    setNewFee('25');
    setNewBeds('');
    setNewBaths('');
    setNewSqft('');
    setNewAmenities('');
    setNewCurrency('USD');
    setNewImageUrl(null);
    setNewGalleryUrls([]);
    setNewVerified(true);
    setCreateError('');
  }

  async function handleCreateProperty() {
    if (!newName.trim() || !newAddress.trim()) {
      setCreateError('Name and address are required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/admin/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({
          name: newName.trim(),
          address: newAddress.trim(),
          description: newDescription.trim(),
          price: Number(newPrice) || 0,
          currency: newCurrency,
          inspection_fee: Number(newFee) || 25,
          beds: Number(newBeds) || 0,
          baths: Number(newBaths) || 0,
          sqft: Number(newSqft) || 0,
          amenities: newAmenities
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean),
          image_url: newImageUrl,
          gallery_images: newGalleryUrls,
          verified: newVerified,
          status: 'draft',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || 'Something went wrong.');
        return;
      }
      resetForm();
      setShowAddForm(false);
      await fetchProperties();
    } finally {
      setCreating(false);
    }
  }
  async function fetchInquiries() {
    setInqLoading(true);
    try {
      const res = await fetch('/api/admin/landlord-inquiries', {
        headers: { 'x-admin-password': password },
      });
      if (res.status === 401) return handleAuthFailure();
      const data = await res.json();
      setInquiries(data.inquiries || []);
    } catch {
      // ignore transient errors, user can hit refresh
    } finally {
      setInqLoading(false);
    }
  }

  async function handleInquiryStatusChange(
    id: string,
    status: 'new' | 'contacted' | 'approved' | 'declined'
  ) {
    setInqActingOn(id);
    try {
      const res = await fetch(`/api/admin/landlord-inquiries/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await fetchInquiries();
    } finally {
      setInqActingOn(null);
    }
  }

  async function handlePaymentAction(id: string, action: 'assign' | 'confirm' | 'cancel') {
    setPayActingOn(id);
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
        <button
          onClick={() => setTab('inquiries')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
            tab === 'inquiries' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          <Mail className="h-4 w-4" />
          Inquiries
          {inquiries.filter((i) => i.status === 'new').length > 0 && (
            <span className="rounded-full bg-accent px-1.5 text-xs text-accent-foreground">
              {inquiries.filter((i) => i.status === 'new').length}
            </span>
          )}
        </button>
      </div>

      {tab === 'inquiries' && (
        <div>
          <div className="mb-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={fetchInquiries} disabled={inqLoading}>
              <RefreshCw className={`mr-1.5 h-4 w-4 ${inqLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {inquiries.length === 0 && !inqLoading && (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              No landlord inquiries yet.
            </p>
          )}

          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-primary">{inquiry.landlord_name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {inquiry.landlord_email}
                      </span>
                      {inquiry.landlord_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {inquiry.landlord_phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      inquiry.status === 'new'
                        ? 'bg-accent/10 text-accent'
                        : inquiry.status === 'approved'
                          ? 'bg-accent/10 text-accent'
                          : inquiry.status === 'declined'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {inquiry.status}
                  </span>
                </div>

                <p className="text-sm font-medium text-primary">{inquiry.property_address}</p>
                {inquiry.property_details && (
                  <p className="mt-1 text-sm text-muted-foreground">{inquiry.property_details}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {inquiry.status !== 'contacted' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInquiryStatusChange(inquiry.id, 'contacted')}
                      disabled={inqActingOn === inquiry.id}
                    >
                      Mark Contacted
                    </Button>
                  )}
                  {inquiry.status !== 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => handleInquiryStatusChange(inquiry.id, 'approved')}
                      disabled={inqActingOn === inquiry.id}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      Approve
                    </Button>
                  )}
                  {inquiry.status !== 'declined' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleInquiryStatusChange(inquiry.id, 'declined')}
                      disabled={inqActingOn === inquiry.id}
                    >
                      Decline
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Approving an inquiry doesn't create a listing automatically — once you've approved one,
            use the "Add Property" button in the Properties tab to create the real listing using the
            details above.
          </p>
        </div>
      )}

      {tab === 'properties' && (
        <div>
          <div className="mb-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={fetchProperties} disabled={propLoading}>
              <RefreshCw className={`mr-1.5 h-4 w-4 ${propLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowAddForm((v) => !v)}>
              <Building2 className="mr-1.5 h-4 w-4" />
              {showAddForm ? 'Cancel' : 'Add Property'}
            </Button>
          </div>

          {showAddForm && (
            <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-primary">New listing</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Property name"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
                />
                <input
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Address"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
                />
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Description"
                  rows={3}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
                />
                <input
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Monthly rent"
                  type="number"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <select
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value as 'USD' | 'EUR')}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
                  <input
                  value={newFee}
                  onChange={(e) => setNewFee(e.target.value)}
                  placeholder="Inspection fee"
                  type="number"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  value={newBeds}
                  onChange={(e) => setNewBeds(e.target.value)}
                  placeholder="Beds"
                  type="number"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  value={newBaths}
                  onChange={(e) => setNewBaths(e.target.value)}
                  placeholder="Baths"
                  type="number"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  value={newSqft}
                  onChange={(e) => setNewSqft(e.target.value)}
                  placeholder="Square feet"
                  type="number"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
                />
                <input
                  value={newAmenities}
                  onChange={(e) => setNewAmenities(e.target.value)}
                  placeholder="Amenities, comma separated (e.g. Parking, Pet Friendly)"
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
                />
              </div>

              <div className="mt-4">
                <p className="mb-1.5 text-sm font-medium text-primary">Cover photo</p>
                <div className="flex items-center gap-3">
                  {newImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={newImageUrl} alt="Cover" className="h-16 w-16 rounded-lg object-cover" />
                  )}
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="text-sm" />
                  {uploadingCover && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-1.5 text-sm font-medium text-primary">Gallery photos</p>
                <div className="flex flex-wrap items-center gap-2">
                  {newGalleryUrls.map((url, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Gallery ${i + 1}`} className="h-14 w-14 rounded-lg object-cover" />
                      <button
                        onClick={() => setNewGalleryUrls((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="mt-2 text-sm"
                />
                {uploadingGallery && <Loader2 className="mt-1 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm text-primary">
                <input
                  type="checkbox"
                  checked={newVerified}
                  onChange={(e) => setNewVerified(e.target.checked)}
                />
                Show "Verified by our team" badge on this listing
              </label>

              {createError && (
                <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {createError}
                </p>
              )}

              <Button
                onClick={handleCreateProperty}
                disabled={creating || uploadingCover || uploadingGallery}
                className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Create as draft'
                )}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                It's saved as a draft — publish it from the list below once you're happy with it.
              </p>
            </div>
          )}

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
            {awaitingConfirmation.length === 0 && !payLoading && (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nothing waiting here.
              </p>
            )}
            <div className="space-y-3">
              {awaitingConfirmation.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
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
                      onClick={() => handlePaymentAction(item.id, 'confirm')}
                      disabled={payActingOn === item.id || accessCodes[item.id]?.length !== 6}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Check className="mr-1.5 h-4 w-4" />
                      Confirm payment and code
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
      )}
    </div>
  );
}
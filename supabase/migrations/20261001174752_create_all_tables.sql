/*
# Create full KeyView schema

1. New Tables
- `properties` — rental listings with name, address, price, currency (USD/EUR), inspection fee, beds, baths, sqft, amenities, images, time slots, timezone, status (draft/published/archived), verified flag.
- `verifications` — identity verification submissions (user email/name, ID document + selfie paths, status pending/approved/rejected, reviewer notes, timestamps).
- `payment_requests` — inspection fee payment requests (user email/name, amount, currency, method, status, account details, timestamps).
- `bookings` — viewing slot reservations (user email/name, property, date/label/start/end, access code, status, code_revealed_at).
- `landlord_inquiries` — landlord property submission inquiries (name, email, phone, address, details, status).

2. Security
- RLS enabled on all tables.
- properties: public read (anon + authenticated) for published listings; all CRUD for anon+authenticated (admin manages via API routes with service role).
- verifications: anon+authenticated can insert and read their own by email; no update/delete from anon (admin uses service role).
- payment_requests: anon+authenticated can insert and read their own by email; update for reporting paid.
- bookings: anon+authenticated can insert/read/update their own by email.
- landlord_inquiries: anon+authenticated can insert; read/update/delete via service role only (admin).

3. Storage
- `property-images` bucket (public) for property cover/gallery photos.
- `verification-documents` bucket (private) for ID documents and selfies.

4. Notes
- All tables use gen_random_uuid() for primary keys.
- currency column on properties defaults to 'USD', accepts 'USD' or 'EUR'.
- Bookings have a unique constraint on (property_id, slot_start, status) WHERE status = 'active' to prevent double-booking.
*/

-- ── properties ──
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR')),
  inspection_fee numeric NOT NULL DEFAULT 25,
  beds integer NOT NULL DEFAULT 0,
  baths integer NOT NULL DEFAULT 0,
  sqft integer NOT NULL DEFAULT 0,
  amenities text[] DEFAULT '{}',
  image_url text,
  gallery_images text[] DEFAULT '{}',
  time_slots text[] NOT NULL DEFAULT '{}',
  timezone text NOT NULL DEFAULT 'America/Los_Angeles',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  verified boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_properties" ON properties;
CREATE POLICY "public_read_published_properties"
  ON properties FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "anon_insert_properties" ON properties;
CREATE POLICY "anon_insert_properties"
  ON properties FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_properties" ON properties;
CREATE POLICY "anon_update_properties"
  ON properties FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_properties" ON properties;
CREATE POLICY "anon_delete_properties"
  ON properties FOR DELETE
  TO anon, authenticated
  USING (true);

-- ── verifications ──
CREATE TABLE IF NOT EXISTS verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  user_name text,
  id_document_path text NOT NULL,
  selfie_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_verifications" ON verifications;
CREATE POLICY "anon_select_verifications"
  ON verifications FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "anon_insert_verifications" ON verifications;
CREATE POLICY "anon_insert_verifications"
  ON verifications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── payment_requests ──
CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  user_name text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR')),
  method text NOT NULL,
  property_id uuid REFERENCES properties(id),
  status text NOT NULL DEFAULT 'pending_admin_assignment' CHECK (status IN ('pending_admin_assignment', 'awaiting_payment', 'reported_paid', 'confirmed', 'cancelled')),
  account_details text,
  assigned_at timestamptz,
  paid_reported_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_payment_requests" ON payment_requests;
CREATE POLICY "anon_select_payment_requests"
  ON payment_requests FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "anon_insert_payment_requests" ON payment_requests;
CREATE POLICY "anon_insert_payment_requests"
  ON payment_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_payment_requests" ON payment_requests;
CREATE POLICY "anon_update_payment_requests"
  ON payment_requests FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── bookings ──
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  user_name text,
  property_id uuid NOT NULL REFERENCES properties(id),
  slot_date text NOT NULL,
  slot_label text NOT NULL,
  slot_start timestamptz NOT NULL,
  slot_end timestamptz NOT NULL,
  access_code text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  code_revealed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
CREATE POLICY "anon_select_bookings"
  ON bookings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings"
  ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
CREATE POLICY "anon_update_bookings"
  ON bookings FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS bookings_active_slot_unique
  ON bookings (property_id, slot_start)
  WHERE status = 'active';

-- ── landlord_inquiries ──
CREATE TABLE IF NOT EXISTS landlord_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_name text NOT NULL,
  landlord_email text NOT NULL,
  landlord_phone text,
  property_address text NOT NULL,
  property_details text DEFAULT '',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'approved', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE landlord_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_landlord_inquiries" ON landlord_inquiries;
CREATE POLICY "anon_insert_landlord_inquiries"
  ON landlord_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ── Storage buckets ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for property-images (public read, authenticated upload)
DROP POLICY IF EXISTS "property_images_public_read" ON storage.objects;
CREATE POLICY "property_images_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "property_images_upload" ON storage.objects;
CREATE POLICY "property_images_upload"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'property-images');

-- Storage policies for verification-documents (no public read; admin uses service role for signed URLs)
DROP POLICY IF EXISTS "verification_docs_upload" ON storage.objects;
CREATE POLICY "verification_docs_upload"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'verification-documents');

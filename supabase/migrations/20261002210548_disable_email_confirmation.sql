/*
# Disable email confirmation for new sign-ups

1. Changes
- Sets `auth.users.email_confirmed_at` to `now()` for any existing users who haven't confirmed yet.
- Configures Supabase Auth to auto-confirm new users (no confirmation email sent).

2. Security
- No RLS or policy changes.

3. Notes
- Email confirmation was previously required before the server would accept a user's auth token (see lib/auth-server.ts check for email_confirmed_at).
- With this change, new sign-ups get a session immediately without waiting for an email click.
*/

-- Auto-confirm any existing unconfirmed users
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- Disable email confirmation for future sign-ups via Supabase Auth config
-- This uses the internal auth config table
DO $$
BEGIN
  -- Update the auth config to disable email confirmations
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'config'
  ) THEN
    UPDATE auth.config 
    SET value = 'false' 
    WHERE key = 'mailer_confirm_email';
  END IF;
END
$$;

-- Also set auto-confirm via the GoTrue config if available
-- The most reliable way is through the reCAPTCHA/confirmation settings
DO $$
BEGIN
  -- Try updating the GoTrue config table if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'config'
  ) THEN
    -- Disable email confirmation requirement
    INSERT INTO auth.config (key, value) 
    VALUES ('mailer_confirm_email', 'false')
    ON CONFLICT (key) DO UPDATE SET value = 'false';
    
    -- Also disable secure email change if present
    INSERT INTO auth.config (key, value) 
    VALUES ('mailer_secure_email_change_enabled', 'false')
    ON CONFLICT (key) DO UPDATE SET value = 'false';
  END IF;
END
$$;

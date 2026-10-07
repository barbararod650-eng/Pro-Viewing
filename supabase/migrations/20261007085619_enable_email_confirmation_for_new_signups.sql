/*
# Enable email confirmation for new Fidezia sign-ups

1. Purpose
- Re-enables Supabase Auth email confirmation for accounts created after this migration.
- New users receive the configured confirmation email from the Fidezia SMTP sender and must click the confirmation link before using protected parts of the app.

2. Existing users
- Existing confirmed accounts are not changed.
- Existing unconfirmed accounts are not auto-confirmed by this migration.

3. Security
- No application tables, columns, RLS policies, or user records are deleted or changed.
- The setting is applied only when Supabase exposes its Auth configuration table in the database.

4. Important notes
- The confirmation email template and SMTP sender are managed in Supabase Auth settings.
- The application now shows a confirmation-email message instead of attempting an immediate sign-in after sign-up.
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'auth'
      AND table_name = 'config'
  ) THEN
    INSERT INTO auth.config (key, value)
    VALUES ('mailer_confirm_email', 'true')
    ON CONFLICT (key) DO UPDATE SET value = 'true';
  END IF;
END
$$;
/*
# Allow every supported payment method on payment_requests

1. Problem
- The live database has a `payment_requests_method_check` constraint that only allows
  the original payment methods (for example bank_transfer), so newer methods fail with
  'new row for relation "payment_requests" violates check constraint
  "payment_requests_method_check"'.

2. Fix
- Drops the old constraint if it exists and recreates it with all methods the app offers:
  revolut, wero, bank_transfer, paypal, payoneer, wise, skrill.
- Created NOT VALID so it applies to new and updated rows only; existing rows are never
  re-checked, so an unexpected legacy value can't make this migration fail.

3. Security
- No table or RLS policy changes. No data is deleted or renamed.

4. Notes
- Keep this list in sync with VALID_METHODS in app/api/payment/request/route.ts.
*/

ALTER TABLE payment_requests
  DROP CONSTRAINT IF EXISTS payment_requests_method_check;

ALTER TABLE payment_requests
  ADD CONSTRAINT payment_requests_method_check
  CHECK (method IN ('revolut', 'wero', 'bank_transfer', 'paypal', 'payoneer', 'wise', 'skrill'))
  NOT VALID;

/*
# Update viewing windows and prepare admin-issued access codes

1. Existing data
- Updates saved property time slots from 30-minute windows to 1-hour windows.
- Existing bookings keep their original historical time values so completed records are not rewritten.

2. Access-code workflow
- Access codes remain stored on bookings.
- The application will set the code only through the protected admin payment-confirmation route.

3. Security
- No new tables or RLS policies are added.
- No user data is deleted or renamed.

4. Important notes
- New properties already use 1-hour default slots.
- Existing active listings receive the new 1-hour labels so their booking picker matches the new duration.
*/

UPDATE properties
SET time_slots = ARRAY[
  '9:00 AM – 10:00 AM',
  '11:00 AM – 12:00 PM',
  '1:00 PM – 2:00 PM',
  '3:00 PM – 4:00 PM',
  '5:00 PM – 6:00 PM'
]
WHERE time_slots IS NULL
   OR time_slots = ARRAY[
     '9:00 AM – 9:30 AM',
     '11:00 AM – 11:30 AM',
     '1:00 PM – 1:30 PM',
     '3:00 PM – 3:30 PM',
     '5:00 PM – 5:30 PM'
   ];
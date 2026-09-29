

// Length of generated access codes (digits).
export const ACCESS_CODE_LENGTH = 6;

interface HourMinute {
  h: number;
  m: number;
}

// Turns "9:00 AM – 9:30 AM" into { start: {h: 9, m: 0}, end: {h: 9, m: 30} }
export function parseSlotLabel(label: string): { start: HourMinute; end: HourMinute } | null {
  const match = label.match(/^(\d{1,2}):(\d{2}) (AM|PM) \u2013 (\d{1,2}):(\d{2}) (AM|PM)$/);
  if (!match) return null;

  const to24 = (h: string, min: string, ampm: string): HourMinute => {
    let hours = parseInt(h, 10) % 12;
    if (ampm === 'PM') hours += 12;
    return { h: hours, m: parseInt(min, 10) };
  };

  return { start: to24(match[1], match[2], match[3]), end: to24(match[4], match[5], match[6]) };
}

// How many minutes a timezone is ahead of UTC at a given moment (negative = behind).
function tzOffsetMinutes(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));

  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asIfUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return (asIfUtc - utcMs) / 60000;
}

// "2026-07-15 at 9:00 in America/Los_Angeles" -> the real UTC moment in ms.
// Handles daylight saving by checking the offset twice.
export function zonedTimeToUtcMs(dateStr: string, h: number, m: number, timeZone: string): number {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, m, 0);
  const firstOffset = tzOffsetMinutes(guess, timeZone);
  let utc = guess - firstOffset * 60000;
  const secondOffset = tzOffsetMinutes(utc, timeZone);
  if (secondOffset !== firstOffset) utc = guess - secondOffset * 60000;
  return utc;
}

export function isValidDateStr(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, mo, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

// Converts a date ("2026-10-05") + slot label into real start/end moments,
// using the property's timezone. Returns null if either input is invalid.
export function slotToUtcRange(
  dateStr: string,
  label: string,
  timeSlots: string[],
  timezone: string
): { startMs: number; endMs: number } | null {
  if (!isValidDateStr(dateStr)) return null;
  if (!timeSlots.includes(label)) return null;
  const parsed = parseSlotLabel(label);
  if (!parsed) return null;

  return {
    startMs: zonedTimeToUtcMs(dateStr, parsed.start.h, parsed.start.m, timezone),
    endMs: zonedTimeToUtcMs(dateStr, parsed.end.h, parsed.end.m, timezone),
  };
}
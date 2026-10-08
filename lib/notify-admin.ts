import nodemailer from 'nodemailer';

// Server-only. Sends a plain-text alert email to the admin so the manual
// steps (verification, payment, landlord inquiries) don't sit unnoticed.
//
// Required environment variables (set them in Netlify):
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS   the same SMTP login Supabase Auth uses
//   ADMIN_NOTIFY_EMAIL                           where the alerts are delivered
// Optional:
//   EMAIL_FROM                                   defaults to noreply@fidezia.org
//   NEXT_PUBLIC_SITE_URL                         defaults to https://fidezia.org
//
// If anything is missing or sending fails, this logs and returns. It never
// throws, so an email problem can't break a renter's request.

export const paymentMethodLabels: Record<string, string> = {
  revolut: 'Revolut',
  wero: 'Wero',
  bank_transfer: 'Bank Transfer',
  paypal: 'PayPal',
  payoneer: 'Payoneer',
  wise: 'Wise',
  skrill: 'Skrill',
};

type FieldValue = string | number | null | undefined;

export interface AdminAlert {
  subject: string;
  intro: string;
  fields: Record<string, FieldValue>;
  action: string;
}

// Keeps user-supplied text safe for an email: no control characters, bounded length.
function clean(value: FieldValue, max = 1000): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[^\S\n]+/g, ' ')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

function singleLine(value: string): string {
  return clean(value, 150).replace(/\s+/g, ' ');
}

export async function notifyAdmin(alert: AdminAlert): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.ADMIN_NOTIFY_EMAIL;

  if (!host || !user || !pass || !to) {
    console.warn('Admin email alert skipped: SMTP_HOST, SMTP_USER, SMTP_PASS or ADMIN_NOTIFY_EMAIL is not set.');
    return;
  }

  try {
    const port = Number(process.env.SMTP_PORT || 465);
    const from = process.env.EMAIL_FROM || 'noreply@fidezia.org';
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://fidezia.org').replace(/\/$/, '');

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });

    const lines = Object.entries(alert.fields)
      .map(([label, value]) => [label, clean(value)] as const)
      .filter(([, value]) => value !== '')
      .map(([label, value]) => `${label}: ${value}`);

    const text = [
      alert.intro,
      '',
      ...lines,
      '',
      `Next step: ${alert.action}`,
      `Open the admin page: ${siteUrl}/admin`,
    ].join('\n');

    await transporter.sendMail({
      from: `Fidezia <${from}>`,
      to,
      subject: `[Fidezia] ${singleLine(alert.subject)}`,
      text,
    });
  } catch (err) {
    console.error('Admin email alert failed:', err instanceof Error ? err.message : err);
  }
}

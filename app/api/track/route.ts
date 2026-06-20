import { NextRequest, NextResponse } from 'next/server';

// Runs on Vercel's edge runtime — cheap and fast, and the x-vercel-ip-* geo
// headers are populated there in production.
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;

  // Not configured yet: succeed quietly so the client ping never errors.
  if (!apiKey) {
    return NextResponse.json({ ok: false, reason: 'not-configured' });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const path = typeof body?.path === 'string' ? body.path : '/';

  const h = req.headers;
  const ua = h.get('user-agent') ?? 'unknown';
  const referer = h.get('referer') ?? 'direct';
  const country = h.get('x-vercel-ip-country') ?? 'unknown';
  const region = h.get('x-vercel-ip-country-region') ?? '';
  const cityRaw = h.get('x-vercel-ip-city') ?? '';
  const city = cityRaw ? decodeURIComponent(cityRaw) : 'unknown';

  const when = new Date().toISOString();
  const location = [city, region, country].filter(Boolean).join(', ');

  const text = [
    'New visit to your portfolio 👋',
    '',
    `Path:      ${path}`,
    `When:      ${when}`,
    `Location:  ${location}`,
    `Referrer:  ${referer}`,
    `Device:    ${ua}`,
  ].join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.VISIT_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>',
        to: process.env.VISIT_TO_EMAIL || 'patelutsav257@gmail.com',
        subject: `Portfolio visit — ${location}`,
        text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return NextResponse.json(
        { ok: false, reason: 'send-failed', detail },
        { status: 502 },
      );
    }
  } catch {
    return NextResponse.json({ ok: false, reason: 'send-error' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

'use strict';
// Shared helpers for Nexora Digital serverless functions. Zero npm dependencies (Node 18+).
const crypto = require('crypto');

const env = (k, d = '') => (process.env[k] || d).trim();
const SUPABASE_URL = () => env('SUPABASE_URL').replace(/\/$/, '');
const SERVICE_KEY = () => env('SUPABASE_SERVICE_ROLE_KEY');
const ANON_KEY = () => env('SUPABASE_ANON_KEY');
const PAYSTACK_SECRET = () => env('PAYSTACK_SECRET_KEY');
const SITE_URL = () => (env('SITE_URL') || env('URL') || 'http://localhost:8888').replace(/\/$/, '');

const isLive = () => !!(SUPABASE_URL() && SERVICE_KEY() && ANON_KEY());
const paymentsReady = () => !!PAYSTACK_SECRET();

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff'
};
const json = (statusCode, body, extra = {}) => ({ statusCode, headers: { ...HEADERS, ...extra }, body: JSON.stringify(body) });
const fail = (statusCode, message) => json(statusCode, { error: message });

function parseBody(event) {
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');
    return { raw, data: raw ? JSON.parse(raw) : {} };
  } catch (e) { return { raw: '', data: {}, error: true }; }
}

// ---- Supabase REST (service role: bypasses RLS — only use after authorising the caller) ----
async function sb(path, { method = 'GET', body, headers = {}, prefer } = {}) {
  const res = await fetch(`${SUPABASE_URL()}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY(), authorization: `Bearer ${SERVICE_KEY()}`, 'content-type': 'application/json',
      ...(prefer ? { prefer } : method !== 'GET' ? { prefer: 'return=representation' } : {}), ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) { const err = new Error((data && (data.message || data.error)) || `Supabase ${res.status}`); err.status = res.status; err.details = data; throw err; }
  return data;
}

// Verify the caller's Supabase JWT and return { id, email } (or null)
async function authUser(event) {
  const h = event.headers || {};
  const auth = h.authorization || h.Authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const res = await fetch(`${SUPABASE_URL()}/auth/v1/user`, { headers: { apikey: ANON_KEY(), authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const u = await res.json();
    return u && u.id ? { id: u.id, email: u.email, confirmed: !!(u.email_confirmed_at || u.confirmed_at) } : null;
  } catch (e) { return null; }
}

async function requireAdmin(event) {
  const user = await authUser(event);
  if (!user) return null;
  const rows = await sb(`profiles?id=eq.${user.id}&select=role`);
  return rows && rows[0] && rows[0].role === 'admin' ? user : null;
}

// ---- Paystack ----
async function paystack(path, method = 'GET', body) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    method,
    headers: { authorization: `Bearer ${PAYSTACK_SECRET()}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status === false) { const err = new Error(data.message || `Paystack ${res.status}`); err.status = res.status; err.details = data; throw err; }
  return data;
}

async function settings() {
  const out = { commission_default: 0.12, payout_hold_days: 7, min_payout_cents: 50000, max_downloads: 10 };
  try { (await sb('settings?select=key,value')).forEach(r => { out[r.key] = typeof r.value === 'string' ? Number(r.value) : r.value; }); } catch (e) { /* defaults */ }
  return out;
}

async function audit(actor, action, target, detail) {
  try { await sb('audit_log', { method: 'POST', body: { actor, action, target, detail }, prefer: 'return=minimal' }); } catch (e) { /* non-fatal */ }
}

// Fires the Netlify build hook (if configured) so SEO pages are regenerated from live data
async function triggerRebuild() {
  const hook = env('NETLIFY_BUILD_HOOK');
  if (!hook) return false;
  try { await fetch(hook, { method: 'POST' }); return true; } catch (e) { return false; }
}

const timingSafeEq = (a, b) => { const A = Buffer.from(a), B = Buffer.from(b); return A.length === B.length && crypto.timingSafeEqual(A, B); };

// ---- Order fulfilment (idempotent: called by webhook AND by the return-from-checkout verify) ----
async function fulfilOrder(reference) {
  const orders = await sb(`orders?reference=eq.${encodeURIComponent(reference)}&select=*`);
  const order = orders && orders[0];
  if (!order) return { ok: false, error: 'Order not found' };
  if (order.status === 'paid') return { ok: true, order, already: true };
  if (order.status !== 'pending') return { ok: false, error: `Order is ${order.status}`, order };

  const v = await paystack(`/transaction/verify/${encodeURIComponent(reference)}`);
  const tx = v.data || {};
  if (tx.status !== 'success') return { ok: false, pending: tx.status === 'ongoing' || tx.status === 'pending' || tx.status === 'abandoned', error: `Payment ${tx.status || 'not completed'}`, order };
  if (Number(tx.amount) !== Number(order.total_cents) || String(tx.currency).toUpperCase() !== String(order.currency).toUpperCase()) {
    await sb(`orders?id=eq.${order.id}&status=eq.pending`, { method: 'PATCH', body: { status: 'failed' }, prefer: 'return=minimal' });
    return { ok: false, error: 'Amount mismatch — order flagged for review', order };
  }
  // Atomic claim: only one caller flips pending -> paid
  const claimed = await sb(`orders?id=eq.${order.id}&status=eq.pending`, { method: 'PATCH', body: { status: 'paid', paid_at: new Date().toISOString(), channel: tx.channel || null } });
  if (!claimed || !claimed.length) { const again = await sb(`orders?id=eq.${order.id}&select=*`); return { ok: true, order: again[0], already: true }; }

  const st = await settings();
  const availableAt = new Date(Date.now() + st.payout_hold_days * 86400000).toISOString();
  const items = await sb(`order_items?order_id=eq.${order.id}&select=id,type,listing_id`);
  for (const it of items) {
    const digital = it.type === 'digital';
    await sb(`order_items?id=eq.${it.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { payout_status: 'on_hold', available_at: availableAt, fulfilment_status: digital ? 'delivered' : 'pending', delivered_at: digital ? new Date().toISOString() : null } });
    if (it.listing_id) { try { const l = await sb(`listings?id=eq.${it.listing_id}&select=sales_count`); await sb(`listings?id=eq.${it.listing_id}`, { method: 'PATCH', prefer: 'return=minimal', body: { sales_count: ((l[0] && l[0].sales_count) || 0) + 1 } }); } catch (e) { /* non-fatal */ } }
  }
  return { ok: true, order: { ...order, status: 'paid' } };
}

module.exports = { env, SUPABASE_URL, SERVICE_KEY, ANON_KEY, PAYSTACK_SECRET, SITE_URL, isLive, paymentsReady, json, fail, parseBody, sb, authUser, requireAdmin, paystack, settings, audit, triggerRebuild, timingSafeEq, fulfilOrder, crypto };

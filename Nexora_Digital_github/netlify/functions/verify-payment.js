'use strict';
// Called when the buyer returns from Paystack. Verifies with Paystack and fulfils the order (idempotent with the webhook).
const L = require('./_lib');

exports.handler = async (event) => {
  if (!L.isLive() || !L.paymentsReady()) return L.fail(503, 'Payments are not configured.');
  const user = await L.authUser(event);
  if (!user) return L.fail(401, 'Please sign in.');
  const reference = ((event.queryStringParameters || {}).reference || '').slice(0, 80);
  if (!/^[a-z0-9._=-]+$/i.test(reference)) return L.fail(400, 'Invalid reference');
  try {
    const rows = await L.sb(`orders?reference=eq.${encodeURIComponent(reference)}&select=id,customer_id`);
    if (!rows[0] || rows[0].customer_id !== user.id) return L.fail(404, 'Order not found');
    const r = await L.fulfilOrder(reference);
    const items = await L.sb(`order_items?order_id=eq.${rows[0].id}&select=id,title,type,fulfilment_status,price_cents`);
    const order = (await L.sb(`orders?id=eq.${rows[0].id}&select=order_no,status,total_cents,currency,reference`))[0];
    return L.json(200, { ok: !!r.ok, pending: !!r.pending, message: r.error || null, order, items });
  } catch (e) { console.error('verify-payment', e.message); return L.fail(502, 'Could not verify the payment yet. Please refresh in a moment.'); }
};

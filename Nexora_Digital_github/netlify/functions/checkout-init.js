'use strict';
// Creates a pending order + commission ledger rows from SERVER-SIDE prices, then starts a Paystack checkout.
const L = require('./_lib');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return L.fail(405, 'Method not allowed');
  if (!L.isLive() || !L.paymentsReady()) return L.fail(503, 'Payments are not configured yet. Add Supabase and Paystack keys in Netlify environment variables.');
  const user = await L.authUser(event);
  if (!user) return L.fail(401, 'Please sign in to check out.');

  const { data, error } = L.parseBody(event);
  if (error) return L.fail(400, 'Invalid request');
  const ids = [...new Set((Array.isArray(data.items) ? data.items : []).map(String))].filter(i => UUID.test(i)).slice(0, 20);
  if (!ids.length) return L.fail(400, 'Your cart is empty.');

  try {
    const listings = await L.sb(`listings?id=in.(${ids.join(',')})&status=eq.approved&select=id,title,type,price_cents,currency,vendor_id,is_demo,vendors(id,user_id,status,commission_rate,is_demo)`);
    if (listings.length !== ids.length) return L.fail(400, 'One or more items are no longer available. Please refresh your cart.');

    const testKey = L.PAYSTACK_SECRET().startsWith('sk_test') || L.env('ALLOW_DEMO_PURCHASES') === 'true';
    const st = await L.settings();
    let total = 0, commission = 0; const rows = [];
    for (const l of listings) {
      const v = l.vendors;
      if (!v || v.status !== 'approved') return L.fail(400, `“${l.title}” is not available right now.`);
      if (v.user_id === user.id) return L.fail(400, 'You cannot buy your own listing.');
      if ((l.is_demo || v.is_demo) && !testKey) return L.fail(400, `“${l.title}” is a sample listing and cannot be purchased.`);
      if (l.currency !== 'KES') return L.fail(400, 'Only KES listings can be purchased at the moment.');
      const rate = v.commission_rate !== null && v.commission_rate !== undefined ? Number(v.commission_rate) : Number(st.commission_default);
      const fee = Math.round(l.price_cents * rate);
      total += l.price_cents; commission += fee;
      rows.push({ listing_id: l.id, vendor_id: l.vendor_id, title: l.title, type: l.type, buyer_email: user.email, price_cents: l.price_cents, commission_rate: rate, commission_cents: fee, earning_cents: l.price_cents - fee });
    }

    const reference = 'nx-' + Date.now().toString(36) + '-' + L.crypto.randomBytes(5).toString('hex');
    const order = (await L.sb('orders', { method: 'POST', body: { customer_id: user.id, email: user.email, status: 'pending', currency: 'KES', total_cents: total, commission_cents: commission, reference } }))[0];
    try {
      await L.sb('order_items', { method: 'POST', prefer: 'return=minimal', body: rows.map(r => ({ ...r, order_id: order.id })) });
    } catch (e) { await L.sb(`orders?id=eq.${order.id}`, { method: 'DELETE', prefer: 'return=minimal' }); throw e; }

    const init = await L.paystack('/transaction/initialize', 'POST', {
      email: user.email, amount: total, currency: 'KES', reference,
      callback_url: `${L.SITE_URL()}/checkout/complete/`,
      metadata: { order_id: order.id, order_no: order.order_no, platform: 'nexora-digital' }
    });
    return L.json(200, { url: init.data.authorization_url, reference });
  } catch (e) {
    console.error('checkout-init', e.message, e.details || '');
    return L.fail(502, 'We could not start your payment. Please try again.');
  }
};

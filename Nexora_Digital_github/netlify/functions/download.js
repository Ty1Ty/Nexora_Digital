'use strict';
// Issues a 60-second signed URL for a purchased digital file after verifying ownership and payment.
const L = require('./_lib');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handler = async (event) => {
  if (!L.isLive()) return L.fail(503, 'Not configured');
  const user = await L.authUser(event);
  if (!user) return L.fail(401, 'Please sign in.');
  const id = (event.queryStringParameters || {}).item || '';
  if (!UUID.test(id)) return L.fail(400, 'Invalid item');
  try {
    const it = (await L.sb(`order_items?id=eq.${id}&select=id,type,listing_id,fulfilment_status,download_count,title,orders(customer_id,status)`))[0];
    if (!it || !it.orders || it.orders.customer_id !== user.id) return L.fail(404, 'Item not found');
    if (it.orders.status !== 'paid' || it.fulfilment_status === 'refunded') return L.fail(403, 'This purchase is not available for download.');
    if (it.type !== 'digital') return L.fail(400, 'This item is a service, not a download.');
    const st = await L.settings();
    if (it.download_count >= (st.max_downloads || 10)) return L.fail(429, 'Download limit reached. Contact support to reset it.');
    const listing = (await L.sb(`listings?id=eq.${it.listing_id}&select=file_path`))[0];
    if (!listing || !listing.file_path) return L.fail(404, 'The vendor has not uploaded the file yet. Please contact support.');

    const path = listing.file_path.split('/').map(encodeURIComponent).join('/');
    const res = await fetch(`${L.SUPABASE_URL()}/storage/v1/object/sign/deliverables/${path}`, {
      method: 'POST',
      headers: { apikey: L.SERVICE_KEY(), authorization: `Bearer ${L.SERVICE_KEY()}`, 'content-type': 'application/json' },
      body: JSON.stringify({ expiresIn: 60 })
    });
    const signed = await res.json();
    if (!res.ok || !signed.signedURL) return L.fail(502, 'Could not prepare your download.');

    await L.sb(`order_items?id=eq.${id}`, { method: 'PATCH', prefer: 'return=minimal', body: { download_count: it.download_count + 1 } });
    await L.sb('download_log', { method: 'POST', prefer: 'return=minimal', body: { order_item_id: id, user_id: user.id, ip: (event.headers['x-nf-client-connection-ip'] || '').slice(0, 64) } }).catch(() => {});
    return L.json(200, { url: `${L.SUPABASE_URL()}/storage/v1${signed.signedURL}&download=${encodeURIComponent(it.title)}` });
  } catch (e) { console.error('download', e.message); return L.fail(502, 'Download failed. Please try again.'); }
};

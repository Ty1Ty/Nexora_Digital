'use strict';
// Paystack → Nexora. Set the webhook URL in Paystack to: https://YOUR-SITE/api/paystack-webhook
const L = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return L.fail(405, 'Method not allowed');
  if (!L.isLive() || !L.paymentsReady()) return L.fail(503, 'Not configured');
  const { raw } = L.parseBody(event);
  const sig = (event.headers['x-paystack-signature'] || '').toLowerCase();
  const expected = L.crypto.createHmac('sha512', L.PAYSTACK_SECRET()).update(raw).digest('hex');
  if (!sig || !L.timingSafeEq(sig, expected)) return L.fail(401, 'Invalid signature');

  let evt; try { evt = JSON.parse(raw); } catch (e) { return L.fail(400, 'Bad JSON'); }
  const d = evt.data || {};
  try {
    if (evt.event === 'charge.success' && d.reference) {
      await L.fulfilOrder(d.reference);
    } else if (['transfer.success', 'transfer.failed', 'transfer.reversed'].includes(evt.event) && d.reference) {
      const rows = await L.sb(`payouts?reference=eq.${encodeURIComponent(d.reference)}&select=id,status`);
      const p = rows[0];
      if (p) {
        if (evt.event === 'transfer.success') {
          await L.sb(`payouts?id=eq.${p.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { status: 'paid', paid_at: new Date().toISOString(), transfer_code: d.transfer_code || null } });
          await L.sb(`order_items?payout_id=eq.${p.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { payout_status: 'paid' } });
        } else if (p.status !== 'failed') {
          await L.sb(`payouts?id=eq.${p.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { status: 'failed', failure_reason: d.reason || evt.event } });
          await L.sb(`order_items?payout_id=eq.${p.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { payout_status: 'available', payout_id: null } });
        }
      }
    }
    return L.json(200, { received: true });
  } catch (e) {
    console.error('webhook', evt.event, e.message);
    return L.fail(500, 'Processing error'); // Paystack will retry
  }
};

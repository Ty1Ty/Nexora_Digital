'use strict';
// Automated vendor payouts: release held earnings, then pay each vendor in one transfer.
const L = require('./_lib');

async function runPayouts() {
  const st = await L.settings();
  const summary = { released: 0, paid: [], skipped: [], failed: [] };
  const now = new Date().toISOString();

  // 1) Release earnings whose protection window has passed and whose order is delivered/completed
  const released = await L.sb(`order_items?payout_status=eq.on_hold&available_at=lte.${encodeURIComponent(now)}&fulfilment_status=in.(delivered,completed)`, { method: 'PATCH', body: { payout_status: 'available' } });
  summary.released = (released || []).length;

  // 2) Group available earnings per vendor
  const items = await L.sb('order_items?payout_status=eq.available&select=id,vendor_id,earning_cents,vendors(status,recipient_code,store_name)&limit=3000');
  const byVendor = {};
  for (const it of items) { (byVendor[it.vendor_id] = byVendor[it.vendor_id] || { v: it.vendors, ids: [], sum: 0 }); byVendor[it.vendor_id].ids.push(it.id); byVendor[it.vendor_id].sum += it.earning_cents; }

  for (const [vendorId, g] of Object.entries(byVendor)) {
    const label = (g.v && g.v.store_name) || vendorId;
    if (!g.v || g.v.status !== 'approved' || !g.v.recipient_code) { summary.skipped.push({ vendor: label, reason: 'No payout details yet', amount: g.sum }); continue; }
    if (g.sum < st.min_payout_cents) { summary.skipped.push({ vendor: label, reason: 'Below minimum payout', amount: g.sum }); continue; }

    const reference = 'nx-po-' + Date.now().toString(36) + L.crypto.randomBytes(4).toString('hex');
    const payout = (await L.sb('payouts', { method: 'POST', body: { vendor_id: vendorId, amount_cents: g.sum, reference, status: 'pending' } }))[0];
    const claimed = await L.sb(`order_items?id=in.(${g.ids.join(',')})&payout_status=eq.available`, { method: 'PATCH', body: { payout_status: 'processing', payout_id: payout.id } });
    const sum = (claimed || []).reduce((s, r) => s + r.earning_cents, 0);
    if (!claimed || !claimed.length || sum < st.min_payout_cents) {
      if (claimed && claimed.length) await L.sb(`order_items?payout_id=eq.${payout.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { payout_status: 'available', payout_id: null } });
      await L.sb(`payouts?id=eq.${payout.id}`, { method: 'DELETE', prefer: 'return=minimal' });
      continue;
    }
    if (sum !== g.sum) await L.sb(`payouts?id=eq.${payout.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { amount_cents: sum } });

    try {
      const t = await L.paystack('/transfer', 'POST', { source: 'balance', amount: sum, recipient: g.v.recipient_code, reason: 'Nexora Digital earnings payout', reference, currency: 'KES' });
      const status = t.data.status;
      if (status === 'otp') throw new Error('Transfer needs OTP approval — disable transfer OTP in Paystack settings so payouts can run automatically.');
      await L.sb(`payouts?id=eq.${payout.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { status: status === 'success' ? 'paid' : 'processing', transfer_code: t.data.transfer_code, paid_at: status === 'success' ? new Date().toISOString() : null } });
      if (status === 'success') await L.sb(`order_items?payout_id=eq.${payout.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { payout_status: 'paid' } });
      summary.paid.push({ vendor: label, amount: sum, status });
    } catch (e) {
      await L.sb(`payouts?id=eq.${payout.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { status: 'failed', failure_reason: String(e.message).slice(0, 300) } });
      await L.sb(`order_items?payout_id=eq.${payout.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { payout_status: 'available', payout_id: null } });
      summary.failed.push({ vendor: label, amount: sum, reason: e.message });
    }
  }
  return summary;
}
module.exports = { runPayouts };

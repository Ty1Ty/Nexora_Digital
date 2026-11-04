'use strict';
// Privileged admin operations. Every call re-verifies the caller is an admin server-side.
const L = require('./_lib');
const { runPayouts } = require('./_payouts');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const need = (v) => { if (!UUID.test(String(v || ''))) throw Object.assign(new Error('Invalid id'), { status: 400 }); return v; };
const patch = (table, id, body) => L.sb(`${table}?id=eq.${id}`, { method: 'PATCH', body });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return L.fail(405, 'Method not allowed');
  if (!L.isLive()) return L.fail(503, 'Not configured');
  const admin = await L.requireAdmin(event);
  if (!admin) return L.fail(403, 'Admins only.');
  const { data: d, error } = L.parseBody(event);
  if (error) return L.fail(400, 'Invalid request');

  try {
    let result = { ok: true }, rebuild = false;
    switch (d.action) {
      case 'approve_vendor': {
        const v = (await patch('vendors', need(d.vendor_id), { status: 'approved' }))[0];
        if (v && v.user_id) await L.sb(`profiles?id=eq.${v.user_id}&role=neq.admin`, { method: 'PATCH', prefer: 'return=minimal', body: { role: 'vendor' } });
        rebuild = true; break;
      }
      case 'reject_vendor': await patch('vendors', need(d.vendor_id), { status: 'rejected' }); break;
      case 'suspend_vendor':
        await patch('vendors', need(d.vendor_id), { status: 'suspended' });
        await L.sb(`listings?vendor_id=eq.${d.vendor_id}&status=eq.approved`, { method: 'PATCH', prefer: 'return=minimal', body: { status: 'archived' } });
        rebuild = true; break;
      case 'set_commission': {
        const rate = d.rate === null || d.rate === '' ? null : Number(d.rate);
        if (rate !== null && !(rate >= 0 && rate <= 0.9)) return L.fail(400, 'Commission must be between 0% and 90%.');
        await patch('vendors', need(d.vendor_id), { commission_rate: rate }); break;
      }
      case 'approve_listing': await patch('listings', need(d.listing_id), { status: 'approved', reject_reason: null }); rebuild = true; break;
      case 'reject_listing': await patch('listings', need(d.listing_id), { status: 'rejected', reject_reason: String(d.reason || 'Does not meet listing guidelines').slice(0, 300) }); break;
      case 'refund_order': {
        const o = (await L.sb(`orders?id=eq.${need(d.order_id)}&select=*`))[0];
        if (!o || o.status !== 'paid') return L.fail(400, 'Only paid orders can be refunded.');
        if (!L.paymentsReady()) return L.fail(503, 'Paystack is not configured.');
        await L.paystack('/refund', 'POST', { transaction: o.reference });
        await patch('orders', o.id, { status: 'refunded' });
        const items = await L.sb(`order_items?order_id=eq.${o.id}&select=id,payout_status`);
        const paidOut = items.filter(i => i.payout_status === 'paid' || i.payout_status === 'processing').length;
        await L.sb(`order_items?order_id=eq.${o.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { fulfilment_status: 'refunded' } });
        await L.sb(`order_items?order_id=eq.${o.id}&payout_status=in.(on_hold,available,unpaid)`, { method: 'PATCH', prefer: 'return=minimal', body: { payout_status: 'void' } });
        result.warning = paidOut ? `${paidOut} item(s) were already paid out to vendors — recover those funds manually.` : null; break;
      }
      case 'run_payouts': result.summary = await runPayouts(); break;
      case 'save_settings': {
        const allowed = { commission_default: [0, 0.9], payout_hold_days: [0, 60], min_payout_cents: [0, 10000000], max_downloads: [1, 100] };
        for (const [k, [lo, hi]] of Object.entries(allowed)) {
          if (d.settings && d.settings[k] !== undefined) {
            const n = Number(d.settings[k]); if (!(n >= lo && n <= hi)) return L.fail(400, `Invalid value for ${k}`);
            await L.sb('settings?on_conflict=key', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: { key: k, value: n, updated_at: new Date().toISOString() } });
          }
        } break;
      }
      case 'remove_demo': {
        try {
          await L.sb('listings?is_demo=eq.true', { method: 'DELETE', prefer: 'return=minimal' });
          await L.sb('vendors?is_demo=eq.true', { method: 'DELETE', prefer: 'return=minimal' });
        } catch (e) {
          await L.sb('listings?is_demo=eq.true', { method: 'PATCH', prefer: 'return=minimal', body: { status: 'archived' } });
          result.warning = 'Some demo records have test orders attached, so they were archived instead of deleted.';
        }
        rebuild = true; break;
      }
      case 'rebuild': rebuild = true; break;
      default: return L.fail(400, 'Unknown action');
    }
    await L.audit(admin.id, d.action, d.vendor_id || d.listing_id || d.order_id || null, { reason: d.reason || null });
    if (rebuild) result.rebuild = await L.triggerRebuild();
    return L.json(200, result);
  } catch (e) {
    console.error('admin-action', d.action, e.message);
    return L.fail(e.status && e.status < 500 ? e.status : 502, e.message || 'Action failed');
  }
};

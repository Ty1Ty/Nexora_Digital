'use strict';
// Saves a vendor's payout destination and registers it as a Paystack transfer recipient (M-Pesa wallet, Till or Paybill).
const L = require('./_lib');

function phone(raw) {
  const d = String(raw || '').replace(/[\s\-+()]/g, '');
  const m = d.match(/^(?:254|0)?([17]\d{8})$/);
  return m ? '0' + m[1] : null;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return L.fail(405, 'Method not allowed');
  if (!L.isLive() || !L.paymentsReady()) return L.fail(503, 'Payments are not configured yet.');
  const user = await L.authUser(event);
  if (!user) return L.fail(401, 'Please sign in.');
  const { data, error } = L.parseBody(event);
  if (error) return L.fail(400, 'Invalid request');

  const vendor = (await L.sb(`vendors?user_id=eq.${user.id}&select=id,status,store_name`))[0];
  if (!vendor || vendor.status !== 'approved') return L.fail(403, 'Your vendor account must be approved first.');

  const method = String(data.method || '');
  const name = String(data.name || '').trim().slice(0, 80);
  if (name.length < 3) return L.fail(400, 'Enter the account holder name exactly as registered.');
  let account, body;
  if (method === 'mpesa') {
    account = phone(data.account);
    if (!account) return L.fail(400, 'Enter a valid Safaricom M-Pesa number (e.g. 0712 345 678).');
    body = { type: 'mobile_money', name, account_number: account, bank_code: 'MPESA', currency: 'KES' };
  } else if (method === 'till' || method === 'paybill') {
    account = String(data.account || '').replace(/\D/g, '');
    if (account.length < 5 || account.length > 7) return L.fail(400, 'Enter a valid Till / Paybill number.');
    body = { type: 'mobile_money', name, account_number: account, bank_code: 'MPESA', currency: 'KES' };
    if (method === 'paybill') {
      const ref = String(data.reference || '').trim().slice(0, 40);
      if (!ref) return L.fail(400, 'Paybill payouts need an account reference.');
      body.metadata = { account_number: ref };
    }
  } else return L.fail(400, 'Choose M-Pesa, Till or Paybill.');

  try {
    const r = await L.paystack('/transferrecipient', 'POST', body);
    await L.sb(`vendors?id=eq.${vendor.id}`, { method: 'PATCH', prefer: 'return=minimal', body: { payout_method: method, payout_account: account, payout_name: name, payout_bank_code: 'MPESA', recipient_code: r.data.recipient_code } });
    await L.audit(user.id, 'vendor_payout_details', vendor.id, { method });
    return L.json(200, { ok: true });
  } catch (e) { console.error('vendor-bank', e.message); return L.fail(400, 'Paystack could not verify these payout details: ' + e.message); }
};

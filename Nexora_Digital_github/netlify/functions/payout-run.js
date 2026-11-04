'use strict';
// SCHEDULED (see netlify.toml): runs daily at 06:00 UTC (09:00 Nairobi). Pays vendors their released earnings.
const L = require('./_lib');
const { runPayouts } = require('./_payouts');

exports.handler = async () => {
  if (!L.isLive() || !L.paymentsReady()) { console.log('payout-run: not configured, skipping'); return { statusCode: 200 }; }
  try {
    const s = await runPayouts();
    console.log('payout-run', JSON.stringify(s));
    await L.audit(null, 'scheduled_payouts', null, s);
  } catch (e) { console.error('payout-run failed', e.message); }
  return { statusCode: 200 };
};

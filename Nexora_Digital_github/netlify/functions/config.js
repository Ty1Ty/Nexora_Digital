'use strict';
// Public runtime config for the front-end. The Supabase anon key is designed to be public (RLS protects data).
const { env, isLive, paymentsReady, json, SITE_URL } = require('./_lib');

exports.handler = async () => json(200, {
  live: isLive(),
  payments: isLive() && paymentsReady(),
  testMode: env('PAYSTACK_SECRET_KEY').startsWith('sk_test'),
  supabaseUrl: isLive() ? env('SUPABASE_URL') : '',
  supabaseAnonKey: isLive() ? env('SUPABASE_ANON_KEY') : '',
  gaId: env('GA_MEASUREMENT_ID'),
  siteUrl: SITE_URL()
}, { 'cache-control': 'public, max-age=60' });

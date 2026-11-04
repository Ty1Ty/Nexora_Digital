/* Administrator dashboard: approvals, orders & refunds, commission tracking, payouts, settings */
(function () {
  var NX = window.NX, $ = NX.$, esc = NX.esc, root = $('#app'), demo = false, view = 'overview';
  var D = { vendors: [], listings: [], orders: [], items: [], payouts: [], messages: [], subs: 0, settings: { commission_default: 0.12, payout_hold_days: 7, min_payout_cents: 50000, max_downloads: 10 } };
  var money = NX.kes, sum = function (a, k) { return a.reduce(function (s, x) { return s + (x[k] || 0); }, 0); };
  function kpi(l, v, s) { return '<div class="kpi"><small>' + l + '</small><b>' + v + '</b><span>' + s + '</span></div>'; }
  function table(h, rows, empty) { return rows.length ? '<div class="tablewrap"><table><thead><tr>' + h.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' : '<div class="empty">' + empty + '</div>'; }
  var vname = function (id) { var v = D.vendors.filter(function (x) { return x.id === id; })[0]; return v ? v.store_name : '—'; };

  function demoData() {
    var d = function (n) { return new Date(Date.now() - n * 86400000).toISOString(); };
    D.vendors = [{ id: 'v1', store_name: 'Savannah Sheets', category: 'business-templates', status: 'approved', commission_rate: null, created_at: d(60), country: 'Kenya', recipient_code: 'RCP_x' }, { id: 'v2', store_name: 'Mombasa Media', category: 'video-audio', status: 'approved', commission_rate: .1, created_at: d(40), country: 'Kenya', recipient_code: 'RCP_y' }, { id: 'v3', store_name: 'Lakeside Learning', category: 'courses-ebooks', status: 'pending', created_at: d(1), country: 'Kenya', bio: 'Online tutor selling study guides.' }, { id: 'v4', store_name: 'Rift Valley Designs', category: 'design-branding', status: 'pending', created_at: d(2), country: 'Kenya', bio: 'Logo & brand identity studio.' }];
    D.listings = [{ id: 'l1', vendor_id: 'v3', title: 'KCSE Revision Guide Bundle', category: 'courses-ebooks', type: 'digital', price_cents: 90000, status: 'pending', created_at: d(1), summary: 'Study guides', slug: 'x' }, { id: 'l2', vendor_id: 'v4', title: 'Brand Identity Package', category: 'design-branding', type: 'service', price_cents: 450000, status: 'pending', created_at: d(1), summary: 'Logo + guide', slug: 'y' }, { id: 'l3', vendor_id: 'v1', title: 'Small Business Excel Tracker', category: 'business-templates', type: 'digital', price_cents: 45000, status: 'approved', created_at: d(30), slug: 'z' }];
    D.orders = [{ id: 'o1', order_no: 1042, email: 'jane@example.com', status: 'paid', total_cents: 135000, commission_cents: 16200, channel: 'mobile_money', created_at: d(2) }, { id: 'o2', order_no: 1041, email: 'peter@example.com', status: 'paid', total_cents: 450000, commission_cents: 54000, channel: 'card', created_at: d(4) }, { id: 'o3', order_no: 1040, email: 'amina@example.com', status: 'paid', total_cents: 90000, commission_cents: 10800, channel: 'mobile_money', created_at: d(6) }];
    D.payouts = [{ id: 'p1', vendor_id: 'v1', amount_cents: 117600, status: 'paid', reference: 'nx-po-demo1', created_at: d(12) }, { id: 'p2', vendor_id: 'v2', amount_cents: 396000, status: 'processing', reference: 'nx-po-demo2', created_at: d(1) }];
    D.items = [{ earning_cents: 120000, payout_status: 'available' }, { earning_cents: 500000, payout_status: 'on_hold' }]; D.subs = 128; D.messages = [{ id: 'm1', name: 'Grace', email: 'grace@example.com', subject: 'Vendor question', body: 'How do I get paid?', created_at: d(1) }];
  }

  function act(action, payload, ok) {
    if (demo) return NX.toast('Preview mode — actions run once the backend is connected.');
    NX.api('admin-action', { body: Object.assign({ action: action }, payload || {}) }).then(function (r) { NX.toast(ok || 'Done ✓'); if (r.warning) alert(r.warning); if (r.summary) alert('Payout run:\n' + JSON.stringify(r.summary, null, 2)); return reload(); }).catch(function (e) { NX.toast(e.message); });
  }

  var views = {
    overview: function () {
      var paid = D.orders.filter(function (o) { return o.status === 'paid'; });
      var gmv = sum(paid, 'total_cents'), fees = sum(paid, 'commission_cents');
      var pv = D.vendors.filter(function (v) { return v.status === 'pending'; }).length, pl = D.listings.filter(function (l) { return l.status === 'pending'; }).length;
      var due = sum(D.items.filter(function (i) { return i.payout_status === 'available'; }), 'earning_cents');
      return '<h1>Admin overview</h1><p class="sub">Marketplace health, approvals and money flow.</p><div class="kpis">' + kpi('Gross sales (GMV)', money(gmv), paid.length + ' paid orders') + kpi('Commission earned', money(fees), 'Platform revenue') + kpi('Payouts due', money(due), 'Next scheduled run 09:00 EAT') + kpi('Newsletter', String(D.subs), 'subscribers') + '</div>' +
        '<div class="row2"><div class="box"><h3>Needs attention</h3><ul style="margin:0;padding-left:18px;display:grid;gap:9px"><li><b>' + pv + '</b> vendor application(s) waiting <a href="#" data-go="vendors" style="color:var(--green);font-weight:700">Review →</a></li><li><b>' + pl + '</b> listing(s) waiting <a href="#" data-go="listings" style="color:var(--green);font-weight:700">Review →</a></li><li><b>' + D.messages.length + '</b> recent contact message(s) <a href="#" data-go="messages" style="color:var(--green);font-weight:700">Read →</a></li></ul></div>' +
        '<div class="box"><h3>Automation</h3><ul style="margin:0;padding-left:18px;display:grid;gap:9px"><li>Commission is calculated at checkout (default ' + Math.round(D.settings.commission_default * 1000) / 10 + '%)</li><li>Vendor earnings are held ' + D.settings.payout_hold_days + ' days, then paid out daily</li><li>Approving a listing rebuilds SEO pages & sitemap automatically</li></ul></div></div>';
    },
    vendors: function () {
      var rows = D.vendors.map(function (v) {
        return '<tr><td><b>' + esc(v.store_name) + '</b><div class="muted" style="font-size:12.5px">' + esc(NX.catName(v.category || '')) + ' · ' + esc(v.country || '') + '</div>' + (v.bio ? '<div style="font-size:12.5px;max-width:320px">' + esc(v.bio).slice(0, 140) + '</div>' : '') + '</td><td>' + NX.status(v.status) + '</td><td>' + (v.commission_rate != null ? Math.round(v.commission_rate * 1000) / 10 + '%' : 'Default') + '</td><td>' + (v.recipient_code ? '✓ set' : '<span class="muted">none</span>') + '</td><td>' + NX.date(v.created_at) + '</td><td class="actions">' +
          (v.status !== 'approved' ? '<button class="btn btn-primary btn-sm" data-a="approve_vendor" data-id="' + v.id + '">Approve</button>' : '') + (v.status === 'pending' ? '<button class="btn btn-danger btn-sm" data-a="reject_vendor" data-id="' + v.id + '">Reject</button>' : '') + (v.status === 'approved' ? '<button class="btn btn-line btn-sm" data-comm="' + v.id + '">Commission</button><button class="btn btn-danger btn-sm" data-a="suspend_vendor" data-id="' + v.id + '">Suspend</button>' : '') + '</td></tr>';
      });
      return '<h1>Vendors</h1><p class="sub">Approve applications, set custom commission rates, suspend bad actors.</p><div class="box">' + table(['Vendor', 'Status', 'Commission', 'Payout', 'Applied', ''], rows, 'No vendors yet.') + '</div>';
    },
    listings: function () {
      var order = { pending: 0, approved: 1, rejected: 2, draft: 3, archived: 4 };
      var rows = D.listings.filter(function (l) { return l.status !== 'draft'; }).sort(function (a, b) { return order[a.status] - order[b.status]; }).map(function (l) {
        return '<tr><td><b>' + esc(l.title) + '</b><div class="muted" style="font-size:12.5px;max-width:340px">' + esc(l.summary || '') + '</div></td><td>' + esc(vname(l.vendor_id)) + '</td><td>' + esc(NX.catName(l.category)) + '</td><td>' + money(l.price_cents) + '</td><td>' + NX.status(l.status) + '</td><td class="actions">' + (l.status === 'pending' ? '<button class="btn btn-primary btn-sm" data-a="approve_listing" data-id="' + l.id + '">Approve</button><button class="btn btn-danger btn-sm" data-rej="' + l.id + '">Reject</button>' : '') + (l.status === 'approved' ? '<a class="btn btn-line btn-sm" target="_blank" rel="noopener" href="/product/' + esc(l.slug) + '/">View</a>' : '') + '</td></tr>';
      });
      return '<h1>Listing approvals</h1><p class="sub">Check quality, pricing and category before publishing.</p><div class="box">' + table(['Listing', 'Vendor', 'Category', 'Price', 'Status', ''], rows, 'No listings submitted yet.') + '</div>';
    },
    orders: function () {
      var rows = D.orders.map(function (o) { return '<tr><td>NX-' + esc(o.order_no) + '<div class="muted" style="font-size:12px">' + NX.date(o.created_at) + '</div></td><td>' + esc(o.email) + '</td><td>' + NX.status(o.status) + '</td><td>' + money(o.total_cents) + '</td><td>' + money(o.commission_cents) + '</td><td>' + esc(o.channel || '') + '</td><td>' + (o.status === 'paid' ? '<button class="btn btn-danger btn-sm" data-refund="' + o.id + '">Refund</button>' : '') + '</td></tr>'; });
      return '<h1>Orders & commissions</h1><p class="sub">Every order with the commission earned by the platform.</p><div class="box">' + table(['Order', 'Customer', 'Status', 'Total', 'Commission', 'Channel', ''], rows, 'No orders yet.') + '</div>';
    },
    payouts: function () {
      var rows = D.payouts.map(function (p) { return '<tr><td>' + NX.date(p.created_at) + '</td><td>' + esc(vname(p.vendor_id)) + '</td><td><b>' + money(p.amount_cents) + '</b></td><td>' + NX.status(p.status) + '</td><td class="muted">' + esc(p.reference) + (p.failure_reason ? '<div style="color:var(--bad)">' + esc(p.failure_reason) + '</div>' : '') + '</td></tr>'; });
      return '<h1>Vendor payouts</h1><p class="sub">Runs automatically every day at 09:00 EAT. You can also trigger a run now.</p><div class="box"><h3>Payout history <button class="btn btn-primary btn-sm" id="runP">Run payouts now</button></h3>' + table(['Date', 'Vendor', 'Amount', 'Status', 'Reference'], rows, 'No payouts yet.') + '</div>';
    },
    messages: function () {
      var rows = D.messages.map(function (m) { return '<tr><td>' + NX.date(m.created_at) + '</td><td><b>' + esc(m.name || '') + '</b><div class="muted" style="font-size:12.5px">' + esc(m.email || '') + '</div></td><td><b>' + esc(m.subject || '') + '</b><div style="max-width:420px">' + esc(m.body) + '</div></td></tr>'; });
      return '<h1>Messages</h1><p class="sub">Contact form submissions.</p><div class="box">' + table(['Date', 'From', 'Message'], rows, 'No messages.') + '</div>';
    },
    settings: function () {
      var s = D.settings;
      return '<h1>Settings</h1><p class="sub">Commission and payout rules apply to new orders instantly.</p><div class="box" style="max-width:600px"><form id="sf"><div class="row2"><div class="field"><label>Default commission (%)</label><input id="s1" type="number" step="0.1" min="0" max="90" value="' + (s.commission_default * 100) + '"></div><div class="field"><label>Payout hold (days)</label><input id="s2" type="number" min="0" max="60" value="' + s.payout_hold_days + '"></div></div><div class="row2"><div class="field"><label>Minimum payout (KES)</label><input id="s3" type="number" min="0" value="' + s.min_payout_cents / 100 + '"></div><div class="field"><label>Max downloads per purchase</label><input id="s4" type="number" min="1" max="100" value="' + s.max_downloads + '"></div></div><button class="btn btn-dark">Save settings</button></form></div>' +
        '<div class="box" style="max-width:600px"><h3>Maintenance</h3><div class="actions"><button class="btn btn-line" id="rb">Rebuild SEO pages & sitemap</button><button class="btn btn-danger" id="rd">Remove all sample/demo content</button></div><p class="muted" style="font-size:13px;margin-bottom:0">Rebuild requires a Netlify build hook (env NETLIFY_BUILD_HOOK).</p></div>';
    }
  };

  var NAV = [['overview', '◧', 'Overview'], ['vendors', '☺', 'Vendors'], ['listings', '▦', 'Listings'], ['orders', '$', 'Orders & commission'], ['payouts', '⇄', 'Payouts'], ['messages', '✉', 'Messages'], ['settings', '⚙', 'Settings']];
  function paint() {
    var pv = D.vendors.filter(function (v) { return v.status === 'pending'; }).length, pl = D.listings.filter(function (l) { return l.status === 'pending'; }).length;
    var pill = { vendors: pv, listings: pl };
    root.innerHTML = (demo ? '<div class="mode-banner">Preview mode — sample admin dashboard with placeholder data.</div>' : '') + '<div class="dash"><aside class="side"><h5>Nexora admin</h5>' + NAV.map(function (n) { return '<button data-v="' + n[0] + '" class="' + (n[0] === view ? 'on' : '') + '"><span>' + n[1] + '</span>' + n[2] + (pill[n[0]] ? '<span class="pill">' + pill[n[0]] + '</span>' : '') + '</button>'; }).join('') + '</aside><div class="main">' + views[view]() + '</div></div>';
    bind();
  }
  function bind() {
    var q = function (s) { return root.querySelector(s); };
    root.querySelectorAll('[data-v],[data-go]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); view = b.getAttribute('data-v') || b.getAttribute('data-go'); paint(); window.scrollTo(0, 0); }; });
    root.querySelectorAll('[data-a]').forEach(function (b) { b.onclick = function () { var a = b.getAttribute('data-a'), id = b.getAttribute('data-id'); act(a, a.indexOf('listing') > -1 ? { listing_id: id } : { vendor_id: id }, 'Updated ✓'); }; });
    root.querySelectorAll('[data-rej]').forEach(function (b) { b.onclick = function () { var r = prompt('Reason for rejection (shown to vendor):', 'Please add more detail and a clearer description.'); if (r !== null) act('reject_listing', { listing_id: b.getAttribute('data-rej'), reason: r }); }; });
    root.querySelectorAll('[data-comm]').forEach(function (b) { b.onclick = function () { var r = prompt('Custom commission % for this vendor (leave blank for default):', ''); if (r === null) return; act('set_commission', { vendor_id: b.getAttribute('data-comm'), rate: r === '' ? null : Number(r) / 100 }); }; });
    root.querySelectorAll('[data-refund]').forEach(function (b) { b.onclick = function () { if (confirm('Refund this order via Paystack and void vendor earnings?')) act('refund_order', { order_id: b.getAttribute('data-refund') }, 'Refund requested ✓'); }; });
    if (q('#runP')) q('#runP').onclick = function () { act('run_payouts'); };
    if (q('#rb')) q('#rb').onclick = function () { act('rebuild', {}, 'Rebuild triggered'); };
    if (q('#rd')) q('#rd').onclick = function () { if (confirm('Delete all sample content? This cannot be undone.')) act('remove_demo'); };
    if (q('#sf')) q('#sf').onsubmit = function (e) { e.preventDefault(); act('save_settings', { settings: { commission_default: Number(q('#s1').value) / 100, payout_hold_days: Number(q('#s2').value), min_payout_cents: Math.round(Number(q('#s3').value) * 100), max_downloads: Number(q('#s4').value) } }, 'Settings saved ✓'); };
  }
  function reload() {
    var sb = NX.sb;
    return Promise.all([sb.from('vendors').select('*').order('created_at', { ascending: false }), sb.from('listings').select('id,vendor_id,title,summary,slug,category,type,price_cents,status,created_at').order('created_at', { ascending: false }).limit(500), sb.from('orders').select('*').order('created_at', { ascending: false }).limit(300), sb.from('order_items').select('earning_cents,payout_status').limit(5000), sb.from('payouts').select('*').order('created_at', { ascending: false }).limit(200), sb.from('messages').select('*').order('created_at', { ascending: false }).limit(50), sb.from('subscribers').select('email', { count: 'exact', head: true }), sb.from('settings').select('key,value')])
      .then(function (r) { D.vendors = r[0].data || []; D.listings = r[1].data || []; D.orders = r[2].data || []; D.items = r[3].data || []; D.payouts = r[4].data || []; D.messages = r[5].data || []; D.subs = r[6].count || 0; (r[7].data || []).forEach(function (s) { D.settings[s.key] = Number(s.value); }); paint(); });
  }
  NX.ready.then(function () { return NX.loadCatalog(); }).then(function () {
    if (!NX.cfg.live) { demo = true; demoData(); return paint(); }
    if (!NX.requireLogin()) return;
    if (!NX.profile || NX.profile.role !== 'admin') { root.innerHTML = '<div class="wrap" style="padding:60px 0"><div class="empty"><h2>Administrators only</h2><p>Your account does not have admin access.</p><a class="btn btn-dark" href="/">Back to marketplace</a></div></div>'; return; }
    reload();
  });
})();

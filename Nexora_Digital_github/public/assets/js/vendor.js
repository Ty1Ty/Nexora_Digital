/* Vendor dashboard: overview, listings (create / approval), orders & fulfilment, earnings ledger, automated payouts */
(function () {
  var NX = window.NX, $ = NX.$, esc = NX.esc, root = $('#app');
  var D = { listings: [], items: [], payouts: [], settings: { commission_default: 0.12, payout_hold_days: 7, min_payout_cents: 50000 } }, demo = false, view = 'overview';

  function demoData() {
    var now = Date.now(), d = function (n) { return new Date(now - n * 86400000).toISOString(); };
    NX.vendor = { id: 'v1', user_id: 'u1', store_name: 'Savannah Sheets', status: 'approved', bio: 'Excel templates and data tools for small businesses.', country: 'Kenya', payout_method: 'mpesa', payout_account: '0712345678', payout_name: 'Savannah Sheets Ltd', recipient_code: 'RCP_demo', commission_rate: null };
    D.listings = [
      { id: 'l1', title: 'Small Business Excel Tracker', category: 'business-templates', type: 'digital', price_cents: 45000, status: 'approved', sales_count: 38, created_at: d(40), slug: 'small-business-excel-tracker' },
      { id: 'l2', title: 'Sales Dashboard Excel Template', category: 'data-spreadsheets', type: 'digital', price_cents: 120000, status: 'approved', sales_count: 12, created_at: d(25), slug: 'sales-dashboard-excel-template' },
      { id: 'l3', title: 'Invoice & Quotation Template Bundle', category: 'business-templates', type: 'digital', price_cents: 50000, status: 'pending', sales_count: 0, created_at: d(2), slug: 'invoice-bundle' },
      { id: 'l4', title: 'Budget Planner (Draft)', category: 'business-templates', type: 'digital', price_cents: 30000, status: 'draft', sales_count: 0, created_at: d(1), slug: 'budget-planner' }];
    var mk = function (id, t, price, st, ps, days, type, buyer) { var fee = Math.round(price * .12); return { id: id, title: t, type: type || 'digital', price_cents: price, commission_rate: .12, commission_cents: fee, earning_cents: price - fee, fulfilment_status: st, payout_status: ps, available_at: d(-days), buyer_email: buyer || 'buyer@example.com', orders: { order_no: 1000 + Number(id.slice(1)), status: 'paid', created_at: d(days + 1) } }; };
    D.items = [mk('i1', 'Small Business Excel Tracker', 45000, 'delivered', 'paid', 20), mk('i2', 'Sales Dashboard Excel Template', 120000, 'delivered', 'paid', 15), mk('i3', 'Small Business Excel Tracker', 45000, 'delivered', 'available', 9), mk('i4', 'Sales Dashboard Excel Template', 120000, 'delivered', 'on_hold', -3), mk('i5', 'Small Business Excel Tracker', 45000, 'delivered', 'on_hold', -5), mk('i6', 'Custom Excel Setup', 250000, 'in_progress', 'on_hold', -6, 'service', 'amina@example.com')];
    D.payouts = [{ id: 'p1', amount_cents: 117600, status: 'paid', reference: 'nx-po-demo1', created_at: d(12), paid_at: d(12) }, { id: 'p2', amount_cents: 39600, status: 'paid', reference: 'nx-po-demo2', created_at: d(26), paid_at: d(26) }];
  }

  var sum = function (a, k) { return a.reduce(function (s, x) { return s + (x[k] || 0); }, 0); };
  var paid = function () { return D.items.filter(function (i) { return i.orders && i.orders.status === 'paid' && i.fulfilment_status !== 'refunded'; }); };
  var money = NX.kes;
  function kpi(l, v, s) { return '<div class="kpi"><small>' + l + '</small><b>' + v + '</b><span>' + s + '</span></div>'; }
  function table(h, rows, empty) { return rows.length ? '<div class="tablewrap"><table><thead><tr>' + h.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' : '<div class="empty">' + empty + '</div>'; }

  /* ---------- views ---------- */
  var views = {
    overview: function () {
      var p = paid(), gross = sum(p, 'price_cents'), fees = sum(p, 'commission_cents'), net = sum(p, 'earning_cents');
      var avail = sum(D.items.filter(function (i) { return i.payout_status === 'available'; }), 'earning_cents');
      var hold = sum(D.items.filter(function (i) { return i.payout_status === 'on_hold'; }), 'earning_cents');
      var months = {}; p.forEach(function (i) { var k = new Date((i.orders && i.orders.created_at) || Date.now()).toLocaleString('en', { month: 'short' }); months[k] = (months[k] || 0) + i.earning_cents; });
      var ks = Object.keys(months).slice(-6), max = Math.max.apply(null, ks.map(function (k) { return months[k]; }).concat([1]));
      var todo = D.items.filter(function (i) { return i.type === 'service' && ['pending', 'in_progress'].indexOf(i.fulfilment_status) > -1 && i.orders && i.orders.status === 'paid'; }).length;
      var pend = D.listings.filter(function (l) { return l.status === 'pending'; }).length;
      return '<h1>Overview</h1><p class="sub">Your store at a glance — commission is calculated automatically on every sale.</p><div class="kpis">' + kpi('Gross sales', money(gross), p.length + ' order items') + kpi('Marketplace commission', money(fees), 'Auto-deducted') + kpi('Your earnings', money(net), 'After commission') + kpi('Next payout', money(avail), 'Released: ' + money(hold) + ' on hold') + '</div>' +
        '<div class="row2"><div class="box"><h3>Earnings by month</h3>' + (ks.length ? '<div class="bars" style="margin-bottom:26px">' + ks.map(function (k) { return '<div style="height:' + Math.max(4, months[k] / max * 100) + '%"><span>' + k + '</span></div>'; }).join('') + '</div>' : '<div class="empty">Sales will chart here.</div>') + '</div>' +
        '<div class="box"><h3>To do</h3><ul style="margin:0;padding-left:18px;display:grid;gap:8px"><li>' + todo + ' service order(s) awaiting delivery</li><li>' + pend + ' listing(s) awaiting approval</li><li>' + (NX.vendor.recipient_code ? 'Payout details ✓ (' + esc(NX.vendor.payout_method) + ')' : '<b style="color:var(--bad)">Add payout details to get paid</b>') + '</li></ul><p class="muted" style="font-size:13px;margin-top:14px">Payouts run automatically every day. Earnings are held ' + D.settings.payout_hold_days + ' days for buyer protection, minimum payout ' + money(D.settings.min_payout_cents) + '.</p></div></div>';
    },
    listings: function () {
      var rows = D.listings.map(function (l) {
        return '<tr><td><b>' + esc(l.title) + '</b>' + (l.reject_reason ? '<div style="font-size:12.5px;color:var(--bad)">Rejected: ' + esc(l.reject_reason) + '</div>' : '') + '</td><td>' + esc(NX.catName(l.category)) + '</td><td>' + (l.type === 'digital' ? 'Download' : 'Service') + '</td><td>' + money(l.price_cents) + '</td><td>' + NX.status(l.status) + '</td><td>' + (l.sales_count || 0) + '</td><td class="actions"><button class="btn btn-line btn-sm" data-edit="' + l.id + '">Edit</button>' + (['draft', 'rejected'].indexOf(l.status) > -1 ? '<button class="btn btn-danger btn-sm" data-del="' + l.id + '">Delete</button>' : '') + (l.status === 'approved' ? '<a class="btn btn-line btn-sm" href="/product/' + esc(l.slug) + '/" target="_blank" rel="noopener">View</a>' : '') + '</td></tr>';
      });
      return '<h1>Listings</h1><p class="sub">Create listings and submit them for approval. Approved listings appear in search automatically.</p><div class="box"><h3>Your listings <button class="btn btn-primary btn-sm" id="newL">+ New listing</button></h3>' + table(['Title', 'Category', 'Type', 'Price', 'Status', 'Sales', ''], rows, 'You have no listings yet. Create your first one!') + '</div>';
    },
    orders: function () {
      var rows = D.items.filter(function (i) { return i.orders && i.orders.status === 'paid'; }).map(function (i) {
        var act = '';
        if (i.type === 'service' && i.fulfilment_status !== 'completed' && i.fulfilment_status !== 'refunded') act = (i.fulfilment_status === 'pending' ? '<button class="btn btn-line btn-sm" data-start="' + i.id + '">Start work</button>' : '') + '<button class="btn btn-dark btn-sm" data-deliver="' + i.id + '">' + (i.fulfilment_status === 'delivered' ? 'Update delivery' : 'Deliver') + '</button>';
        return '<tr><td>NX-' + esc(i.orders.order_no) + '<div class="muted" style="font-size:12px">' + NX.date(i.orders.created_at) + '</div></td><td><b>' + esc(i.title) + '</b><div class="muted" style="font-size:12.5px">' + esc(i.buyer_email || '') + '</div></td><td>' + (i.type === 'digital' ? 'Download' : 'Service') + '</td><td>' + NX.status(i.fulfilment_status) + '</td><td>' + money(i.earning_cents) + '</td><td class="actions">' + act + '</td></tr>';
      });
      return '<h1>Orders</h1><p class="sub">Downloads are delivered automatically. For services, mark work as started and deliver files or notes to the buyer.</p><div class="box">' + table(['Order', 'Item / buyer', 'Type', 'Status', 'You earn', ''], rows, 'No paid orders yet.') + '</div>';
    },
    earnings: function () {
      var rows = D.items.filter(function (i) { return i.orders && i.orders.status === 'paid'; }).map(function (i) { return '<tr><td>NX-' + esc(i.orders.order_no) + '</td><td>' + esc(i.title) + '</td><td>' + money(i.price_cents) + '</td><td>−' + money(i.commission_cents) + ' <span class="muted">(' + Math.round(i.commission_rate * 1000) / 10 + '%)</span></td><td><b>' + money(i.earning_cents) + '</b></td><td>' + NX.status(i.payout_status) + '</td><td class="muted">' + (i.payout_status === 'on_hold' ? 'Releases ' + NX.date(i.available_at) : '') + '</td></tr>'; });
      var pr = D.payouts.map(function (p) { return '<tr><td>' + NX.date(p.created_at) + '</td><td><b>' + money(p.amount_cents) + '</b></td><td>' + NX.status(p.status) + '</td><td class="muted">' + esc(p.reference) + (p.failure_reason ? ' — ' + esc(p.failure_reason) : '') + '</td></tr>'; });
      return '<h1>Earnings & payouts</h1><p class="sub">Every sale shows price, commission and your net earning. Payouts are sent automatically to your M-Pesa.</p><div class="box"><h3>Payout history</h3>' + table(['Date', 'Amount', 'Status', 'Reference'], pr, 'No payouts yet.') + '</div><div class="box"><h3>Commission ledger</h3>' + table(['Order', 'Item', 'Price', 'Commission', 'Net', 'Payout', ''], rows, 'No sales yet.') + '</div>';
    },
    payout: function () {
      var v = NX.vendor;
      return '<h1>Payout settings</h1><p class="sub">Where we send your earnings. Payouts run daily via Paystack Transfers once earnings clear the ' + D.settings.payout_hold_days + '-day protection window.</p><div class="box" style="max-width:640px">' + (v.recipient_code ? '<div class="alert ok">Payout destination saved: <b>' + esc((v.payout_method || '').toUpperCase()) + ' · ' + esc(v.payout_account || '') + '</b> (' + esc(v.payout_name || '') + ')</div>' : '<div class="alert warn">Add your payout details to start receiving money.</div>') +
        '<form id="pf"><div class="field"><label>Payout method</label><select id="pm"><option value="mpesa">M-Pesa (recommended)</option><option value="till">Till number</option><option value="paybill">Paybill</option></select></div><div class="field"><label>Account name <span class="muted" style="font-weight:400">(as registered)</span></label><input id="pn" type="text" required value="' + esc(v.payout_name || '') + '"></div><div class="field"><label id="al">M-Pesa phone number</label><input id="pa" type="text" required value="' + esc(v.payout_account || '') + '" placeholder="07xx xxx xxx"></div><div class="field hide" id="rf"><label>Paybill account reference</label><input id="pr" type="text"></div><button class="btn btn-dark">Save payout details</button></form></div>';
    },
    profile: function () {
      var v = NX.vendor;
      return '<h1>Store profile</h1><p class="sub">This is shown on your listings and storefront.</p><div class="box" style="max-width:640px"><form id="sp"><div class="field"><label>Store name</label><input id="sn" type="text" required value="' + esc(v.store_name) + '"></div><div class="field"><label>About</label><textarea id="sb" maxlength="1200">' + esc(v.bio || '') + '</textarea></div><div class="row2"><div class="field"><label>Country</label><input id="co" type="text" value="' + esc(v.country || '') + '"></div><div class="field"><label>Website</label><input id="ws" type="url" value="' + esc(v.website || '') + '"></div></div><button class="btn btn-dark">Save profile</button></form></div>';
    }
  };

  /* ---------- listing editor ---------- */
  function listingModal(l) {
    l = l || { type: 'digital', category: 'business-templates', includes: [], tags: [] };
    var cats = NX.catalog.categories, edit = !!l.id;
    var m = NX.modal('<h2>' + (edit ? 'Edit listing' : 'New listing') + '</h2><p class="muted">Listings are reviewed before going live. Editing a live listing sends it back for re-approval.</p><form id="lf">' +
      '<div class="field"><label>Title</label><input id="t" type="text" required minlength="5" maxlength="120" value="' + esc(l.title || '') + '"></div>' +
      '<div class="row2"><div class="field"><label>Category</label><select id="c">' + cats.map(function (c) { return '<option value="' + c.slug + '"' + (c.slug === l.category ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></div><div class="field"><label>Type</label><select id="ty"><option value="digital"' + (l.type === 'digital' ? ' selected' : '') + '>Digital download</option><option value="service"' + (l.type === 'service' ? ' selected' : '') + '>Service</option></select></div></div>' +
      '<div class="row2"><div class="field"><label>Price (KES)</label><input id="pr" type="number" min="50" step="1" required value="' + (l.price_cents ? l.price_cents / 100 : '') + '"></div><div class="field" id="dd"><label>Delivery time (days)</label><input id="dl" type="number" min="1" max="60" value="' + (l.delivery_days || 3) + '"></div></div>' +
      '<div class="field"><label>Short summary</label><input id="s" type="text" required minlength="10" maxlength="220" value="' + esc(l.summary || '') + '"></div>' +
      '<div class="field"><label>Full description</label><textarea id="d" maxlength="5000">' + esc(l.description || '') + '</textarea></div>' +
      '<div class="field"><label>What’s included <span class="muted" style="font-weight:400">(one per line)</span></label><textarea id="inc" style="min-height:80px">' + esc((l.includes || []).join('\n')) + '</textarea></div>' +
      '<div class="field"><label>Search tags <span class="muted" style="font-weight:400">(comma separated)</span></label><input id="tg" type="text" value="' + esc((l.tags || []).join(', ')) + '"></div>' +
      '<div class="field"><label>Cover image (JPG/PNG/WebP, max 2 MB)</label><input id="im" type="file" accept="image/jpeg,image/png,image/webp"><div class="hint">No image? A category illustration is used.</div></div>' +
      '<div class="field" id="ff"><label>Download file (max 50 MB — ZIP, PDF, XLSX…)</label><input id="fl" type="file">' + (l.file_path ? '<div class="hint">A file is already uploaded; choose another to replace it.</div>' : '') + '</div>' +
      '<div id="lmsg"></div><div class="actions"><button type="button" class="btn btn-line" id="sd">Save draft</button><button class="btn btn-primary" id="sub">Submit for approval</button></div></form>');
    var el = m.el, g = function (s) { return el.querySelector(s); };
    function toggle() { var dig = g('#ty').value === 'digital'; g('#ff').classList.toggle('hide', !dig); g('#dd').classList.toggle('hide', dig); } g('#ty').onchange = toggle; toggle();
    function save(status) {
      if (demo) return NX.toast('Preview mode — listings save once the backend is connected.');
      var f = g('#lf'); if (!f.reportValidity()) return;
      var btns = el.querySelectorAll('button'); btns.forEach(function (b) { b.disabled = true; });
      var uid = NX.user.id, img = g('#im').files[0], file = g('#fl').files[0], err = function (t) { g('#lmsg').innerHTML = '<div class="alert err">' + esc(t) + '</div>'; btns.forEach(function (b) { b.disabled = false; }); };
      if (img && img.size > 2097152) return err('Cover image must be under 2 MB.');
      if (file && file.size > 52428800) return err('Download file must be under 50 MB.');
      var rnd = function () { return Math.random().toString(36).slice(2, 10); };
      var up = function (bucket, f0, pub) { var path = uid + '/' + rnd() + '-' + f0.name.replace(/[^\w.\-]+/g, '_'); return NX.sb.storage.from(bucket).upload(path, f0, { upsert: false }).then(function (r) { if (r.error) throw r.error; return pub ? NX.sb.storage.from(bucket).getPublicUrl(path).data.publicUrl : path; }); };
      var dig = g('#ty').value === 'digital';
      Promise.all([img ? up('listing-images', img, true) : Promise.resolve(l.image_url || null), dig && file ? up('deliverables', file, false) : Promise.resolve(l.file_path || null)]).then(function (u) {
        if (status === 'pending' && dig && !u[1]) throw new Error('Upload the download file before submitting for approval.');
        var row = { title: g('#t').value.trim(), category: g('#c').value, type: g('#ty').value, price_cents: Math.round(Number(g('#pr').value) * 100), summary: g('#s').value.trim(), description: g('#d').value.trim(), includes: g('#inc').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean), tags: g('#tg').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 12), delivery_days: dig ? 0 : Number(g('#dl').value), image_url: u[0], file_path: dig ? u[1] : null, status: status };
        if (edit) return NX.sb.from('listings').update(row).eq('id', l.id);
        row.vendor_id = NX.vendor.id; row.slug = NX.slugify(row.title) + '-' + rnd().slice(0, 4); return NX.sb.from('listings').insert(row);
      }).then(function (r) { if (r.error) throw r.error; NX.toast(status === 'pending' ? 'Submitted for approval ✓' : 'Draft saved ✓'); m.close(); return reload(); }).catch(function (e) { err(e.message || 'Could not save listing.'); });
    }
    g('#sd').onclick = function () { save('draft'); }; g('#lf').onsubmit = function (e) { e.preventDefault(); save('pending'); };
  }

  function deliverModal(id) {
    var it = D.items.filter(function (x) { return x.id === id; })[0];
    var m = NX.modal('<h2>Deliver: ' + esc(it.title) + '</h2><p class="muted">Share a link to the finished files (Google Drive, Dropbox, WeTransfer…) and a short note. The buyer is notified in their account.</p><div class="field"><label>Download / file link</label><input id="u" type="url" placeholder="https://" value="' + esc(it.delivery_url || '') + '"></div><div class="field"><label>Note to buyer</label><textarea id="n">' + esc(it.delivery_note || '') + '</textarea></div><button class="btn btn-primary" id="go">Mark as delivered</button>');
    m.el.querySelector('#go').onclick = function () { setItem(id, 'delivered', m.el.querySelector('#n').value, m.el.querySelector('#u').value, m); };
  }
  function setItem(id, status, note, url, m) {
    if (demo) { NX.toast('Preview mode'); if (m) m.close(); return; }
    NX.sb.rpc('vendor_update_item', { p_item: id, p_status: status, p_note: note || null, p_url: url || null }).then(function (r) { if (r.error) return NX.toast(r.error.message); NX.toast('Order updated ✓'); if (m) m.close(); reload(); });
  }

  /* ---------- shell ---------- */
  var NAV = [['overview', '◧', 'Overview'], ['listings', '▦', 'Listings'], ['orders', '✓', 'Orders'], ['earnings', '$', 'Earnings & payouts'], ['payout', '⇄', 'Payout settings'], ['profile', '☺', 'Store profile']];
  function paint() {
    var pend = D.items.filter(function (i) { return i.type === 'service' && ['pending', 'in_progress'].indexOf(i.fulfilment_status) > -1 && i.orders && i.orders.status === 'paid'; }).length;
    root.innerHTML = (demo ? '<div class="mode-banner">Preview mode — sample vendor dashboard. Sign in with an approved vendor account once the backend is connected.</div>' : '') +
      '<div class="dash"><aside class="side"><h5>' + esc(NX.vendor.store_name) + '</h5>' + NAV.map(function (n) { return '<button data-v="' + n[0] + '" class="' + (n[0] === view ? 'on' : '') + '"><span>' + n[1] + '</span>' + n[2] + (n[0] === 'orders' && pend ? '<span class="pill">' + pend + '</span>' : '') + '</button>'; }).join('') + '<h5>Account</h5><button onclick="location.href=\'/account/\'">My purchases</button></aside><div class="main" id="main">' + views[view]() + '</div></div>';
    bind();
  }
  function bind() {
    root.querySelectorAll('[data-v]').forEach(function (b) { b.onclick = function () { view = b.getAttribute('data-v'); paint(); window.scrollTo(0, 0); }; });
    var q = function (s) { return root.querySelector(s); }, find = function (id) { return D.listings.filter(function (x) { return x.id === id; })[0]; };
    if (q('#newL')) q('#newL').onclick = function () { listingModal(); };
    root.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { listingModal(find(b.getAttribute('data-edit'))); }; });
    root.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (demo) return NX.toast('Preview mode'); if (confirm('Delete this listing?')) NX.sb.from('listings').delete().eq('id', b.getAttribute('data-del')).then(reload); }; });
    root.querySelectorAll('[data-start]').forEach(function (b) { b.onclick = function () { setItem(b.getAttribute('data-start'), 'in_progress'); }; });
    root.querySelectorAll('[data-deliver]').forEach(function (b) { b.onclick = function () { deliverModal(b.getAttribute('data-deliver')); }; });
    var pf = q('#pf'); if (pf) {
      var pm = q('#pm'); pm.value = NX.vendor.payout_method || 'mpesa';
      var sync = function () { q('#al').textContent = pm.value === 'mpesa' ? 'M-Pesa phone number' : pm.value === 'till' ? 'Till number' : 'Paybill number'; q('#rf').classList.toggle('hide', pm.value !== 'paybill'); }; pm.onchange = sync; sync();
      pf.onsubmit = function (e) { e.preventDefault(); if (demo) return NX.toast('Preview mode'); NX.api('vendor-bank', { body: { method: pm.value, name: q('#pn').value, account: q('#pa').value, reference: q('#pr').value } }).then(function () { NX.toast('Payout details saved ✓'); return reload(); }).catch(function (er) { NX.toast(er.message); }); };
    }
    var sp = q('#sp'); if (sp) sp.onsubmit = function (e) { e.preventDefault(); if (demo) return NX.toast('Preview mode'); NX.sb.from('vendors').update({ store_name: q('#sn').value.trim(), bio: q('#sb').value.trim(), country: q('#co').value.trim(), website: q('#ws').value.trim() || null }).eq('id', NX.vendor.id).then(function (r) { NX.toast(r.error ? 'Could not save' : 'Saved ✓'); reload(); }); };
  }
  function reload() {
    return Promise.all([
      NX.sb.from('vendors').select('*').eq('id', NX.vendor.id).single(),
      NX.sb.from('listings').select('*').eq('vendor_id', NX.vendor.id).order('created_at', { ascending: false }),
      NX.sb.from('order_items').select('*,orders(order_no,status,created_at)').eq('vendor_id', NX.vendor.id).order('created_at', { ascending: false }).limit(500),
      NX.sb.from('payouts').select('*').eq('vendor_id', NX.vendor.id).order('created_at', { ascending: false }).limit(100),
      NX.sb.from('settings').select('key,value')
    ]).then(function (r) {
      NX.vendor = r[0].data || NX.vendor; D.listings = r[1].data || []; D.items = r[2].data || []; D.payouts = r[3].data || [];
      (r[4].data || []).forEach(function (s) { D.settings[s.key] = Number(s.value); }); paint();
    });
  }

  NX.ready.then(function () { return NX.loadCatalog(); }).then(function () {
    if (!NX.cfg.live) { demo = true; demoData(); return paint(); }
    if (!NX.requireLogin()) return;
    if (!NX.vendor || NX.vendor.status !== 'approved') { root.innerHTML = '<div class="wrap" style="padding:60px 0"><div class="empty"><h2>Vendor dashboard</h2><p>' + (NX.vendor ? 'Your application status: <b>' + esc(NX.vendor.status) + '</b>.' : 'You don’t have a vendor account yet.') + '</p><a class="btn btn-primary" href="/account/?apply=1">' + (NX.vendor ? 'View application' : 'Apply to sell') + '</a></div></div>'; return; }
    reload();
  });
})();

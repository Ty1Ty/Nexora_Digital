/* Accounts: register / sign in / reset, customer orders & downloads, reviews, vendor application */
(function () {
  var NX = window.NX, $ = NX.$, esc = NX.esc, root = $('#acct');
  var qs = new URLSearchParams(location.search);

  function authView(startTab) {
    var tab = startTab || 'in';
    root.innerHTML = '<div class="authbox"><h1>' + (tab === 'up' ? 'Create your account' : 'Welcome back') + '</h1><p class="muted" style="margin:0">One account to buy, sell and manage downloads.</p>' +
      '<div class="tabs" role="tablist"><button data-t="in" class="' + (tab === 'in' ? 'on' : '') + '">Sign in</button><button data-t="up" class="' + (tab === 'up' ? 'on' : '') + '">Create account</button></div><div id="msg"></div>' +
      (tab === 'in'
        ? '<form id="f-in"><div class="field"><label for="e">Email</label><input id="e" type="email" required autocomplete="email"></div><div class="field"><label for="p">Password</label><input id="p" type="password" required autocomplete="current-password"></div><button class="btn btn-dark" style="width:100%">Sign in</button><p style="text-align:center;margin:14px 0 0"><a href="#" id="forgot" style="color:var(--green);font-weight:700;font-size:14px">Forgot password?</a></p></form>'
        : '<form id="f-up"><div class="field"><label for="n">Full name</label><input id="n" type="text" required autocomplete="name" minlength="2"></div><div class="field"><label for="e">Email</label><input id="e" type="email" required autocomplete="email"></div><div class="field"><label for="p">Password</label><input id="p" type="password" required minlength="8" autocomplete="new-password"><div class="hint">At least 8 characters.</div></div>' +
          '<div class="field"><label>I want to</label><label class="opt"><input type="radio" name="goal" value="buy" checked> Buy services & downloads</label><label class="opt"><input type="radio" name="goal" value="sell"' + (qs.get('mode') === 'vendor' ? ' checked' : '') + '> Sell on Nexora Digital (vendor)</label></div>' +
          '<label class="opt" style="font-weight:400"><input type="checkbox" id="agree" required> <span>I agree to the <a href="/legal/terms/" style="text-decoration:underline">Terms</a> and <a href="/legal/privacy/" style="text-decoration:underline">Privacy Policy</a></span></label><button class="btn btn-dark" style="width:100%;margin-top:14px">Create account</button></form>') + '</div>';
    var msg = function (t, k) { $('#msg').innerHTML = '<div class="alert ' + k + '">' + esc(t) + '</div>'; };
    root.querySelectorAll('.tabs button').forEach(function (b) { b.onclick = function () { authView(b.getAttribute('data-t')); }; });
    var fin = $('#f-in'), fup = $('#f-up');
    if (fin) {
      fin.onsubmit = function (e) { e.preventDefault(); NX.sb.auth.signInWithPassword({ email: $('#e').value.trim(), password: $('#p').value }).then(function (r) { if (r.error) return msg(r.error.message, 'err'); location.href = qs.get('next') || '/account/'; }); };
      $('#forgot').onclick = function (e) { e.preventDefault(); var em = $('#e').value.trim(); if (!em) return msg('Enter your email above first.', 'warn'); NX.sb.auth.resetPasswordForEmail(em, { redirectTo: location.origin + '/account/' }).then(function (r) { r.error ? msg(r.error.message, 'err') : msg('If that email exists, a reset link is on its way.', 'ok'); }); };
    }
    if (fup) fup.onsubmit = function (e) {
      e.preventDefault(); var sell = root.querySelector('input[name=goal]:checked').value === 'sell';
      NX.sb.auth.signUp({ email: $('#e').value.trim(), password: $('#p').value, options: { data: { full_name: $('#n').value.trim() }, emailRedirectTo: location.origin + '/account/' + (sell ? '?apply=1' : '') } }).then(function (r) {
        if (r.error) return msg(r.error.message, 'err');
        if (r.data.session) location.href = '/account/' + (sell ? '?apply=1' : ''); else msg('Account created! Check your email to confirm your address, then sign in' + (sell ? ' to complete your vendor application.' : '.'), 'ok');
      });
    };
  }

  function recoveryView() {
    root.innerHTML = '<div class="authbox"><h1>Set a new password</h1><div id="msg"></div><form id="f"><div class="field"><label for="p">New password</label><input id="p" type="password" minlength="8" required></div><button class="btn btn-dark" style="width:100%">Update password</button></form></div>';
    $('#f').onsubmit = function (e) { e.preventDefault(); NX.sb.auth.updateUser({ password: $('#p').value }).then(function (r) { if (r.error) $('#msg').innerHTML = '<div class="alert err">' + esc(r.error.message) + '</div>'; else location.href = '/account/'; }); };
  }

  /* ---------- dashboard ---------- */
  var DEMO_ORDERS = [
    { id: 'd1', order_no: 1042, status: 'paid', total_cents: 135000, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), order_items: [{ id: 'x1', title: 'Small Business Excel Tracker', type: 'digital', fulfilment_status: 'delivered' }, { id: 'x2', title: 'Business Plan Template', type: 'digital', fulfilment_status: 'delivered' }, { id: 'x3', title: 'SEO Website Health Check', type: 'service', fulfilment_status: 'in_progress' }] },
    { id: 'd2', order_no: 1031, status: 'paid', total_cents: 850000, created_at: new Date(Date.now() - 86400000 * 9).toISOString(), order_items: [{ id: 'x4', title: 'Business Website Starter', type: 'service', fulfilment_status: 'delivered' }] }
  ];

  function dashboard() {
    var demo = !NX.cfg.live, name = demo ? 'Jane Wanjiru' : ((NX.profile && NX.profile.full_name) || NX.user.email);
    var v = NX.vendor;
    root.innerHTML = '<div class="wrap" style="padding-top:34px;padding-bottom:70px">' + (demo ? '<div class="alert warn"><b>Preview mode.</b> You’re seeing sample data. Sign-in, orders and downloads become live once Supabase is connected.</div>' : '') +
      '<div class="head"><div><span class="eyebrow dark">My account</span><h2>Hello, ' + esc(String(name).split(' ')[0]) + ' 👋</h2></div><div class="actions">' + (v && v.status === 'approved' ? '<a class="btn btn-primary" href="/vendor/">Vendor dashboard</a>' : '') + '<button class="btn btn-line" id="out">Sign out</button></div></div>' +
      '<div class="tabs" style="max-width:520px"><button data-p="orders" class="on">Orders & downloads</button><button data-p="sell">Sell</button><button data-p="profile">Profile</button></div><div id="pane"></div></div>';
    $('#out').onclick = function () { demo ? NX.toast('Preview mode') : NX.signOut(); };
    var pane = $('#pane');
    function show(p) {
      root.querySelectorAll('.tabs button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-p') === p); });
      if (p === 'orders') ordersPane(pane, demo); else if (p === 'sell') sellPane(pane, demo); else profilePane(pane, demo);
    }
    root.querySelectorAll('.tabs button').forEach(function (b) { b.onclick = function () { show(b.getAttribute('data-p')); }; });
    show(qs.get('apply') ? 'sell' : 'orders');
  }

  function ordersPane(pane, demo) {
    pane.innerHTML = '<div class="skeleton"></div>';
    var p = demo ? Promise.resolve(DEMO_ORDERS) : NX.sb.from('orders').select('id,order_no,status,total_cents,created_at,order_items(id,title,type,listing_id,fulfilment_status,delivery_note,delivery_url)').order('created_at', { ascending: false }).then(function (r) { return r.data || []; });
    p.then(function (orders) {
      if (!orders.length) { pane.innerHTML = '<div class="empty"><h3>No orders yet</h3><p>Your purchases and downloads will appear here.</p><a class="btn btn-primary" href="/marketplace/">Browse the marketplace</a></div>'; return; }
      pane.innerHTML = orders.map(function (o) {
        return '<div class="box"><h3><span>Order NX-' + esc(o.order_no) + ' <small class="muted" style="font-weight:400">· ' + NX.date(o.created_at) + '</small></span><span>' + NX.status(o.status) + ' <b style="margin-left:8px">' + NX.kes(o.total_cents) + '</b></span></h3><div class="tablewrap"><table><tbody>' +
          o.order_items.map(function (i) {
            var act = '';
            if (o.status === 'paid') {
              if (i.type === 'digital') act += '<button class="btn btn-primary btn-sm" data-dl="' + i.id + '">⬇ Download</button>';
              if (i.type === 'service' && i.fulfilment_status === 'delivered') act += '<button class="btn btn-dark btn-sm" data-done="' + i.id + '">Confirm delivery</button>';
              act += ' <button class="btn btn-line btn-sm" data-rev="' + i.id + '" data-l="' + (i.listing_id || '') + '">Review</button>';
            }
            return '<tr><td><b>' + esc(i.title) + '</b>' + (i.delivery_note ? '<div class="muted" style="font-size:13px">Vendor note: ' + esc(i.delivery_note) + '</div>' : '') + (i.delivery_url ? '<div style="font-size:13px"><a style="color:var(--green);text-decoration:underline" href="' + esc(i.delivery_url) + '" target="_blank" rel="noopener noreferrer">Open delivered files</a></div>' : '') + '</td><td>' + (i.type === 'digital' ? 'Download' : 'Service') + '</td><td>' + NX.status(i.fulfilment_status) + '</td><td class="actions">' + act + '</td></tr>';
          }).join('') + '</tbody></table></div></div>';
      }).join('');
      pane.onclick = function (e) {
        var d = e.target.closest('[data-dl]'), c = e.target.closest('[data-done]'), r = e.target.closest('[data-rev]');
        if (demo && (d || c || r)) return NX.toast('Preview mode — live once the backend is connected.');
        if (d) { d.disabled = true; NX.api('download', { query: '?item=' + d.getAttribute('data-dl') }).then(function (x) { location.href = x.url; }).catch(function (er) { NX.toast(er.message); }).then(function () { d.disabled = false; }); }
        if (c) NX.sb.rpc('customer_complete_item', { p_item: c.getAttribute('data-done') }).then(function (x) { if (x.error) NX.toast(x.error.message); else { NX.toast('Thanks — vendor payout released.'); ordersPane(pane, demo); } });
        if (r) reviewModal(r.getAttribute('data-rev'), r.getAttribute('data-l'));
      };
    });
  }
  function reviewModal(itemId, listingId) {
    var m = NX.modal('<h2>Leave a review</h2><p class="muted">Only verified buyers can review. Be honest and helpful.</p><div class="field"><label>Rating</label><select id="rt"><option value="5">★★★★★ Excellent</option><option value="4">★★★★☆ Good</option><option value="3">★★★☆☆ Okay</option><option value="2">★★☆☆☆ Poor</option><option value="1">★☆☆☆☆ Bad</option></select></div><div class="field"><label>Comment</label><textarea id="cm" maxlength="1000"></textarea></div><button class="btn btn-dark" id="go">Submit review</button>');
    m.el.querySelector('#go').onclick = function () {
      NX.sb.from('reviews').insert({ order_item_id: itemId, listing_id: listingId, customer_id: NX.user.id, rating: Number(m.el.querySelector('#rt').value), comment: m.el.querySelector('#cm').value.trim() }).then(function (r) { if (r.error) NX.toast(r.error.code === '23505' ? 'You already reviewed this item.' : 'Could not save review.'); else { NX.toast('Review published — thank you!'); m.close(); } });
    };
  }

  function sellPane(pane, demo) {
    var v = NX.vendor;
    if (v) {
      var map = { pending: ['wait', 'Your application is under review. We usually respond within 1–2 business days.'], approved: ['ok', 'You’re an approved vendor. Create listings and manage orders from your dashboard.'], rejected: ['err', 'Your application was not approved. Contact support if you think this is a mistake.'], suspended: ['err', 'Your vendor account is suspended. Contact support.'] };
      var m = map[v.status] || map.pending;
      pane.innerHTML = '<div class="box"><h3>' + esc(v.store_name) + ' ' + NX.status(v.status) + '</h3><div class="alert ' + (m[0] === 'err' ? 'err' : m[0] === 'ok' ? 'ok' : 'warn') + '">' + m[1] + '</div>' + (v.status === 'approved' ? '<a class="btn btn-primary" href="/vendor/">Open vendor dashboard</a>' : '') + '</div>'; return;
    }
    var cats = (NX.catalog && NX.catalog.categories) || [];
    pane.innerHTML = '<div class="box" style="max-width:720px"><h3>Apply to sell on Nexora Digital</h3><p class="muted">Tell us about your store. Applications are reviewed before listings go live. Commission is deducted automatically and earnings are paid out to your M-Pesa.</p><form id="vf"><div class="row2"><div class="field"><label>Store name</label><input id="sn" type="text" required minlength="2" maxlength="80" placeholder="e.g. Savannah Sheets"></div><div class="field"><label>Main category</label><select id="sc">' + cats.map(function (c) { return '<option value="' + c.slug + '">' + esc(c.name) + '</option>'; }).join('') + '</select></div></div><div class="field"><label>About your store</label><textarea id="sb" maxlength="1200" required placeholder="What do you offer, and what’s your experience?"></textarea></div><div class="row2"><div class="field"><label>Country</label><input id="co" type="text" value="Kenya"></div><div class="field"><label>Website or portfolio (optional)</label><input id="ws" type="url" placeholder="https://"></div></div><label class="opt" style="font-weight:400"><input type="checkbox" required> <span>I agree to the <a href="/legal/vendor-agreement/" style="text-decoration:underline">Vendor Agreement</a></span></label><button class="btn btn-primary" style="margin-top:12px">Submit application</button></form></div>';
    $('#vf').onsubmit = function (e) {
      e.preventDefault(); if (demo) return NX.toast('Preview mode — applications go live with the backend.');
      var name = $('#sn').value.trim();
      NX.sb.from('vendors').insert({ user_id: NX.user.id, store_name: name, slug: NX.slugify(name) + '-' + Math.random().toString(36).slice(2, 6), bio: $('#sb').value.trim(), category: $('#sc').value, country: $('#co').value.trim(), website: $('#ws').value.trim() || null, status: 'pending' })
        .then(function (r) { if (r.error) return NX.toast('Could not submit: ' + r.error.message); NX.toast('Application submitted ✓'); NX.vendor = { store_name: name, status: 'pending' }; sellPane(pane, demo); });
    };
  }

  function profilePane(pane, demo) {
    var p = NX.profile || { full_name: 'Jane Wanjiru', phone: '', country: 'Kenya' };
    pane.innerHTML = '<div class="box" style="max-width:560px"><h3>Profile</h3><form id="pf"><div class="field"><label>Full name</label><input id="fn" type="text" value="' + esc(p.full_name || '') + '"></div><div class="field"><label>Email</label><input type="email" value="' + esc((NX.user && NX.user.email) || 'jane@example.com') + '" disabled></div><div class="row2"><div class="field"><label>Phone</label><input id="ph" type="tel" value="' + esc(p.phone || '') + '" placeholder="07xx xxx xxx"></div><div class="field"><label>Country</label><input id="cy" type="text" value="' + esc(p.country || '') + '"></div></div><button class="btn btn-dark">Save changes</button></form></div>';
    $('#pf').onsubmit = function (e) { e.preventDefault(); if (demo) return NX.toast('Preview mode'); NX.sb.from('profiles').update({ full_name: $('#fn').value.trim(), phone: $('#ph').value.trim(), country: $('#cy').value.trim() }).eq('id', NX.user.id).then(function (r) { NX.toast(r.error ? 'Could not save' : 'Profile saved ✓'); }); };
  }

  NX.ready.then(function () { return NX.loadCatalog(); }).then(function () {
    if (!NX.cfg.live) return dashboard();
    NX.sb.auth.onAuthStateChange(function (ev) { if (ev === 'PASSWORD_RECOVERY') recoveryView(); });
    if (location.hash.indexOf('type=recovery') > -1) return recoveryView();
    NX.user ? dashboard() : authView(qs.get('mode') === 'vendor' || qs.get('mode') === 'signup' ? 'up' : 'in');
  });
})();

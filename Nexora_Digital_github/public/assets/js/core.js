/* Nexora Digital — core client runtime (config, auth, cart, data, UI helpers). No build step required. */
(function () {
  'use strict';
  var NX = window.NX = { cfg: { live: false, payments: false }, user: null, profile: null, vendor: null, sb: null };
  var $ = NX.$ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = NX.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  NX.store = store;
  NX.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var esc = NX.esc;

  /* ---------- site data (categories, seeds) ---------- */
  NX.catalog = null;
  NX.loadCatalog = function () {
    if (NX.catalog) return Promise.resolve(NX.catalog);
    return fetch('/assets/data/catalog.json').then(function (r) { return r.json(); }).then(function (c) { NX.catalog = c; return c; });
  };
  NX.catName = function (slug) { var c = NX.catalog && NX.catalog.categories.filter(function (x) { return x.slug === slug; })[0]; return c ? c.name : slug; };

  /* ---------- currency (display only; charging is always KES) ---------- */
  var RATES = { KES: 1, USD: 0.0077, EUR: 0.0071, GBP: 0.0061 }, SYM = { KES: 'KSh', USD: '$', EUR: '€', GBP: '£' };
  NX.cur = store.get('nx_cur', 'KES');
  NX.money = function (cents, cur) {
    cur = cur || NX.cur; var v = (cents / 100) * (RATES[cur] || 1);
    var n = cur === 'KES' ? Math.round(v).toLocaleString('en-KE') : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (cur === 'KES' ? '' : '≈ ') + SYM[cur] + ' ' + n;
  };
  NX.kes = function (cents) { return 'KSh ' + Math.round(cents / 100).toLocaleString('en-KE'); };
  NX.refreshPrices = function () { $$('[data-cents]').forEach(function (el) { el.textContent = NX.money(Number(el.getAttribute('data-cents'))); }); };

  /* ---------- UI helpers ---------- */
  var toastT;
  NX.toast = function (msg) { var t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 3200); };
  NX.modal = function (html, onClose) {
    var bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><button class="x" aria-label="Close">×</button>' + html + '</div>';
    function close() { bg.remove(); document.removeEventListener('keydown', key); if (onClose) onClose(); }
    function key(e) { if (e.key === 'Escape') close(); }
    bg.addEventListener('click', function (e) { if (e.target === bg) close(); });
    bg.querySelector('.x').onclick = close; document.addEventListener('keydown', key); document.body.appendChild(bg);
    var f = bg.querySelector('input,select,textarea,button:not(.x)'); if (f) f.focus();
    return { el: bg, close: close };
  };
  NX.status = function (s) {
    var m = { approved: 'ok', paid: 'ok', delivered: 'ok', completed: 'ok', available: 'info', processing: 'info', in_progress: 'info', pending: 'wait', draft: 'mute', on_hold: 'wait', unpaid: 'mute', rejected: 'bad', failed: 'bad', refunded: 'bad', suspended: 'bad', void: 'bad', archived: 'mute' };
    return '<span class="st ' + (m[s] || 'mute') + '">' + esc(String(s).replace(/_/g, ' ')) + '</span>';
  };
  NX.date = function (d) { return d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; };
  NX.slugify = function (s) { return String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70); };

  /* ---------- listings: normalise + render ---------- */
  NX.norm = function (l, vendor) {
    var v = vendor || l.vendor || {};
    return {
      id: l.id, slug: l.slug, title: l.title, summary: l.summary, description: l.description || l.summary, category: l.category, type: l.type,
      price_cents: l.price_cents != null ? l.price_cents : Math.round((l.priceKes || 0) * 100),
      includes: l.includes || [], tags: l.tags || [], delivery_days: l.delivery_days != null ? l.delivery_days : (l.deliveryDays || 0),
      image: l.image_url || l.image || '', demo: !!(l.demo || l.is_demo), sales: l.sales_count || 0,
      vendor: { id: v.id || l.vendor_id, name: v.store_name || v.name || 'Vendor', slug: v.slug || '', initial: (v.store_name || v.name || 'V').charAt(0).toUpperCase() }
    };
  };
  NX.img = function (l) { return l.image || (window.NXArt ? NXArt.dataUri(l.category, l.slug) : ''); };
  NX.card = function (l) {
    var url = '/product/' + l.slug + '/';
    return '<article class="card"><a class="art" href="' + url + '" tabindex="-1" aria-hidden="true"><img src="' + esc(NX.img(l)) + '" alt="" width="640" height="400" loading="lazy"><span class="badge">' + (l.type === 'digital' ? '⬇ Instant download' : '✦ Service') + '</span>' + (l.demo ? '<span class="badge demo">Sample</span>' : '') + '</a>' +
      '<div class="body"><span class="cat-l">' + esc(NX.catName(l.category)) + '</span><h3><a href="' + url + '">' + esc(l.title) + '</a></h3><p>' + esc(l.summary) + '</p>' +
      '<div class="vendor-line"><span class="avatar">' + esc(l.vendor.initial) + '</span><span>' + esc(l.vendor.name) + '</span></div>' +
      '<div class="buy"><span class="price"><span data-cents="' + l.price_cents + '">' + NX.money(l.price_cents) + '</span><small>' + (l.type === 'digital' ? 'one-time' : l.delivery_days ? 'delivery in ' + l.delivery_days + ' days' : 'service') + '</small></span>' +
      '<button class="btn btn-dark btn-sm" data-add="' + esc(l.id) + '">Add to cart</button></div></div></article>';
  };
  // Live listings from Supabase (RLS exposes only approved) or the bundled placeholders
  NX.getListings = function () {
    return NX.ready.then(function () { return NX.loadCatalog(); }).then(function (cat) {
      if (!(NX.cfg.live && NX.sb)) return cat.listings.map(function (l) { return NX.norm(l, cat.vendors.filter(function (v) { return v.slug === l.vendor; })[0]); });
      return NX.sb.from('listings').select('id,slug,title,summary,description,category,type,price_cents,includes,tags,image_url,delivery_days,is_demo,sales_count,vendor_id').eq('status', 'approved').order('created_at', { ascending: false }).limit(300)
        .then(function (r) {
          if (r.error) throw r.error; var rows = r.data || []; var ids = rows.map(function (x) { return x.vendor_id; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
          if (!ids.length) return [];
          return NX.sb.from('public_vendors').select('id,store_name,slug').in('id', ids).then(function (vr) {
            var map = {}; (vr.data || []).forEach(function (v) { map[v.id] = v; }); return rows.map(function (x) { return NX.norm(x, map[x.vendor_id]); });
          });
        }).catch(function () { return []; });
    });
  };

  /* ---------- cart ---------- */
  NX.cart = { get: function () { return store.get('nx_cart', []); }, set: function (c) { store.set('nx_cart', c); NX.cartBadge(); },
    add: function (l) { var c = this.get(); if (c.some(function (x) { return x.id === l.id; })) { NX.toast('Already in your cart'); return; } c.push({ id: l.id, slug: l.slug, title: l.title, price_cents: l.price_cents, type: l.type, category: l.category, image: l.image || '', vendor: l.vendor.name, demo: l.demo }); this.set(c); NX.toast('Added to cart ✓'); },
    remove: function (id) { this.set(this.get().filter(function (x) { return x.id !== id; })); }, clear: function () { this.set([]); } };
  NX.cartBadge = function () { $$('.cart-count').forEach(function (e) { e.textContent = NX.cart.get().length; }); };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add]'); if (!b) return; e.preventDefault();
    NX.getListings().then(function (all) { var l = all.filter(function (x) { return String(x.id) === b.getAttribute('data-add'); })[0]; if (l) NX.cart.add(l); });
  });

  /* ---------- API helper (Netlify Functions) ---------- */
  NX.token = function () { return NX.sb ? NX.sb.auth.getSession().then(function (r) { return r.data.session ? r.data.session.access_token : ''; }) : Promise.resolve(''); };
  NX.api = function (name, opts) {
    opts = opts || {};
    return NX.token().then(function (t) {
      return fetch('/api/' + name + (opts.query || ''), { method: opts.body ? 'POST' : 'GET', headers: Object.assign({ 'content-type': 'application/json' }, t ? { authorization: 'Bearer ' + t } : {}), body: opts.body ? JSON.stringify(opts.body) : undefined });
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || 'Request failed'); e.status = r.status; throw e; } return j; }); });
  };

  /* ---------- auth ---------- */
  NX.signOut = function () { return (NX.sb ? NX.sb.auth.signOut() : Promise.resolve()).then(function () { location.href = '/'; }); };
  function loadUser() {
    if (!NX.sb) return Promise.resolve();
    return NX.sb.auth.getSession().then(function (r) {
      var s = r.data.session; NX.user = s ? s.user : null; if (!NX.user) return;
      return Promise.all([NX.sb.from('profiles').select('*').eq('id', NX.user.id).maybeSingle(), NX.sb.from('vendors').select('*').eq('user_id', NX.user.id).maybeSingle()])
        .then(function (res) { NX.profile = res[0].data; NX.vendor = res[1].data; });
    });
  }
  NX.requireLogin = function () { if (!NX.user) { location.href = '/account/?next=' + encodeURIComponent(location.pathname + location.search); return false; } return true; };

  /* ---------- boot ---------- */
  function loadScript(src) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; s.async = true; document.head.appendChild(s); }); }
  NX.ready = fetch('/api/config').then(function (r) { return r.ok ? r.json() : { live: false }; }).catch(function () { return { live: false }; })
    .then(function (cfg) {
      NX.cfg = cfg;
      if (!cfg.live) return;
      return loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js').then(function () {
        NX.sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
        return loadUser();
      }).catch(function () { NX.cfg.live = false; });
    }).then(function () { return NX; });

  /* ---------- analytics (GA4, consent-gated) ---------- */
  function startGA(id) {
    window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', id, { anonymize_ip: true });
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id); document.head.appendChild(s);
  }
  function consent(cfg) {
    if (!cfg.gaId) return; var c = store.get('nx_consent', null);
    if (c === 'granted') return startGA(cfg.gaId); if (c === 'denied') return;
    var b = document.createElement('div'); b.className = 'cookie'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Cookie consent');
    b.innerHTML = '<b>We value your privacy.</b> We use cookies for analytics to improve Nexora Digital. See our <a href="/legal/privacy/" style="text-decoration:underline">Privacy Policy</a>.<div class="actions"><button class="btn btn-dark btn-sm" id="ck-y">Accept</button><button class="btn btn-line btn-sm" id="ck-n">Decline</button></div>';
    document.body.appendChild(b);
    b.querySelector('#ck-y').onclick = function () { store.set('nx_consent', 'granted'); b.remove(); startGA(cfg.gaId); };
    b.querySelector('#ck-n').onclick = function () { store.set('nx_consent', 'denied'); b.remove(); };
  }

  /* ---------- shared chrome behaviour ---------- */
  function chrome() {
    NX.cartBadge();
    var sel = $('#curSel'); if (sel) { sel.value = NX.cur; sel.onchange = function () { NX.cur = sel.value; store.set('nx_cur', NX.cur); NX.refreshPrices(); document.dispatchEvent(new Event('nx:currency')); }; }
    NX.refreshPrices();
    var mb = $('#menuBtn'), nav = $('#mainNav'); if (mb && nav) { mb.onclick = function () { var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); }; }
    $$('form.js-search').forEach(function (f) { f.addEventListener('submit', function (e) { e.preventDefault(); var q = f.querySelector('input').value.trim(), c = f.querySelector('select'); location.href = '/marketplace/?' + (q ? 'q=' + encodeURIComponent(q) : '') + (c && c.value ? (q ? '&' : '') + 'cat=' + encodeURIComponent(c.value) : ''); }); });
    $$('form.js-newsletter').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault(); if (f.querySelector('.hp input').value) return; var email = f.querySelector('input[type=email]').value.trim();
        NX.ready.then(function () {
          if (!NX.sb) { NX.toast('Preview mode — newsletter signup activates when the backend is connected.'); return; }
          NX.sb.from('subscribers').insert({ email: email, source: location.pathname }).then(function (r) { if (r.error && r.error.code !== '23505') NX.toast('Could not subscribe. Please try again.'); else { NX.toast('You’re subscribed — thank you!'); f.reset(); } });
        });
      });
    });
    NX.ready.then(function () {
      var link = $('#acctLink'); if (link) { if (NX.user) { link.textContent = 'My account'; link.href = NX.vendor && NX.vendor.status === 'approved' ? '/vendor/' : '/account/'; } }
      if (NX.profile && NX.profile.role === 'admin') { var a = $('#adminLink'); if (a) a.classList.remove('hide'); }
      if (NX.vendor && NX.vendor.status === 'approved') { var v = $('#sellLink'); if (v) { v.textContent = 'Vendor dashboard'; v.href = '/vendor/'; } }
      if (!NX.cfg.live) { var m = $('#modeBanner'); if (m) m.classList.remove('hide'); }
      else if (NX.cfg.testMode) { var m2 = $('#modeBanner'); if (m2) { m2.textContent = 'Payments are in TEST mode — no real money is moved.'; m2.classList.remove('hide'); } }
      consent(NX.cfg);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chrome); else chrome();
})();

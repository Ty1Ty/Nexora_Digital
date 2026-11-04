/* Cart + secure checkout (Paystack: M-Pesa & cards) and the post-payment confirmation / download page */
(function () {
  var NX = window.NX, $ = NX.$, esc = NX.esc, mode = document.body.getAttribute('data-page');

  function cartPage() {
    var box = $('#cart'), sum = $('#summary');
    function draw() {
      var c = NX.cart.get();
      if (!c.length) { box.innerHTML = '<div class="empty"><h3>Your cart is empty</h3><p>Find a service or download to get started.</p><a class="btn btn-primary" href="/marketplace/">Browse the marketplace</a></div>'; sum.hidden = true; return; }
      sum.hidden = false;
      box.innerHTML = c.map(function (x) {
        return '<div class="cartrow"><img src="' + esc(x.image || (window.NXArt ? NXArt.dataUri(x.category, x.slug) : '')) + '" alt="" width="90" height="56"><div><a href="/product/' + esc(x.slug) + '/"><b>' + esc(x.title) + '</b></a><div class="muted" style="font-size:13px">' + esc(x.vendor) + ' · ' + (x.type === 'digital' ? 'Instant download' : 'Service') + (x.demo ? ' · <b style="color:var(--warn)">Sample</b>' : '') + '</div></div><div style="text-align:right"><div class="price" data-cents="' + x.price_cents + '">' + NX.money(x.price_cents) + '</div><button class="btn btn-sm btn-line" data-rm="' + esc(x.id) + '" style="margin-top:6px">Remove</button></div></div>';
      }).join('');
      var total = c.reduce(function (s, x) { return s + x.price_cents; }, 0);
      $('#subtotal').textContent = NX.kes(total); $('#total').textContent = NX.kes(total);
      var approx = $('#approx'); approx.textContent = NX.cur !== 'KES' ? 'Shown as ' + NX.money(total) + ' for reference. You are charged ' + NX.kes(total) + '.' : '';
    }
    box.addEventListener('click', function (e) { var b = e.target.closest('[data-rm]'); if (b) { NX.cart.remove(b.getAttribute('data-rm')); draw(); } });
    document.addEventListener('nx:currency', draw);
    $('#pay').addEventListener('click', function () {
      var btn = this;
      NX.ready.then(function () {
        if (!NX.cfg.live || !NX.cfg.payments) {
          NX.modal('<h2>Checkout preview</h2><p class="muted">This is a polished preview — live payments switch on automatically once Supabase and Paystack keys are added in Netlify (see README → “Go live in 15 minutes”).</p><div class="alert info">Buyers will pay with <b>M-Pesa</b> or <b>card</b> on Paystack’s secure page, then return here for instant downloads.</div><button class="btn btn-primary" onclick="this.closest(\'.modal-bg\').remove()">Got it</button>'); return;
        }
        if (!NX.requireLogin()) return;
        btn.disabled = true; btn.textContent = 'Redirecting to secure payment…';
        NX.api('checkout-init', { body: { items: NX.cart.get().map(function (x) { return x.id; }) } })
          .then(function (r) { location.href = r.url; })
          .catch(function (err) { btn.disabled = false; btn.textContent = 'Pay securely'; NX.modal('<h2>We couldn’t start your payment</h2><div class="alert err">' + esc(err.message) + '</div><p class="muted">Your cart is unchanged. If an item is no longer available, remove it and try again.</p><button class="btn btn-dark" onclick="this.closest(\'.modal-bg\').remove()">OK</button>'); });
      });
    });
    draw();
  }

  function completePage() {
    var box = $('#result'), ref = new URLSearchParams(location.search).get('reference') || new URLSearchParams(location.search).get('trxref');
    if (!ref) { box.innerHTML = '<div class="empty"><h2>No payment reference found</h2><a class="btn btn-primary" href="/account/">Go to my orders</a></div>'; return; }
    var tries = 0;
    function check() {
      NX.ready.then(function () { if (!NX.requireLogin()) return; return NX.api('verify-payment', { query: '?reference=' + encodeURIComponent(ref) }); }).then(function (r) {
        if (!r) return;
        if (r.ok) {
          NX.cart.clear();
          box.innerHTML = '<div class="alert ok"><b>Payment successful.</b> Order NX-' + esc(r.order.order_no) + ' · ' + NX.kes(r.order.total_cents) + '. A receipt is available in your account.</div><h2 style="margin:20px 0 10px">Your items</h2>' +
            r.items.map(function (i) { return '<div class="cartrow" style="grid-template-columns:1fr auto"><div><b>' + esc(i.title) + '</b><div class="muted" style="font-size:13px">' + (i.type === 'digital' ? 'Instant download' : 'Service — the vendor will contact you and deliver in your account') + '</div></div>' + (i.type === 'digital' ? '<button class="btn btn-primary btn-sm" data-dl="' + esc(i.id) + '">⬇ Download</button>' : NX.status(i.fulfilment_status)) + '</div>'; }).join('') +
            '<p style="margin-top:22px"><a class="btn btn-dark" href="/account/">View all my orders</a> <a class="btn btn-line" href="/marketplace/">Keep shopping</a></p>';
        } else if (r.pending && tries++ < 8) { box.innerHTML = '<div class="alert info">Confirming your payment with Paystack… please wait.</div><div class="skeleton"></div>'; setTimeout(check, 2500); }
        else box.innerHTML = '<div class="alert warn"><b>' + esc(r.message || 'Payment not confirmed yet') + '</b><br>If you were charged, your order will update automatically within a few minutes — check <a href="/account/" style="text-decoration:underline">My orders</a>.</div>';
      }).catch(function (e) { box.innerHTML = '<div class="alert err">' + esc(e.message) + '</div><a class="btn btn-dark" href="/account/">My orders</a>'; });
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-dl]'); if (!b) return; b.disabled = true;
      NX.api('download', { query: '?item=' + b.getAttribute('data-dl') }).then(function (r) { location.href = r.url; }).catch(function (er) { NX.toast(er.message); }).then(function () { b.disabled = false; });
    });
    check();
  }
  if (mode === 'cart') cartPage(); else if (mode === 'complete') completePage();
})();

/* Product page: hydrates prerendered pages, renders live listings that were added after the last build, loads reviews */
(function () {
  var NX = window.NX, $ = NX.$, esc = NX.esc;
  var root = $('#pd');

  function reviews(listing) {
    var box = $('#reviews'); if (!box || !NX.sb || !/^[0-9a-f-]{36}$/.test(String(listing.id))) return;
    NX.sb.from('reviews').select('rating,comment,created_at').eq('listing_id', listing.id).order('created_at', { ascending: false }).limit(20).then(function (r) {
      var rows = r.data || []; if (!rows.length) { box.innerHTML = '<p class="muted">No reviews yet. Verified buyers can review after their order.</p>'; return; }
      var avg = rows.reduce(function (s, x) { return s + x.rating; }, 0) / rows.length;
      box.innerHTML = '<p><b>' + avg.toFixed(1) + ' / 5</b> from ' + rows.length + ' verified review' + (rows.length > 1 ? 's' : '') + '</p>' + rows.map(function (x) { return '<div class="box"><b>' + '★'.repeat(x.rating) + '☆'.repeat(5 - x.rating) + '</b><p>' + esc(x.comment || '') + '</p><small class="muted">' + NX.date(x.created_at) + '</small></div>'; }).join('');
    });
  }
  function buyNow(id) {
    NX.getListings().then(function (all) { var l = all.filter(function (x) { return String(x.id) === String(id); })[0]; if (!l) return NX.toast('This item is not available.'); if (!NX.cart.get().some(function (c) { return c.id === l.id; })) NX.cart.add(l); location.href = '/checkout/'; });
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-buy]'); if (b) { e.preventDefault(); buyNow(b.getAttribute('data-buy')); } });

  // Client-rendered fallback for live listings not yet prerendered
  if (root && root.getAttribute('data-live') !== null) {
    var slug = decodeURIComponent(location.pathname.replace(/^\/product\//, '').replace(/\/$/, ''));
    NX.loadCatalog().then(function () { return NX.getListings(); }).then(function (all) {
      var l = all.filter(function (x) { return x.slug === slug; })[0];
      if (!l) { root.innerHTML = '<div class="empty"><h1>Listing not found</h1><p>This item may have been removed or is awaiting approval.</p><a class="btn btn-primary" href="/marketplace/">Browse the marketplace</a></div>'; return; }
      document.title = l.title + ' | Nexora Digital'; var md = document.querySelector('meta[name=description]'); if (md) md.content = l.summary;
      root.innerHTML = '<div><div class="hero-img"><img src="' + esc(NX.img(l)) + '" alt="' + esc(l.title) + '" width="1280" height="800"></div>' +
        '<h2 style="margin:30px 0 10px">About this ' + (l.type === 'digital' ? 'download' : 'service') + '</h2><div class="prose">' + String(l.description).split(/\n+/).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>' +
        (l.includes.length ? '<h2 style="margin:30px 0 10px">What’s included</h2><ul class="includes">' + l.includes.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' : '') +
        '<h2 style="margin:30px 0 10px">Reviews</h2><div id="reviews"></div></div>' +
        '<aside class="buybox"><span class="badge" style="background:var(--greenbg);color:var(--green)">' + (l.type === 'digital' ? '⬇ Instant download' : '✦ Service') + '</span><h1 style="font-size:26px;margin:12px 0">' + esc(l.title) + '</h1><p class="muted">' + esc(l.summary) + '</p>' +
        '<div class="big" data-cents="' + l.price_cents + '">' + NX.money(l.price_cents) + '</div><button class="btn btn-primary" data-buy="' + esc(l.id) + '">Buy now</button><button class="btn btn-line" data-add="' + esc(l.id) + '">Add to cart</button>' +
        '<div class="vendor-line" style="margin-top:18px"><span class="avatar">' + esc(l.vendor.initial) + '</span><span>Sold by <b>' + esc(l.vendor.name) + '</b></span></div></aside>';
      reviews(l);
    });
  } else {
    var id = root && root.getAttribute('data-id'); if (id) NX.ready.then(function () { reviews({ id: id }); });
  }
})();

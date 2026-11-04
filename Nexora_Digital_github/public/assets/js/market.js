/* Marketplace browse: search, category/type/price filters, sorting — state mirrored in the URL for shareable, indexable views */
(function () {
  var NX = window.NX, $ = NX.$, $$ = NX.$$;
  var grid = $('#grid'), count = $('#count'), empty = $('#empty');
  var p = new URLSearchParams(location.search);
  var st = { q: p.get('q') || '', cats: (p.get('cat') || '').split(',').filter(Boolean), type: p.get('type') || '', max: Number(p.get('max') || 0), sort: p.get('sort') || 'new' };
  var all = [];

  function sync() {
    $('#q').value = st.q; $('#sort').value = st.sort; $('#max').value = String(st.max);
    $$('input[name=cat]').forEach(function (i) { i.checked = st.cats.indexOf(i.value) > -1; });
    $$('input[name=type]').forEach(function (i) { i.checked = i.value === st.type; });
  }
  function url() {
    var q = new URLSearchParams();
    if (st.q) q.set('q', st.q); if (st.cats.length) q.set('cat', st.cats.join(',')); if (st.type) q.set('type', st.type); if (st.max) q.set('max', st.max); if (st.sort !== 'new') q.set('sort', st.sort);
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
  }
  function render() {
    var q = st.q.toLowerCase().trim();
    var rows = all.filter(function (l) {
      if (st.cats.length && st.cats.indexOf(l.category) < 0) return false;
      if (st.type && l.type !== st.type) return false;
      if (st.max && l.price_cents > st.max * 100) return false;
      if (q && (l.title + ' ' + l.summary + ' ' + l.tags.join(' ') + ' ' + NX.catName(l.category) + ' ' + l.vendor.name).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    rows.sort(function (a, b) { return st.sort === 'low' ? a.price_cents - b.price_cents : st.sort === 'high' ? b.price_cents - a.price_cents : st.sort === 'popular' ? b.sales - a.sales : 0; });
    count.textContent = rows.length + (rows.length === 1 ? ' result' : ' results');
    grid.innerHTML = rows.map(NX.card).join(''); empty.hidden = rows.length > 0; url();
  }
  function bind() {
    $('#q').addEventListener('input', function (e) { st.q = e.target.value; render(); });
    $('#sort').addEventListener('change', function (e) { st.sort = e.target.value; render(); });
    $('#max').addEventListener('change', function (e) { st.max = Number(e.target.value); render(); });
    $$('input[name=cat]').forEach(function (i) { i.addEventListener('change', function () { st.cats = $$('input[name=cat]:checked').map(function (x) { return x.value; }); render(); }); });
    $$('input[name=type]').forEach(function (i) { i.addEventListener('click', function () { st.type = (st.type === i.value) ? '' : i.value; sync(); render(); }); });
    $('#reset').addEventListener('click', function () { st = { q: '', cats: [], type: '', max: 0, sort: 'new' }; sync(); render(); });
    document.addEventListener('nx:currency', function () { NX.refreshPrices(); });
  }
  NX.loadCatalog().then(function () { return NX.getListings(); }).then(function (rows) {
    all = rows; sync(); bind(); render();
    if (!rows.length) { empty.hidden = false; empty.innerHTML = '<h3>The marketplace is opening soon</h3><p>No listings are published yet. Be one of the first vendors on Nexora Digital.</p><a class="btn btn-primary" href="/sell/">Become a vendor</a>'; }
  });
})();

/* Home: swap the prerendered featured grid for live marketplace listings when the backend is connected */
(function () {
  var NX = window.NX, grid = NX.$('#featured');
  NX.ready.then(function () {
    if (!NX.cfg.live) return;
    return NX.getListings().then(function (rows) {
      if (rows.length) { grid.innerHTML = rows.slice(0, 8).map(NX.card).join(''); NX.refreshPrices(); }
      else grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><h3>The marketplace is opening soon</h3><p>Be one of the first vendors on Nexora Digital.</p><a class="btn btn-primary" href="/sell/">Become a vendor</a></div>';
    });
  });
})();

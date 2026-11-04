/* Nexora Digital — placeholder artwork generator (works in Node and the browser).
   Produces category-relevant SVG illustrations so every listing looks polished
   before real vendor images are uploaded. */
(function (root) {
  var PAL = {
    web:      ['#0f2a2a', '#1f7a63', '#9debc0'],
    seo:      ['#1b1740', '#5b45c2', '#c9bdff'],
    design:   ['#3a1d12', '#c4683a', '#ffd9bd'],
    business: ['#10233a', '#2f6fb0', '#bfe0ff'],
    data:     ['#0e2b36', '#1a8aa6', '#aaf0ff'],
    writing:  ['#2d1b2e', '#a8466f', '#ffc7de'],
    video:    ['#1a1a2e', '#c23b5b', '#ffc2cf'],
    courses:  ['#1f2a14', '#6a9a2e', '#e3f7b5']
  };
  var MAP = {
    'web-development': 'web', 'seo-marketing': 'seo', 'design-branding': 'design',
    'business-templates': 'business', 'data-spreadsheets': 'data',
    'writing-translation': 'writing', 'video-audio': 'video', 'courses-ebooks': 'courses'
  };
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }
  function r(n, w) { return Math.round(n * w) / w; }

  function scene(kind, a, c, h) {
    var s = h % 5, o = (h % 7) * 4, out = '';
    if (kind === 'web') {
      out += '<rect x="150" y="70" width="340" height="230" rx="14" fill="#fff" opacity=".96"/><rect x="150" y="70" width="340" height="34" rx="14" fill="#e6efeb"/><circle cx="172" cy="87" r="5" fill="#ff8a7a"/><circle cx="190" cy="87" r="5" fill="#ffd27a"/><circle cx="208" cy="87" r="5" fill="#7adfa6"/>';
      out += '<rect x="174" y="126" width="' + (120 + o * 2) + '" height="14" rx="7" fill="' + a + '"/><rect x="174" y="152" width="200" height="8" rx="4" fill="#cfdcd6"/><rect x="174" y="168" width="170" height="8" rx="4" fill="#dfe8e4"/><rect x="174" y="200" width="96" height="30" rx="8" fill="' + c + '"/>';
      out += '<rect x="330" y="196" width="136" height="84" rx="10" fill="' + a + '" opacity=".18"/><path d="M345 270 L380 230 L410 255 L440 215 L456 270Z" fill="' + a + '" opacity=".55"/>';
    } else if (kind === 'seo') {
      out += '<g fill="none" stroke="' + c + '" stroke-width="10" stroke-linecap="round"><circle cx="290" cy="170" r="62"/><path d="M336 218 L392 274"/></g>';
      out += '<g fill="' + c + '"><rect x="262" y="176" width="14" height="30" rx="3"/><rect x="284" y="150" width="14" height="56" rx="3"/><rect x="306" y="132" width="14" height="74" rx="3"/></g>';
      out += '<path d="M410 120 L450 90 L482 112 L530 62" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/><path d="M510 62 H530 V82" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>';
    } else if (kind === 'design') {
      var cols = [c, '#fff', a, '#ffb88f', '#7a3b1f'];
      for (var i = 0; i < 5; i++) out += '<circle cx="' + (200 + i * 62) + '" cy="' + (150 + ((i + s) % 2) * 40) + '" r="' + (36 - i * 2) + '" fill="' + cols[i] + '" opacity=".92"/>';
      out += '<path d="M180 290 C 260 230, 340 340, 470 250" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" opacity=".9"/><rect x="450" y="82" width="56" height="56" rx="12" fill="none" stroke="' + c + '" stroke-width="6" transform="rotate(' + (10 + s * 6) + ' 478 110)"/>';
    } else if (kind === 'business') {
      out += '<rect x="190" y="64" width="250" height="262" rx="12" fill="#fff" opacity=".96"/><rect x="214" y="92" width="120" height="14" rx="7" fill="' + a + '"/>';
      for (var j = 0; j < 5; j++) out += '<rect x="214" y="' + (130 + j * 34) + '" width="18" height="18" rx="4" fill="' + (j < 3 ? c : '#d5e2ee') + '" stroke="' + a + '" stroke-width="2"/><rect x="244" y="' + (134 + j * 34) + '" width="' + (110 + ((j * 37 + o) % 70)) + '" height="9" rx="4" fill="#d5e2ee"/>';
      out += '<rect x="400" y="150" width="120" height="86" rx="10" fill="' + c + '" opacity=".92" transform="rotate(8 460 193)"/><path d="M420 214 L442 190 L458 204 L492 170" stroke="' + a + '" stroke-width="6" fill="none" stroke-linecap="round" transform="rotate(8 460 193)"/>';
    } else if (kind === 'data') {
      out += '<rect x="140" y="70" width="360" height="236" rx="14" fill="#fff" opacity=".96"/>';
      var hs = [60, 98, 74, 124, 96, 150];
      for (var k = 0; k < 6; k++) out += '<rect x="' + (170 + k * 50) + '" y="' + (270 - hs[(k + s) % 6]) + '" width="30" height="' + hs[(k + s) % 6] + '" rx="6" fill="' + (k % 2 ? c : a) + '"/>';
      out += '<path d="M170 168 L240 140 L310 160 L380 112 L470 96" stroke="#e8745a" stroke-width="5" fill="none" stroke-linecap="round"/><g fill="#e8745a"><circle cx="240" cy="140" r="6"/><circle cx="380" cy="112" r="6"/><circle cx="470" cy="96" r="6"/></g>';
    } else if (kind === 'writing') {
      out += '<rect x="190" y="66" width="230" height="270" rx="12" fill="#fff" opacity=".96" transform="rotate(-4 305 200)"/>';
      for (var m = 0; m < 7; m++) out += '<rect x="216" y="' + (104 + m * 28) + '" width="' + (m === 0 ? 120 : 150 + ((m * 31 + o) % 40)) + '" height="' + (m === 0 ? 14 : 8) + '" rx="4" fill="' + (m === 0 ? a : '#e6d4de') + '" transform="rotate(-4 305 200)"/>';
      out += '<path d="M440 120 L520 250 L488 258 L462 214 L432 232Z" fill="' + c + '"/><path d="M440 120 L420 112 L428 140Z" fill="#fff"/>';
    } else if (kind === 'video') {
      out += '<rect x="150" y="84" width="340" height="212" rx="16" fill="#fff" opacity=".95"/><path d="M290 150 L360 190 L290 230Z" fill="' + a + '"/>';
      out += '<rect x="170" y="262" width="300" height="8" rx="4" fill="#e4d0d6"/><rect x="170" y="262" width="' + (110 + o * 3) + '" height="8" rx="4" fill="' + a + '"/>';
      for (var n = 0; n < 14; n++) out += '<rect x="' + (170 + n * 22) + '" y="' + (112 - ((n * 13 + o * 3) % 26)) + '" width="8" height="' + (14 + ((n * 13 + o * 3) % 26) * 2) + '" rx="4" fill="' + c + '" opacity=".9"/>';
    } else { // courses
      out += '<path d="M320 110 C 270 84, 210 84, 170 100 V 290 C 210 274, 270 274, 320 300Z" fill="#fff" opacity=".96"/><path d="M320 110 C 370 84, 430 84, 470 100 V 290 C 430 274, 370 274, 320 300Z" fill="' + c + '" opacity=".96"/>';
      for (var q = 0; q < 4; q++) out += '<rect x="198" y="' + (130 + q * 30) + '" width="' + (80 + ((q * 23 + o) % 20)) + '" height="8" rx="4" fill="' + a + '" opacity=".35"/>';
      out += '<circle cx="410" cy="170" r="30" fill="' + a + '"/><path d="M396 172 L406 183 L426 158" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    return out;
  }

  function svg(category, seed, w, hgt) {
    var kind = MAP[category] || category || 'web';
    var p = PAL[kind] || PAL.web, h = hash(seed || category || 'x');
    var gid = 'g' + h.toString(36);
    var out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="' + (w || 640) + '" height="' + (hgt || 400) + '" role="img" aria-hidden="true">';
    out += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p[0] + '"/><stop offset="1" stop-color="' + p[1] + '"/></linearGradient></defs>';
    out += '<rect width="640" height="400" fill="url(#' + gid + ')"/>';
    out += '<circle cx="' + (60 + (h % 80)) + '" cy="' + (50 + (h % 60)) + '" r="' + (90 + (h % 40)) + '" fill="' + p[2] + '" opacity=".10"/>';
    out += '<circle cx="' + (560 - (h % 70)) + '" cy="' + (340 - (h % 50)) + '" r="' + (110 + (h % 30)) + '" fill="' + p[2] + '" opacity=".08"/>';
    out += scene(kind, p[1], p[2], h);
    return out + '</svg>';
  }
  function dataUri(category, seed) { return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg(category, seed)); }

  var api = { svg: svg, dataUri: dataUri, palette: PAL, map: MAP };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.NXArt = api;
})(typeof self !== 'undefined' ? self : this);

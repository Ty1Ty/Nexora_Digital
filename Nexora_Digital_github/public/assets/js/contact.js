/* Contact form → Supabase `messages` table (admin inbox). Falls back to a pre-filled email in preview mode. */
(function () {
  var NX = window.NX, $ = NX.$, f = $('#cf');
  f.addEventListener('submit', function (e) {
    e.preventDefault(); if ($('#hp').value) return;
    var d = { name: $('#cn').value.trim(), email: $('#ce').value.trim(), subject: $('#cs').value.trim(), body: $('#cm').value.trim() };
    if (!d.name || !/^\S+@\S+\.\S+$/.test(d.email) || d.body.length < 5) return $('#cmsg').innerHTML = '<div class="alert err">Please fill in your name, a valid email and a message.</div>';
    NX.ready.then(function () {
      if (!NX.sb) { location.href = 'mailto:tyronejohn001@gmail.com?subject=' + encodeURIComponent(d.subject || 'Nexora Digital enquiry') + '&body=' + encodeURIComponent(d.body + '\n\n— ' + d.name + ' (' + d.email + ')'); return; }
      NX.sb.from('messages').insert(d).then(function (r) { $('#cmsg').innerHTML = r.error ? '<div class="alert err">Could not send. Please email us directly.</div>' : '<div class="alert ok">Thanks — we’ll reply within one business day.</div>'; if (!r.error) f.reset(); });
    });
  });
})();

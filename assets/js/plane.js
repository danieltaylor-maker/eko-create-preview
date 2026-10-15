// Contact section paper plane (Claude, 15 Oct 2026).
// The flight path is built in pixels around wherever the form sits, so the plane always lands beside it.
// As the section scrolls into view the trail draws itself and the plane flies along it, stopping at the end.
// With reduced motion it simply sits at the end. Hidden on phones by CSS.
(function () {
  var svg = document.querySelector('.contact-plane');
  if (!svg) return;
  var section = svg.closest('section');
  var trail = svg.querySelector('.contact-plane-trail');
  var ship = svg.querySelector('.contact-plane-ship');
  var form = section.querySelector('form');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var len = 0, last = -1, scale = .72;

  function build() {
    var s = section.getBoundingClientRect(), f = form.getBoundingClientRect();
    var w = s.width, h = s.height;
    if (!w || !h || !f.width) return;
    var x1 = f.left - s.left, y1 = f.top - s.top, x2 = f.right - s.left, fh = f.height, fw = f.width;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    var room = w - x2, wide = room > 230, ex, ey, tail;
    var lx = Math.min(x1 * 0.42, 420), ly = h * 0.74;
    if (wide) {
      // Room beside the form: exit its right edge and climb to rest in the space on the right.
      ex = x2 + Math.min(room * 0.62, 300); ey = y1 + 10;
      tail = ['C', x1 + fw * .45, y1 + fh * .42, x2 - fw * .2, y1 + fh * .32, x2, y1 + fh * .3,
              'C', x2 + (ex - x2) * .45, y1 + fh * .26, ex - 80, ey + 110, ex, ey];
    } else {
      // Narrow screens: rise out of the top of the form and rest just above its top-right corner.
      ex = x2 - 24; ey = Math.max(56, y1 - 44);
      tail = ['C', x1 + fw * .35, y1 + fh * .45, x1 + fw * .5, y1 + fh * .2, x1 + fw * .62, y1 + 4,
              'C', x1 + fw * .7, ey + 12, ex - 120, ey + 22, ex, ey];
    }
    scale = wide ? .72 : .58;
    trail.setAttribute('d', [
      'M', -30, h * .86,
      'C', lx * .35, h * .97, lx * .8, h * .95, lx + 20, ly + 38,
      'C', lx + 55, ly - 12, lx + 32, ly - 62, lx - 4, ly - 56,
      'C', lx - 42, ly - 50, lx - 40, ly + 20, lx + 24, ly + 42,
      'C', lx + 160, ly + 92, x1 - 220, y1 + fh * .78, x1, y1 + fh * .62
    ].concat(tail).join(' '));
    len = trail.getTotalLength();
    trail.style.strokeDasharray = len;
    last = -1;
  }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function place(p) {
    if (!len || Math.abs(p - last) < 0.0005) return; last = p;
    var at = Math.max(0.002, p) * len;
    var pt = trail.getPointAtLength(at), back = trail.getPointAtLength(Math.max(0, at - 6));
    var ang = Math.atan2(pt.y - back.y, pt.x - back.x) * 180 / Math.PI;
    trail.style.strokeDashoffset = len - at;
    ship.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ') scale(' + scale + ')');
    ship.style.opacity = p > 0.02 ? 1 : 0;
  }
  function progress() {
    var r = section.getBoundingClientRect(), vh = window.innerHeight;
    return Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.95)));
  }
  var queued = false;
  function tick() { queued = false; place(reduce ? 1 : ease(progress())); }
  function onScroll() { if (!queued) { queued = true; requestAnimationFrame(tick); } }
  function rebuild() { build(); tick(); }
  rebuild();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', rebuild);
  window.addEventListener('load', rebuild);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
})();

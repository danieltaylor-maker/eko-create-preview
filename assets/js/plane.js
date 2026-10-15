// Contact section paper plane (Claude, 15 Oct 2026; scroll timing revised the same day from Dan's reference-matched files).
// Flight path: unchanged from the supplied version, built in pixels around wherever the form sits.
// Desktop only (981px and wider). At 980px or below the plane and trail are hidden by CSS and this script does no work.
// Timing comes only from the contact section's own position in the viewport, so content added above it changes nothing.
// The flight starts as the trail's start comes into view and lands at the upper-right endpoint while it is still on screen.
// The trail draws behind the plane and both reverse smoothly when scrolling back up.
// Reduced motion: the finished trail and the plane resting at the endpoint, with no movement.
(function () {
  var svg = document.querySelector('.contact-plane');
  if (!svg) return;
  var section = svg.closest('section');
  var trail = svg.querySelector('.contact-plane-trail');
  var ship = svg.querySelector('.contact-plane-ship');
  var form = section.querySelector('form');
  var desktopMq = matchMedia('(min-width: 981px)');
  var reduceMq = matchMedia('(prefers-reduced-motion: reduce)');
  var len = 0, last = -1, scale = .72, startY = 0, endY = 0;
  var cur = 0, target = 0, raf = 0, prevT = 0, on = false, near = false;
  var io = null, ro = null;

  function build() {
    var s = section.getBoundingClientRect(), f = form.getBoundingClientRect();
    var w = s.width, h = s.height;
    if (!w || !h || !f.width) { len = 0; return; }
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
      // Less room: rise out of the top of the form and rest just above its top-right corner.
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
    startY = h * .8;   // flight begins as the start of the trail reaches the bottom of the screen
    endY = ey;         // and lands while the endpoint is still clear of the header, ~12% down the screen
    last = -1;
  }

  // Scroll position -> 0..1, measured from the section's own box only.
  function progress() {
    var top = section.getBoundingClientRect().top, vh = window.innerHeight;
    var t0 = vh - startY, t1 = Math.max(vh * .12, 100) - endY;
    if (t0 <= t1) return top <= t1 ? 1 : 0;
    return Math.min(1, Math.max(0, (t0 - top) / (t0 - t1)));
  }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function place(p) {
    if (!len || Math.abs(p - last) < 0.0003) return; last = p;
    var at = Math.max(0.002, p) * len;
    var pt = trail.getPointAtLength(at), back = trail.getPointAtLength(Math.max(0, at - 6));
    var ang = Math.atan2(pt.y - back.y, pt.x - back.x) * 180 / Math.PI;
    trail.style.strokeDashoffset = len - at;
    ship.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ') scale(' + scale + ')');
    ship.style.opacity = p > 0.02 ? 1 : 0;
  }

  // Follows the scroll with a light glide so wheel steps and reversals stay smooth.
  function frame(now) {
    raf = 0;
    var dt = prevT ? Math.min(64, now - prevT) : 16; prevT = now;
    var k = 1 - Math.exp(-dt / 70);
    cur += (target - cur) * k;
    if (Math.abs(target - cur) < 0.0008) cur = target;
    place(ease(cur));
    if (cur !== target) raf = requestAnimationFrame(frame); else prevT = 0;
  }
  function onScroll() {
    target = progress();
    if (!raf && target !== cur) raf = requestAnimationFrame(frame);
  }
  function snap() { if (raf) { cancelAnimationFrame(raf); raf = 0; } prevT = 0; target = cur = progress(); place(ease(cur)); }

  function attachScroll() { if (!near) { near = true; window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); } }
  function detachScroll() { if (near) { near = false; window.removeEventListener('scroll', onScroll); snap(); } }

  function refresh() {
    if (!on) return;
    build();
    if (reduceMq.matches) { last = -1; place(1); return; }
    snap();
  }

  function start() {
    if (on) return; on = true;
    window.addEventListener('resize', refresh);
    if ('ResizeObserver' in window) { ro = new ResizeObserver(refresh); ro.observe(section); ro.observe(form); }
    refresh();
    if (!reduceMq.matches) {
      if ('IntersectionObserver' in window) {
        io = new IntersectionObserver(function (es) { es[0].isIntersecting ? attachScroll() : detachScroll(); }, { rootMargin: '25% 0px' });
        io.observe(section);
      } else attachScroll();
    }
  }
  function stop() {
    if (!on) return; on = false;
    window.removeEventListener('resize', refresh);
    if (ro) { ro.disconnect(); ro = null; }
    if (io) { io.disconnect(); io = null; }
    if (near) { near = false; window.removeEventListener('scroll', onScroll); }
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  function sync() { stop(); if (desktopMq.matches) start(); }

  function listen(mq) { if (mq.addEventListener) mq.addEventListener('change', sync); else if (mq.addListener) mq.addListener(sync); }
  listen(desktopMq); listen(reduceMq);
  sync();
  window.addEventListener('load', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
})();

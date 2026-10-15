// Contact section paper plane (Claude, 15 Oct 2026).
// As the section scrolls into view, the white trail draws itself and the plane flies along it,
// stopping at the end of the line beside the form. With reduced motion it simply sits at the end.
(function () {
  var svg = document.querySelector('.contact-plane');
  if (!svg) return;
  var trail = svg.querySelector('.contact-plane-trail');
  var ship = svg.querySelector('.contact-plane-ship');
  var section = svg.closest('section');
  var len = trail.getTotalLength();
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  trail.style.strokeDasharray = len;

  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function place(p) {
    var at = Math.max(0.001, p) * len;
    var pt = trail.getPointAtLength(at);
    var back = trail.getPointAtLength(Math.max(0, at - 4));
    var ang = Math.atan2(pt.y - back.y, pt.x - back.x) * 180 / Math.PI;
    trail.style.strokeDashoffset = len - at;
    ship.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ') scale(.78)');
    ship.style.opacity = p > 0.02 ? 1 : 0;
  }
  if (reduce) { place(1); return; }

  var ticking = false;
  function update() {
    ticking = false;
    var r = section.getBoundingClientRect();
    var vh = window.innerHeight;
    // 0 when the section's top reaches the bottom of the screen, 1 once it is ~70% of the way up the screen.
    var p = (vh - r.top) / (vh * 0.95);
    place(ease(Math.min(1, Math.max(0, p))));
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

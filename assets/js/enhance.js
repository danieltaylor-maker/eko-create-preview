// Eko enhancement layer — added by Claude, 6 October 2026.
// Process section: an editing-timeline playhead that follows the scroll position.
// Without this file the process steps simply show at full strength.
(function () {
  var row = document.querySelector('.process-row');
  if (!row) return;

  var steps = Array.prototype.slice.call(row.querySelectorAll('.process-step'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var wide = window.matchMedia('(min-width: 681px)');
  var FPS = 25;                 // UK frame rate for the timecode read-out
  var SECONDS = steps.length;   // one second of "timeline" per step

  var head = document.createElement('span');
  head.className = 'process-playhead';
  head.setAttribute('aria-hidden', 'true');
  head.innerHTML = '<i></i><b>00:00:00:00</b>';
  var timecode = head.querySelector('b');

  var active = false;
  var queued = false;

  function two(n) { return (n < 10 ? '0' : '') + n; }

  function paint() {
    queued = false;
    if (!active) return;
    var box = row.getBoundingClientRect();
    var start = window.innerHeight * 0.86;   // playhead starts as the row enters
    var end = window.innerHeight * 0.42;     // and finishes before mid-screen
    var p = (start - box.top) / (start - end);
    p = Math.max(0, Math.min(1, p));
    var x = p * row.offsetWidth;   // playhead position inside the row, in layout pixels

    row.style.setProperty('--p', p.toFixed(4));
    head.classList.toggle('flip', p > 0.82);

    // offsetLeft/offsetWidth ignore the reveal transforms, so the maths stays steady mid-animation
    steps.forEach(function (step) {
      var left = step.offsetLeft;
      var fill = Math.max(0, Math.min(1, (x - left) / step.offsetWidth));
      step.style.setProperty('--fill', fill.toFixed(4));
      step.classList.toggle('is-lit', x >= left);
    });

    var frames = Math.round(p * SECONDS * FPS);
    timecode.textContent = '00:00:' + two(Math.floor(frames / FPS)) + ':' + two(frames % FPS);
  }

  function queue() {
    if (!queued) { queued = true; window.requestAnimationFrame(paint); }
  }

  function sync() {
    var on = wide.matches && !reduce.matches;
    if (on === active) { queue(); return; }
    active = on;
    row.classList.toggle('has-playhead', on);
    if (on) {
      row.appendChild(head);
      paint();
    } else {
      if (head.parentNode) head.parentNode.removeChild(head);
      row.style.removeProperty('--p');
      steps.forEach(function (step) {
        step.classList.remove('is-lit');
        step.style.removeProperty('--fill');
      });
    }
  }

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });
  if (wide.addEventListener) {
    wide.addEventListener('change', sync);
    reduce.addEventListener('change', sync);
  }
  sync();
})();

// Section photograph (02 / Meet Eko): gentle parallax — added by Claude, 7 October 2026.
// The photo moves at 16% of the scroll speed, the same rate main.js uses for the hero.
// Like the hero, it is off on phones (680px and under) and with reduced motion. Without this file the photo sits still.
(function () {
  var photos = Array.prototype.slice.call(document.querySelectorAll('.sec-photo'));
  if (!photos.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var RATE = 0.16;
  var queued = false;

  function paint() {
    queued = false;
    var enabled = !reduce.matches && window.innerWidth > 680;
    var vh = window.innerHeight;
    photos.forEach(function (img) {
      if (!enabled) { img.style.removeProperty('--py'); return; }
      var section = img.parentNode;
      var box = section.getBoundingClientRect();
      if (box.bottom < -200 || box.top > vh + 200) return;        // nowhere near the screen
      var spare = (img.offsetHeight - section.offsetHeight) / 2;   // spare picture above and below (set in icons.css)
      var fromCentre = vh / 2 - (box.top + box.height / 2);        // 0 when the section is mid-screen
      var y = Math.max(-spare, Math.min(spare, fromCentre * RATE));
      img.style.setProperty('--py', y.toFixed(1) + 'px');
    });
  }

  function queue() {
    if (!queued) { queued = true; window.requestAnimationFrame(paint); }
  }

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });
  if (reduce.addEventListener) reduce.addEventListener('change', queue);
  paint();
})();


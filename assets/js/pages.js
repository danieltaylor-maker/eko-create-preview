// Service pages (Claude, 8 Oct 2026): header background on scroll, mobile menu, click-to-play Vimeo.
(function () {
  var header = document.querySelector('.site-header');
  var onScroll = function () { if (header) header.classList.toggle('scrolled', window.scrollY > 30); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var navToggle = document.querySelector('.nav-toggle');
  var mobileNav = document.querySelector('.mobile-nav');
  if (navToggle && mobileNav) {
    var setOpen = function (open) {
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      mobileNav.inert = !open;
      navToggle.classList.toggle('is-open', open);
      mobileNav.classList.toggle('is-open', open);
      mobileNav.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('no-scroll', open);
    };
    navToggle.addEventListener('click', function () { setOpen(navToggle.getAttribute('aria-expanded') !== 'true'); });
    mobileNav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  }

  document.querySelectorAll('.svc-player[data-vimeo]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var f = document.createElement('iframe');
      f.src = 'https://player.vimeo.com/video/' + link.dataset.vimeo + '?h=' + link.dataset.h + '&autoplay=1&title=0&byline=0&portrait=0&dnt=1';
      f.allow = 'autoplay; fullscreen; picture-in-picture';
      f.allowFullscreen = true;
      f.title = link.getAttribute('aria-label').replace(/^Play /, '');
      var box = document.createElement('div');
      box.className = 'svc-player';
      box.appendChild(f);
      link.replaceWith(box);
    });
  });
  // Photography gallery (Claude, 11 Oct 2026). Photos live in assets/data/photography.json and are
  // added, changed and removed in Pages CMS. If the list is empty the placeholder tiles stay.
  var grid = document.querySelector('.svc-gallery-grid[data-photos]');
  if (grid && window.fetch) {
    fetch(grid.dataset.photos, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var photos = (data && data.photos || []).filter(function (p) { return p && p.image; });
        if (!photos.length) return;
        var figs = photos.map(function (p, i) {
          var fig = document.createElement('figure');
          fig.className = 'svc-photo';
          var img = document.createElement('img');
          img.src = p.image;
          img.alt = p.alt || 'Photography by Eko Create';
          img.loading = 'lazy';
          img.decoding = 'async';
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'svc-photo-open';
          btn.setAttribute('aria-label', 'View photo ' + (i + 1) + ' of ' + photos.length + ' full screen');
          btn.addEventListener('click', function () { openViewer(i, btn); });
          btn.appendChild(img);
          fig.appendChild(btn);
          return fig;
        });
        // Full-screen viewer: arrows, swipe, Escape to close (Claude, 11 Oct 2026)
        var box, boxImg, boxCount, current = 0, opener = null, touchX = null;
        function show(i) {
          current = (i + photos.length) % photos.length;
          boxImg.src = photos[current].image;
          boxImg.alt = photos[current].alt || 'Photography by Eko Create';
          boxCount.textContent = (current + 1) + ' / ' + photos.length;
        }
        function closeViewer() {
          box.hidden = true;
          document.body.classList.remove('no-scroll');
          document.removeEventListener('keydown', onKey);
          if (opener) opener.focus();
        }
        function onKey(e) {
          if (e.key === 'Escape') closeViewer();
          else if (e.key === 'ArrowRight') show(current + 1);
          else if (e.key === 'ArrowLeft') show(current - 1);
          else if (e.key === 'Tab') {
            var f = box.querySelectorAll('button:not([hidden])');
            var first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
          }
        }
        function openViewer(i, from) {
          if (!box) {
            box = document.createElement('div');
            box.className = 'svc-viewer';
            box.setAttribute('role', 'dialog');
            box.setAttribute('aria-modal', 'true');
            box.setAttribute('aria-label', 'Photo viewer');
            box.innerHTML = '<button type="button" class="svc-viewer-close" aria-label="Close">&times;</button>' +
              '<button type="button" class="svc-viewer-prev" aria-label="Previous photo">&#8249;</button>' +
              '<img class="svc-viewer-img" alt="">' +
              '<button type="button" class="svc-viewer-next" aria-label="Next photo">&#8250;</button>' +
              '<p class="svc-viewer-count" aria-live="polite"></p>';
            document.body.appendChild(box);
            boxImg = box.querySelector('.svc-viewer-img');
            boxCount = box.querySelector('.svc-viewer-count');
            box.querySelector('.svc-viewer-close').addEventListener('click', closeViewer);
            box.querySelector('.svc-viewer-prev').addEventListener('click', function () { show(current - 1); });
            box.querySelector('.svc-viewer-next').addEventListener('click', function () { show(current + 1); });
            box.addEventListener('click', function (e) { if (e.target === box) closeViewer(); });
            box.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
            box.addEventListener('touchend', function (e) {
              if (touchX === null) return;
              var dx = e.changedTouches[0].clientX - touchX;
              touchX = null;
              if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
            });
            if (photos.length < 2) {
              box.querySelector('.svc-viewer-prev').hidden = true;
              box.querySelector('.svc-viewer-next').hidden = true;
            }
          }
          opener = from;
          show(i);
          box.hidden = false;
          document.body.classList.add('no-scroll');
          document.addEventListener('keydown', onKey);
          box.querySelector('.svc-viewer-close').focus();
        }
        // Deal photos into columns so the order in Pages CMS reads left to right, top to bottom.
        grid.classList.add('svc-gallery-grid--photos');
        var cols = 0;
        var layout = function () {
          var n = window.innerWidth <= 680 ? 1 : window.innerWidth <= 980 ? 2 : 3;
          if (n === cols) return;
          cols = n;
          grid.textContent = '';
          var colEls = [];
          for (var i = 0; i < n; i++) {
            var c = document.createElement('div');
            c.className = 'svc-photo-col';
            grid.appendChild(c);
            colEls.push(c);
          }
          figs.forEach(function (f, i) { colEls[i % n].appendChild(f); });
        };
        layout();
        window.addEventListener('resize', layout);
      })
      .catch(function () {});
  }
})();

// "How we work" steps: the same editing-timeline playhead as the homepage (Claude, 11 Oct 2026).
// Desktop and tablet only, and off with reduced motion. Without this the steps show at full strength.
(function () {
  var row = document.querySelector('.svc-step-list');
  if (!row) return;
  var steps = Array.prototype.slice.call(row.children);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var wide = window.matchMedia('(min-width: 681px)');
  var FPS = 25, SECONDS = steps.length;
  var head = document.createElement('span');
  head.className = 'process-playhead';
  head.setAttribute('aria-hidden', 'true');
  head.innerHTML = '<i></i><b>00:00:00:00</b>';
  var timecode = head.querySelector('b');
  var active = false, queued = false;
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function paint() {
    queued = false;
    if (!active) return;
    var box = row.getBoundingClientRect();
    var start = window.innerHeight * 0.86, end = window.innerHeight * 0.42;
    var p = Math.max(0, Math.min(1, (start - box.top) / (start - end)));
    var x = p * row.offsetWidth;
    row.style.setProperty('--p', p.toFixed(4));
    head.classList.toggle('flip', p > 0.82);
    steps.forEach(function (step) {
      var left = step.offsetLeft - row.offsetLeft;
      var fill = Math.max(0, Math.min(1, (x - left) / step.offsetWidth));
      step.style.setProperty('--fill', fill.toFixed(4));
      step.classList.toggle('is-lit', x >= left);
    });
    var frames = Math.round(p * SECONDS * FPS);
    timecode.textContent = '00:00:' + two(Math.floor(frames / FPS)) + ':' + two(frames % FPS);
  }
  function queue() { if (!queued) { queued = true; window.requestAnimationFrame(paint); } }
  function sync() {
    var on = wide.matches && !reduce.matches;
    if (on === active) { queue(); return; }
    active = on;
    row.classList.toggle('has-playhead', on);
    if (on) { row.appendChild(head); paint(); }
    else {
      if (head.parentNode) head.parentNode.removeChild(head);
      row.style.removeProperty('--p');
      steps.forEach(function (step) { step.classList.remove('is-lit'); step.style.removeProperty('--fill'); });
    }
  }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });
  if (wide.addEventListener) { wide.addEventListener('change', sync); reduce.addEventListener('change', sync); }
  sync();
})();

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
        var visible = photos.map(function (p, i) { return i; });
        var webpOf = function (src, ext) { return /\.(jpe?g|png)$/i.test(src) ? src.replace(/([^\/]+)\.(jpe?g|png)$/i, 'web/$1' + ext) : src; };
        var figs = photos.map(function (p, i) {
          var fig = document.createElement('figure');
          fig.className = 'svc-photo';
          var img = document.createElement('img');
          // Optimised WebP copies sit in a web/ folder beside each upload (name.w800.webp for the grid, name.webp full size).
          // A brand-new CMS upload without them simply falls back to the original file.
          img.src = webpOf(p.image, '.w800.webp');
          img.onerror = function () { img.onerror = null; img.src = p.image; };
          img.alt = p.alt || 'Photography by eko create';
          img.loading = 'lazy';
          img.decoding = 'async';
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'svc-photo-open';
          btn.setAttribute('aria-label', 'View photo full screen: ' + img.alt);
          btn.addEventListener('click', function () { openViewer(visible.indexOf(i), btn); });
          btn.appendChild(img);
          fig.appendChild(btn);
          return fig;
        });
        // Full-screen viewer: arrows, swipe, Escape to close. It steps through the photos in the current filter.
        var box, boxImg, boxCount, current = 0, opener = null, touchX = null, closeTimer = null;
        // Movement (Claude, 13 Oct 2026): the photo grows out of its thumbnail on open, slides between photos,
        // and shrinks back on close. All of it is skipped with reduced motion.
        var still = window.matchMedia('(prefers-reduced-motion: reduce)');
        var ease = 'cubic-bezier(.2,.7,.2,1)';
        var ready = function (img) { return img.decode ? img.decode().catch(function () {}) : Promise.resolve(); };
        function fromThumb(img, thumb, reverse) {
          if (still.matches || !img.animate || !thumb) return null;
          var a = thumb.getBoundingClientRect(), b = img.getBoundingClientRect();
          if (!a.width || !b.width || a.bottom < 0 || a.top > window.innerHeight) return null;
          var t = 'translate(' + (a.left + a.width / 2 - b.left - b.width / 2) + 'px,' + (a.top + a.height / 2 - b.top - b.height / 2) + 'px) scale(' + (a.width / b.width) + ')';
          var k = [{ transform: t, opacity: .6 }, { transform: 'none', opacity: 1 }];
          return img.animate(reverse ? k.reverse() : k, { duration: reverse ? 320 : 460, easing: ease, fill: 'both' });
        }
        function show(i, dir) {
          current = (i + visible.length) % visible.length;
          var p = photos[visible[current]];
          boxImg.onerror = function () { boxImg.onerror = null; boxImg.src = p.image; };
          boxImg.src = webpOf(p.image, '.webp');
          boxImg.alt = p.alt || 'Photography by eko create';
          boxCount.textContent = (current + 1) + ' / ' + visible.length;
          if (dir && !still.matches && boxImg.animate) {
            ready(boxImg).then(function () {
              boxImg.animate([{ opacity: 0, transform: 'translateX(' + (dir * 48) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: ease });
            });
          }
        }
        function closeViewer() {
          document.removeEventListener('keydown', onKey);
          var thumb = figs[visible[current]] && figs[visible[current]].querySelector('img');
          var anim = fromThumb(boxImg, thumb, true);
          box.classList.remove('is-open');
          var done = function () {
            box.hidden = true;
            if (anim) anim.cancel();
            document.body.classList.remove('no-scroll');
            if (opener) opener.focus({ preventScroll: true });
          };
          clearTimeout(closeTimer);
          closeTimer = setTimeout(done, still.matches ? 0 : 320);
        }
        function onKey(e) {
          if (e.key === 'Escape') closeViewer();
          else if (e.key === 'ArrowRight') show(current + 1, 1);
          else if (e.key === 'ArrowLeft') show(current - 1, -1);
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
            box.querySelector('.svc-viewer-prev').addEventListener('click', function () { show(current - 1, -1); });
            box.querySelector('.svc-viewer-next').addEventListener('click', function () { show(current + 1, 1); });
            box.addEventListener('click', function (e) { if (e.target === box) closeViewer(); });
            box.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
            box.addEventListener('touchend', function (e) {
              if (touchX === null) return;
              var dx = e.changedTouches[0].clientX - touchX;
              touchX = null;
              if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
            });
          }
          var single = visible.length < 2;
          box.querySelector('.svc-viewer-prev').hidden = single;
          box.querySelector('.svc-viewer-next').hidden = single;
          opener = from;
          clearTimeout(closeTimer);
          show(i);
          box.hidden = false;
          void box.offsetWidth;
          box.classList.add('is-open');
          document.body.classList.add('no-scroll');
          document.addEventListener('keydown', onKey);
          box.querySelector('.svc-viewer-close').focus({ preventScroll: true });
          var thumb = from && from.querySelector('img');
          if (!still.matches && boxImg.animate) {
            boxImg.style.opacity = '0';
            ready(boxImg).then(function () { boxImg.style.opacity = ''; fromThumb(boxImg, thumb, false); });
          }
        }
        // Deal photos into columns so the order in Pages CMS reads left to right, top to bottom.
        grid.classList.add('svc-gallery-grid--photos');
        // Lead image: the first photo in the current view runs full width above the columns (Claude, 13 Oct 2026).
        var leadWrap = document.createElement('div');
        leadWrap.className = 'svc-photo-lead';
        grid.parentNode.insertBefore(leadWrap, grid);
        // "View more work" button, as on the homepage (Claude, 13 Oct 2026):
        // the lead plus five rows of three show first, then fifteen more per click.
        var FIRST = 16, MORE = 15, shown = FIRST;
        var moreWrap = document.createElement('div');
        moreWrap.className = 'portfolio-actions svc-photo-actions';
        var moreBtn = document.createElement('button');
        moreBtn.type = 'button';
        moreBtn.className = 'btn btn-ghost svc-photo-more';
        moreWrap.appendChild(moreBtn);
        grid.parentNode.insertBefore(moreWrap, grid.nextSibling);
        moreBtn.addEventListener('click', function () {
          shown += MORE;
          figs.forEach(function (f) { f.classList.add('in-view'); });
          layout(true);
        });
        var cols = 0;
        var layout = function (force) {
          var n = window.innerWidth <= 680 ? 1 : window.innerWidth <= 980 ? 2 : 3;
          if (n === cols && !force) return;
          cols = n;
          grid.textContent = '';
          leadWrap.textContent = '';
          figs.forEach(function (f) { f.classList.remove('svc-photo--lead'); });
          var rest = visible.slice();
          if (rest.length > 3) {
            var lead = rest.shift();
            figs[lead].classList.add('svc-photo--lead');
            var li = figs[lead].querySelector('img');
            if (!li.dataset.full) {
              li.dataset.full = '1';
              li.onerror = function () { li.onerror = null; li.src = photos[lead].image; };
              li.src = webpOf(photos[lead].image, '.webp');
            }
            leadWrap.appendChild(figs[lead]);
          }
          var colEls = [];
          for (var i = 0; i < n; i++) {
            var c = document.createElement('div');
            c.className = 'svc-photo-col';
            grid.appendChild(c);
            colEls.push(c);
          }
          var left = visible.length - shown;
          rest = rest.slice(0, Math.max(0, shown - (visible.length - rest.length)));
          rest.forEach(function (idx, i) { colEls[i % n].appendChild(figs[idx]); });
          moreWrap.hidden = left <= 0;
          moreBtn.textContent = 'View more work (' + Math.max(0, left) + ')';
        };
        layout();
        window.addEventListener('resize', function () { layout(); });

        // Category filter buttons, like the homepage portfolio (Claude, 13 Oct 2026).
        // Categories come from each photo's "category" in Pages CMS; with fewer than two in use, no buttons show.
        var ICONS = { All: 'i-grid', Studio: 'i-photo', Workplace: 'i-team', Events: 'i-award', Portraits: 'i-team' };
        var cats = [];
        photos.forEach(function (p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });
        if (cats.length > 1) {
          var bar = document.createElement('div');
          bar.className = 'filters svc-photo-filters';
          bar.setAttribute('role', 'group');
          bar.setAttribute('aria-label', 'Filter photography');
          ['All'].concat(cats).forEach(function (cat) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'filter' + (cat === 'All' ? ' active' : '');
            b.setAttribute('aria-pressed', cat === 'All' ? 'true' : 'false');
            b.innerHTML = '<svg class="ico f-ico" aria-hidden="true" focusable="false"><use href="#' + (ICONS[cat] || 'i-photo') + '"/></svg><span></span>';
            b.querySelector('span').textContent = cat;
            b.addEventListener('click', function () {
              bar.querySelectorAll('.filter').forEach(function (x) { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
              visible = photos.map(function (p, i) { return i; }).filter(function (i) { return cat === 'All' || photos[i].category === cat; });
              shown = FIRST;
              figs.forEach(function (f) { f.classList.add('in-view'); });
              layout(true);
            });
            bar.appendChild(b);
          });
          grid.parentNode.insertBefore(bar, leadWrap);
        }
        if (window.ekoRevealPhotos) window.ekoRevealPhotos(figs);
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

// Entrance and scroll-reveal animation, matching the homepage (Claude, 11 Oct 2026).
// Uses the homepage's own .motion-ready / .in-view styles from hybrid.css. Nothing is hidden without JavaScript,
// and everything shows straight away for people who have turned off motion.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  var STAGGER = 110;

  function prep(el) { el.classList.add('motion-ready'); }
  function show(el, delay) { setTimeout(function () { el.classList.add('in-view'); }, delay || 0); }

  // 1. Hero: header drops in, then the hero content rises line by line, as on the homepage.
  var header = document.querySelector('.site-header');
  var heroBits = Array.prototype.slice.call(document.querySelectorAll('.svc-hero .container > *'));
  if (header) { header.setAttribute('data-animate', 'fade-down'); header.style.transitionDelay = '0ms'; setTimeout(function () { header.classList.add('in-view'); }, 120); }
  heroBits.forEach(function (el, i) { prep(el); show(el, 180 + i * STAGGER); });

  // 2. Groups that reveal one item after another when they scroll into view.
  var groups = [
    '.svc-make-list', '.svc-step-list', '.svc-film-grid', '.svc-other-list',
    '.svc-links-grid', '.svc-story-grid', '.svc-who-grid', '.svc-client-grid'
  ];
  // 3. Single blocks that rise into view.
  var singles = [
    '.svc-kicker', 'main h2', '.svc-clients-copy', '.svc-cta .container > *', '.svc-more-work'
  ];
  // About page: finer, line-by-line reveal through the cream sections (Claude, 14 Oct 2026).
  // Label, heading, intro and paragraphs arrive one after another; photos and the illustration follow; the faint 2007 stays put.
  if (document.body.classList.contains('about-page')) {
    groups = groups.filter(function (g) { return g !== '.svc-story-grid' && g !== '.svc-who-grid'; })
      .concat(['.svc-story-grid > div:first-child', '.svc-story-copy', '.svc-story-photos', '.svc-who-grid > div']);
    singles = singles.concat(['.svc-story-illustration']);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      io.unobserve(el);
      if (el.__group) el.__group.forEach(function (child, i) { show(child, i * STAGGER); });
      else show(el, 0);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });

  function inHero(el) { return !!el.closest('.svc-hero'); }

  groups.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (group) {
      var kids = Array.prototype.slice.call(group.children).filter(function (c) { return c.className !== 'process-playhead'; });
      kids.forEach(prep);
      group.__group = kids;
      io.observe(group);
    });
  });
  singles.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (inHero(el) || el.classList.contains('motion-ready') || el.classList.contains('svc-visually-hidden') || el.closest(groups.join(','))) return;
      prep(el); io.observe(el);
    });
  });

  // Gallery photos are added after the page loads, so reveal them as they arrive.
  window.ekoRevealPhotos = function (figs) {
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        pio.unobserve(entry.target);
        show(entry.target, (entry.target.__i % 3) * STAGGER);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    figs.forEach(function (f, i) { f.__i = i; prep(f); pio.observe(f); });
  };

  // 4. Hero photo: gentle parallax at 16% of scroll speed, like the homepage hero. Off on phones.
  var bg = document.querySelector('.svc-hero-bg');
  if (bg) {
    var queued = false;
    var paint = function () {
      queued = false;
      var hero = bg.parentNode, box = hero.getBoundingClientRect();
      var y = window.innerWidth > 680 ? Math.min(box.height, Math.max(0, -box.top)) * 0.16 : 0;
      bg.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    };
    window.addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(paint); } }, { passive: true });
    paint();
  }
})();

// About page photos: the picture drifts gently inside its rounded frame as you scroll, like the homepage (Claude, 14 Oct 2026).
// Desktop and tablet only; off with reduced motion, where the photos sit still.
(function () {
  var frames = Array.prototype.slice.call(document.querySelectorAll('.svc-story-ph, .svc-who-photo')).filter(function (f) { return f.querySelector('img'); });
  if (!frames.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)'), wide = window.matchMedia('(min-width: 681px)');
  var ticking = false;
  function update() {
    ticking = false;
    var on = wide.matches && !reduce.matches, vh = window.innerHeight;
    frames.forEach(function (f) {
      f.classList.toggle('svc-plx', on);
      if (!on) return;
      var r = f.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh;          // -1 (above) .. 1 (below)
      f.style.setProperty('--plx', (Math.max(-1, Math.min(1, p)) * -28).toFixed(1) + 'px');
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

// Page headlines build in line by line, like the homepage hero (Claude, 15 Oct 2026).
// Words are wrapped, grouped into the lines the browser actually draws, and each line rises and fades in after the one above.
(function () {
  var h = document.querySelector('h1.h1-build');
  if (!h || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  function wrap(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var parts = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
        parts.forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
          var s = document.createElement('span'); s.className = 'lw'; s.textContent = t;
          var m = document.createElement('span'); m.className = 'lwm'; m.appendChild(s); frag.appendChild(m);  // mask for the rise (motion.css)
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1) wrap(n);
    });
  }
  wrap(h);
  var words = h.querySelectorAll('.lw'), line = -1, lastTop = null;
  Array.prototype.forEach.call(words, function (w) {
    var t = w.offsetTop;
    if (lastTop === null || Math.abs(t - lastTop) > 4) { line++; lastTop = t; }
    w.style.setProperty('--d', (line * 0.16) + 's');
  });
  h.classList.add('lb-ready');
  requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add('lb-in'); }); });
})();

// About page: top of the framed print lines up with the top of the first paragraph, on desktop (Claude, 15 Oct 2026).
(function () {
  var fig = document.querySelector('.svc-story-illustration--photo');
  var deck = document.querySelector('.svc-story-copy .svc-deck');
  if (!fig || !deck) return;
  var mq = window.matchMedia('(min-width: 981px)');
  function align() {
    if (!mq.matches) { fig.style.marginTop = ''; return; }
    // Layout positions (offsetTop) so the build-in animations don't throw the measurement off.
    function top(el) { var t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; }
    var col = deck.closest('.svc-story-grid > div');
    var d = col ? top(deck) - top(col) : 0;  // the figure starts level with the top of the text column
    fig.style.marginTop = Math.max(0, Math.round(d)) + 'px';
  }
  align();
  window.addEventListener('resize', align);
  window.addEventListener('load', align);
  // Re-align whenever the text column changes height (web font swap, headline build-in)
  if ('ResizeObserver' in window) { var col = deck.closest('.svc-story-grid > div'); if (col) new ResizeObserver(align).observe(col); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(align);
})();

// eko create motion layer (Claude, 16 Oct 2026). Works with assets/css/motion.css on every page.
// 1. Services panel in the top navigation (desktop) and the phone menu stagger.
// 2. Section headings rise word by word out of a mask, a line at a time.
// 3. Photos and video are revealed through a mask as they come into view.
// 4. Scroll-linked depth (desktop only, using GSAP ScrollTrigger): the hero eases away, the showreel opens up,
//    and the orange bands widen to full width as they arrive.
// 5. A single sheen across the main call-to-action buttons when they first appear.
// Nothing is hidden unless this file runs, and with reduced motion everything shows straight away.
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var still = reduce.matches;
  if (!still) doc.classList.add('mx');

  function all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // Mark the current page in the Services panel, the phone menu and the main links.
  var here = location.pathname.replace(/index\.html$/, '');
  all('.nav-svc, .mobile-sub a, .main-nav > a, .mobile-nav > a').forEach(function (a) {
    if (a.pathname && a.pathname !== '/' && a.pathname === here && !a.hash) a.setAttribute('aria-current', 'page');
  });

  // ---------- 1. Services panel ----------
  (function () {
    var drop = document.querySelector('.nav-drop');
    if (!drop) return;
    var top = drop.querySelector('.nav-drop-top');
    var panel = drop.querySelector('.nav-drop-panel');
    var header = document.querySelector('.site-header');
    var wide = window.matchMedia('(min-width: 981px)');
    var hover = window.matchMedia('(hover: hover) and (pointer: fine)');
    var timer = null, openedAt = 0, lastPointer = 'mouse', hush = false;
    all('.nav-svc', panel).forEach(function (a, i) { a.style.setProperty('--i', i); });

    function isOpen() { return drop.classList.contains('is-open'); }
    function open() {
      clearTimeout(timer);
      if (!wide.matches || isOpen()) return;
      drop.classList.add('is-open');
      if (header) header.classList.add('nav-open');
      top.setAttribute('aria-expanded', 'true');
      openedAt = window.scrollY;
    }
    function close(now) {
      clearTimeout(timer);
      var shut = function () {
        drop.classList.remove('is-open');
        if (header) header.classList.remove('nav-open');
        top.setAttribute('aria-expanded', 'false');
      };
      if (now) shut(); else timer = setTimeout(shut, 220);
    }

    drop.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse' || !hover.matches) return;
      clearTimeout(timer);
      timer = setTimeout(open, isOpen() ? 0 : 70);   // a short pause so passing over Services doesn't open it
    });
    drop.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') close(false); });
    top.addEventListener('pointerdown', function (e) { lastPointer = e.pointerType; });
    // Touch screens wide enough for the desktop menu: first tap opens the panel, a second tap follows the link.
    top.addEventListener('click', function (e) {
      if (lastPointer !== 'mouse' && wide.matches && !isOpen()) { e.preventDefault(); open(); }
    });
    // Keyboard: the panel opens when Services or a service link has focus, and closes when focus moves on.
    drop.addEventListener('focusin', function () { if (!hush && (top.matches(':focus-visible') || panel.contains(document.activeElement))) open(); });
    drop.addEventListener('focusout', function (e) { if (!drop.contains(e.relatedTarget)) { hush = false; close(true); } });
    // Arrow down on Services opens the panel and moves to the first service.
    top.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' && wide.matches) { e.preventDefault(); hush = false; open(); var f = panel.querySelector('a'); if (f) f.focus({ preventScroll: true }); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) { hush = true; close(true); top.focus({ preventScroll: true }); }
    });
    document.addEventListener('pointerdown', function (e) { if (isOpen() && !drop.contains(e.target)) close(true); });
    all('a', panel).forEach(function (a) { a.addEventListener('click', function () { close(true); }); });
    window.addEventListener('scroll', function () { if (isOpen() && Math.abs(window.scrollY - openedAt) > 80) close(false); }, { passive: true });
    var onWide = function () { if (!wide.matches) close(true); };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
  })();

  // Phone menu: each item arrives a moment after the one above.
  all('.mobile-nav > *').forEach(function (el, i) { el.style.setProperty('--i', i); });

  if (still) return;

  // ---------- 2. Headings: words rise out of a mask ----------
  function splitWords(el) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            var m = document.createElement('span'); m.className = 'mx-w';
            var w = document.createElement('span'); w.className = 'mx-wi'; w.textContent = t;
            m.appendChild(w); frag.appendChild(m);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR' && n.tagName !== 'SVG' && !n.classList.contains('mx-w')) walk(n);
      });
    })(el);
  }
  function lineDelays(el, step) {
    var line = -1, last = null;
    all('.mx-w', el).forEach(function (w) {
      var t = w.offsetTop;
      if (last === null || Math.abs(t - last) > 4) { line++; last = t; }
      w.firstChild.style.setProperty('--d', (line * step).toFixed(2) + 's');
    });
  }
  var headings = all('main h2, .svc-cta h2').filter(function (h) {
    if (h.closest('.home-links, .svc-links, form, .svc-visually-hidden') || h.classList.contains('svc-visually-hidden')) return false;
    return parseFloat(getComputedStyle(h).fontSize) >= 26;
  });
  headings.forEach(function (h) { splitWords(h); h.classList.add('mx-split'); lineDelays(h, 0.09); });

  // Homepage hero headline: give each line an inner layer that rises out of the line's mask.
  all('.hero h1.hero-title > span').forEach(function (line) {
    var inner = document.createElement('i');
    inner.className = 'mx-hl';
    while (line.firstChild) inner.appendChild(line.firstChild);
    line.appendChild(inner);
  });

  // ---------- 3. Photos and video ----------
  var MEDIA = '.svc-player, .svc-story-ph, .svc-who-photo, .svc-story-illustration, .portfolio-video-thumb, .svc-photo';
  var seen = typeof WeakSet === 'function' ? new WeakSet() : null;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      io.unobserve(el);
      reveal(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });

  function reveal(el) {
    if (el.__mx) { el.__mx.forEach(revealMedia); el.__mx = null; return; }
    if (el.classList.contains('mx-split') || el.classList.contains('mx-sheen')) { el.classList.add('is-in'); return; }
    revealMedia(el);
  }
  function revealMedia(el) {
    // Stagger items that arrive together in the same row.
    var sibs = el.parentNode ? Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains('mx-media'); }) : [];
    var cols = Math.max(1, Math.round((el.parentNode && el.parentNode.offsetWidth || 1) / Math.max(1, el.offsetWidth)));
    var idx = sibs.indexOf(el);
    el.style.setProperty('--md', ((idx > 0 ? idx % cols : 0) * 0.09).toFixed(2) + 's');
    el.classList.add('is-in');
    // Once the reveal has finished, hand the element back to its normal hover styles.
    setTimeout(function () { el.classList.remove('mx-media', 'is-in'); el.style.removeProperty('--md'); }, 2200);
  }
  function addMedia(el) {
    var target = el.matches('.portfolio-video-card') ? el.querySelector('.portfolio-video-thumb') : el;
    if (!target || (seen && seen.has(target))) return;
    if (seen) seen.add(target);
    target.classList.add('mx-media');
    // A fully masked element has no visible area, so watch its parent and reveal the media inside it.
    var host = target.parentElement || target;
    if (!host.__mx) { host.__mx = []; io.observe(host); }
    host.__mx.push(target);
  }
  all(MEDIA).forEach(addMedia);
  headings.forEach(function (h) { io.observe(h); });

  // Work cards on the homepage and photos on the Photography page arrive after the page loads.
  if ('MutationObserver' in window) {
    all('#portfolioGrid, .svc-gallery-grid, .svc-photo-lead').forEach(function (root) {
      new MutationObserver(function (list) {
        list.forEach(function (m) {
          Array.prototype.forEach.call(m.addedNodes, function (n) {
            if (n.nodeType !== 1) return;
            if (n.matches(MEDIA + ', .portfolio-video-card')) addMedia(n);
            all(MEDIA, n).forEach(addMedia);
          });
        });
      }).observe(root, { childList: true, subtree: true });
    });
  }

  // ---------- 5. Call-to-action sheen ----------
  all('.svc-cta .btn, .hero-actions .btn-primary, .svc-actions .btn-primary, .contact-form .btn').forEach(function (b) {
    b.classList.add('mx-sheen');
    io.observe(b);
  });

  // Re-space the heading lines if the window is resized.
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { headings.forEach(function (h) { lineDelays(h, 0.09); }); }, 200); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { headings.forEach(function (h) { lineDelays(h, 0.09); }); });

  // ---------- 4. Scroll-linked depth (desktop) ----------
  var gsap = window.gsap, ST = window.ScrollTrigger;
  if (!gsap || !ST) return;
  gsap.registerPlugin(ST);
  var mm = gsap.matchMedia();
  mm.add('(min-width: 981px) and (prefers-reduced-motion: no-preference)', function () {
    // Hero: the headline and buttons ease upwards and soften as the next section takes over.
    all('.hero .hero-content, .svc-hero > .container').forEach(function (el) {
      gsap.to(el, { yPercent: -14, opacity: 0.2, ease: 'none',
        scrollTrigger: { trigger: el.closest('section'), start: 'top top', end: 'bottom top', scrub: true } });
    });
    // Showreel: the frame opens up to full size as it rises into view.
    all('.reel-frame').forEach(function (el) {
      gsap.fromTo(el, { scale: 0.86, borderRadius: 36 }, { scale: 1, borderRadius: 8, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'center 58%', scrub: 0.6 } });
    });
    // Orange bands: arrive as a rounded panel and widen to full width.
    all('.blue-statement, .contact, .svc-cta').forEach(function (el) {
      gsap.fromTo(el, { clipPath: 'inset(0% 4% 0% 4% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 35%', scrub: 0.6 } });
    });
  });
  // The portfolio and gallery change the page height after they load; keep the scroll positions right.
  window.addEventListener('load', function () { ST.refresh(); });
  setTimeout(function () { ST.refresh(); }, 2500);
})();

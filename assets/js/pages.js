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
        var figs = photos.map(function (p) {
          var fig = document.createElement('figure');
          fig.className = 'svc-photo';
          var img = document.createElement('img');
          img.src = p.image;
          img.alt = p.alt || p.caption || '';
          img.loading = 'lazy';
          img.decoding = 'async';
          fig.appendChild(img);
          var text = [p.client, p.caption].filter(Boolean).join(' – ');
          if (text) {
            var cap = document.createElement('figcaption');
            cap.textContent = text;
            fig.appendChild(cap);
          }
          return fig;
        });
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

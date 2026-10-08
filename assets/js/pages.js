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
})();

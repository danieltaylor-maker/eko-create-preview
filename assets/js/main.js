const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const observe = (selector, options = {}) => {
  const items = document.querySelectorAll(selector);
  if (!items.length) return;

  if (prefersReducedMotion) {
    items.forEach(item => item.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px', ...options });

  items.forEach((item, index) => {
    const delay = item.dataset.delay || (index % 8) * 70;
    item.style.transitionDelay = `${delay}ms`;
    observer.observe(item);
  });
};

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-animate]').forEach((el, i) => {
    const delay = el.dataset.delay || i * 90;
    el.style.transitionDelay = `${delay}ms`;
    setTimeout(() => el.classList.add('in-view'), 120);
  });

  observe('.reveal-section');
  observe('.reveal-card');
  observe('.reveal-logo');

  const header = document.querySelector('.site-header');
  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  initMobileNav();
  initReel();
  initPortfolio();
  initModal();
});

function initMobileNav() {
  const navToggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  if (!navToggle || !mobileNav) return;

  const closeNav = () => {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.classList.remove('is-open');
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  };

  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    navToggle.classList.toggle('is-open', !isOpen);
    mobileNav.classList.toggle('is-open', !isOpen);
    mobileNav.setAttribute('aria-hidden', String(isOpen));
    document.body.classList.toggle('no-scroll', !isOpen);
  });

  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeNav();
  });
}

function initReel() {
  const reel = document.querySelector('#reel');
  if (!reel) return;

  const reelObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        reel.classList.add('in-view');
        reelObserver.disconnect();
      }
    });
  }, { threshold: 0.15 });

  reelObserver.observe(reel);

  document.querySelectorAll('[data-reel-trigger]').forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(() => reel.classList.add('in-view'), 220);
    });
  });
}

const portfolioItems = [
  {
    title: 'Eko Showreel Highlights',
    client: 'Eko Create',
    category: 'video',
    description: 'A selected highlights reel for the Eko Create website.',
    vimeo: '1190711638'
  },
  {
    title: 'Website Portfolio Video 02',
    client: 'Eko Create',
    category: 'video',
    description: 'Approved portfolio video for the Eko Create website.',
    vimeo: '1190711615'
  },
  {
    title: 'Website Portfolio Video 03',
    client: 'Eko Create',
    category: 'motion',
    description: 'Approved motion-led portfolio video for the Eko Create website.',
    vimeo: '1190711606'
  },
  {
    title: 'Website Portfolio Video 04',
    client: 'Eko Create',
    category: 'social',
    description: 'Approved social and campaign portfolio video for the Eko Create website.',
    vimeo: '1190711570'
  }
];

function vimeoEmbed(id) {
  return `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0&badge=0&autopause=0`;
}

function initPortfolio() {
  const grid = document.getElementById('portfolioGrid');
  if (!grid) return;

  grid.innerHTML = portfolioItems.map((item, index) => `
    <article class="portfolio-item portfolio-video-card reveal-card" data-category="${item.category}" style="transition-delay:${index * 70}ms">
      <div class="portfolio-video-thumb">
        <iframe
          src="${vimeoEmbed(item.vimeo)}"
          title="${item.title}"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
          loading="lazy"></iframe>
      </div>
      <div class="portfolio-body">
        <small>${item.client} / ${item.category}</small>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </div>
    </article>
  `).join('');

  observe('.portfolio-item');

  document.querySelectorAll('.filter').forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;

      document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
      button.classList.add('active');

      document.querySelectorAll('.portfolio-item').forEach((item, index) => {
        const show = filter === 'all' || item.dataset.category === filter;
        item.style.transitionDelay = `${index * 35}ms`;
        item.classList.toggle('is-hiding', !show);
      });
    });
  });
}

function initModal() {
  const modal = document.getElementById('videoModal');
  const close = document.querySelector('.modal-close');

  close?.addEventListener('click', closeVideo);

  modal?.addEventListener('click', event => {
    if (event.target === modal) closeVideo();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeVideo();
  });
}

function openVideo(id) {
  const modal = document.getElementById('videoModal');
  const iframe = modal?.querySelector('iframe');
  if (!modal || !iframe || !id) return;

  iframe.src = `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0`;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
}

function closeVideo() {
  const modal = document.getElementById('videoModal');
  const iframe = modal?.querySelector('iframe');
  if (!modal || !iframe) return;

  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  iframe.src = '';
  document.body.classList.remove('no-scroll');
}

// Premium motion polish: soft cursor glow
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const glow = document.querySelector('.cursor-glow');
  if (!glow) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;

  window.addEventListener('pointermove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    glow.style.opacity = '.85';
  }, { passive:true });

  window.addEventListener('pointerleave', () => {
    glow.style.opacity = '0';
  }, { passive:true });

  const tick = () => {
    currentX += (mouseX - currentX) * 0.08;
    currentY += (mouseY - currentY) * 0.08;
    glow.style.transform = `translate3d(${currentX - 210}px, ${currentY - 210}px, 0)`;
    requestAnimationFrame(tick);
  };

  tick();
})();

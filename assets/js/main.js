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
  initModal();
  ekoInitSlickPortfolio();
});function initMobileNav() {
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


function initModal() {
  const modal = document.getElementById('videoModal');
  if (!modal) return; // modal not present in this build

  const close = modal.querySelector('.modal-close');
  close?.addEventListener('click', closeVideo);
  modal.addEventListener('click', event => {
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


/* --- Slick portfolio system: filters, view more, expanding active cards --- */
const EKO_PORTFOLIO_ITEMS = [
  {
    "client": "Eko Create",
    "category": "Showreel",
    "title": "Eko Showreel Highlights",
    "description": "A fast-moving overview of film, motion and content work for modern brands.",
    "distribution": "Website / new business / social",
    "type": "video",
    "vimeo": "1190711638",
    "featured": true
  },
  {
    "client": "Eko Create",
    "category": "Film",
    "title": "Creative Campaign",
    "description": "Campaign-led video content shaped for brand storytelling and audience engagement.",
    "distribution": "Website / campaign / social",
    "type": "video",
    "vimeo": "1190711615",
    "featured": true
  },
  {
    "client": "Eko Create",
    "category": "Motion",
    "title": "Motion Storytelling",
    "description": "Motion-led content using graphics, pacing and sound to simplify complex messages.",
    "distribution": "Website / internal comms / presentation",
    "type": "video",
    "vimeo": "1190711606",
    "featured": true
  },
  {
    "client": "Eko Create",
    "category": "Social",
    "title": "Commercial Production",
    "description": "Short-form video created for digital campaigns, brand awareness and social channels.",
    "distribution": "Social / web / paid media",
    "type": "video",
    "vimeo": "1190711570",
    "featured": false
  },
  {
    "client": "Eko Create",
    "category": "Film",
    "title": "Portfolio Film 05",
    "description": "A selected production piece showing people, place and brand narrative.",
    "distribution": "Website / client comms",
    "type": "video",
    "vimeo": "1190718103",
    "featured": false
  },
  {
    "client": "Eko Create",
    "category": "Motion",
    "title": "Portfolio Film 06",
    "description": "Motion and edit-led content designed to make key information feel clear and engaging.",
    "distribution": "Internal comms / presentation",
    "type": "video",
    "vimeo": "1190718063",
    "featured": false
  },
  {
    "client": "Eko Create",
    "category": "Film",
    "title": "Portfolio Film 07",
    "description": "Cinematic film content built around strong visuals and concise storytelling.",
    "distribution": "Website / launch / events",
    "type": "video",
    "vimeo": "1190718082",
    "featured": false
  },
  {
    "client": "Eko Create",
    "category": "Social",
    "title": "Portfolio Film 08",
    "description": "Platform-ready content adapted for quick attention and repeat viewing.",
    "distribution": "LinkedIn / social / campaign",
    "type": "video",
    "vimeo": "1190718097",
    "featured": false
  },
  {
    "client": "Eko Create",
    "category": "Podcast",
    "title": "Portfolio Film 09",
    "description": "Podcast and interview-led content shaped into polished video assets.",
    "distribution": "Podcast / YouTube / social clips",
    "type": "video",
    "vimeo": "1190718049",
    "featured": false
  },
  {
    "client": "Eko Create",
    "category": "Motion",
    "title": "Portfolio Film 10",
    "description": "Graphic-led content that brings structure, rhythm and visual clarity to messaging.",
    "distribution": "Internal comms / digital campaign",
    "type": "video",
    "vimeo": "1190718003",
    "featured": false
  },
  {
    "client": "Eko Create",
    "category": "Film",
    "title": "Portfolio Film 11",
    "description": "A concise brand film designed to present people, purpose and message clearly.",
    "distribution": "Website / new business",
    "type": "video",
    "vimeo": "1190718021",
    "featured": false
  },
  {
    "client": "Eko Create",
    "category": "Social",
    "title": "Portfolio Film 12",
    "description": "Short-form content produced for digital channels and social delivery.",
    "distribution": "Social / LinkedIn / web",
    "type": "video",
    "vimeo": "1190717849",
    "featured": false
  },
  {
    "client": "Eko Create",
    "category": "Film",
    "title": "Portfolio Film 13",
    "description": "Production-led storytelling with a polished, editorial approach.",
    "distribution": "Website / presentation",
    "type": "video",
    "vimeo": "1190717821",
    "featured": false
  },
  {
    "client": "Eko Create",
    "category": "Motion",
    "title": "Portfolio Film 14",
    "description": "Motion and edit-led work built for clarity, energy and visual impact.",
    "distribution": "Digital / internal comms",
    "type": "video",
    "vimeo": "1190719360",
    "featured": false
  }
];
const EKO_INITIAL_VISIBLE = 6;
let ekoVisibleCount = EKO_INITIAL_VISIBLE;
let ekoCurrentFilter = 'all';

function ekoVimeoEmbed(id) {
  return `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0&badge=0&autopause=0`;
}

function ekoPortfolioFilteredItems() {
  return EKO_PORTFOLIO_ITEMS.filter(item => ekoCurrentFilter === 'all' || item.category.toLowerCase() === ekoCurrentFilter.toLowerCase());
}

function ekoRenderPortfolio() {
  const grid = document.getElementById('portfolioGrid');
  const loadMore = document.getElementById('loadMoreWork');
  if (!grid) return;

  const filtered = ekoPortfolioFilteredItems();
  const visible = filtered.slice(0, ekoVisibleCount);

  grid.innerHTML = visible.map((item, index) => `
    <article class="portfolio-item portfolio-video-card reveal-card ${item.featured && index < 3 ? 'is-featured' : ''}" data-category="${item.category}">
      <button class="portfolio-expand" type="button" aria-label="Expand ${item.title}"><span></span></button>
      <div class="portfolio-video-thumb">
        <iframe src="${ekoVimeoEmbed(item.vimeo)}" title="${item.title}" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>
      </div>
      <div class="portfolio-body">
        <small>${item.client} / ${item.category}</small>
        <h3>${item.title}</h3>
        <p>${item.featured ? 'Featured website reel and selected production work.' : 'Approved portfolio video for the Eko Create website.'}</p>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.portfolio-video-card').forEach(card => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('iframe')) return;
      const wasActive = card.classList.contains('is-active');
      grid.querySelectorAll('.portfolio-video-card').forEach(item => item.classList.remove('is-active'));
      grid.classList.toggle('has-active', !wasActive);
      if (!wasActive) card.classList.add('is-active');
    });
  });

  if (loadMore) {
    const hasMore = ekoVisibleCount < filtered.length;
    loadMore.style.display = hasMore ? 'inline-flex' : 'none';
    loadMore.textContent = hasMore ? `View more work (${filtered.length - ekoVisibleCount})` : 'All work loaded';
  }

  if (typeof observe === 'function') observe('.portfolio-item');
}

function ekoInitSlickPortfolio() {
  const grid = document.getElementById('portfolioGrid');
  if (!grid) return;

  document.querySelectorAll('.filter').forEach(button => {
    button.addEventListener('click', () => {
      ekoCurrentFilter = button.dataset.filter || 'all';
      ekoVisibleCount = EKO_INITIAL_VISIBLE;
      document.querySelectorAll('.filter').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      grid.classList.remove('has-active');
      ekoRenderPortfolio();
    });
  });

  const loadMore = document.getElementById('loadMoreWork');
  if (loadMore) {
    loadMore.addEventListener('click', () => {
      ekoVisibleCount += 6;
      ekoRenderPortfolio();
    });
  }

  ekoRenderPortfolio();
}


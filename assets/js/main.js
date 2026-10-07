// Vimeo privacy hashes are required to embed these unlisted videos.
// Private-link codes for Vimeo. The showreel's code lives here; each portfolio video's code comes from
// its Vimeo link in assets/data/portfolio.json and is added to this list when the page loads.
const EKO_VIMEO_HASHES = {
  "1190711612": "6c7e8990a5"
};

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const observe = (selector, options = {}) => {
  const items = [...document.querySelectorAll(selector)].filter(item => !item.classList.contains('motion-ready'));
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
    const siblings = [...item.parentElement.children].filter(el => el.matches(selector));
    const columns = getComputedStyle(item.parentElement).gridTemplateColumns.split(' ').length;
    const order = item.matches('.portfolio-item') ? siblings.indexOf(item) % Math.max(1, columns) : 0;
    const delay = item.dataset.delay ?? order * 140;
    item.style.transitionDelay = `${delay}ms`;
    item.classList.add('motion-ready');
    observer.observe(item);
  });
};

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-animate]').forEach((el, i) => {
    const delay = el.dataset.delay || i * 90;
    el.style.transitionDelay = `${delay}ms`;
    setTimeout(() => el.classList.add('in-view'), 120);
  });

  observe('.section-heading, .intro-grid > div, .statement-inner, .clients-intro, .contact-copy');
  observe('.reveal-card');
  observe('.reveal-logo');

  const header = document.querySelector('.site-header');
  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  initScrollMotion();
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
    navToggle.setAttribute('aria-label', 'Open navigation');
    mobileNav.inert = true;
    navToggle.classList.remove('is-open');
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  };

  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    mobileNav.inert = isOpen;
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

  iframe.src = `${ekoVimeoEmbed(id)}&autoplay=1`;
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

/* --- Slick portfolio system: filters, view more, expanding active cards --- */
// The portfolio videos live in assets/data/portfolio.json so they can be edited in Pages CMS
// (settings in .pages.yml). The list order in that file is the order on the page.
let EKO_PORTFOLIO_ITEMS = [];

function ekoEscape(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

// Accepts a Vimeo share link (https://vimeo.com/123456789/abcdef1234), a player link (…/video/123456789?h=abcdef1234)
// or a plain video number. Private videos need the code that follows the number.
function ekoParseVimeo(value) {
  const text = String(value == null ? '' : value).trim();
  const id = (text.match(/^(\d{6,})$/) || text.match(/vimeo\.com\/(?:[^?#]*?\/)?(\d{6,})(?=[\/?#]|$)/i) || [])[1] || '';
  const hash = (text.match(/[?&]h=([0-9a-z]+)/i) || text.match(/\/\d{6,}\/([0-9a-z]+)/i) || [])[1] || '';
  return { id, hash };
}

function ekoLoadPortfolio() {
  return fetch('assets/data/portfolio.json', { cache: 'no-cache' })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      const list = Array.isArray(data) ? data : (data && data.videos) || [];
      EKO_PORTFOLIO_ITEMS = list.map(entry => {
        const video = ekoParseVimeo(entry && entry.vimeo);
        if (video.id && video.hash) EKO_VIMEO_HASHES[video.id] = video.hash;
        return {
          client: String((entry && entry.client) || '').trim(),
          category: String((entry && entry.category) || '').trim(),
          title: String((entry && entry.title) || '').trim(),
          description: String((entry && entry.description) || '').trim(),
          featured: Boolean(entry && entry.featured),
          vimeo: video.id
        };
      }).filter(item => item.vimeo && item.title);
    })
    .catch(error => {
      console.warn('Portfolio list could not be loaded.', error);
      EKO_PORTFOLIO_ITEMS = [];
    });
}

// If the page was opened on a section link (for example /#contact), the browser may jump there before the
// portfolio has been filled in, which pushes the section down. Jump again once, unless the visitor has moved.
let ekoVisitorMoved = false;
['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(type => {
  window.addEventListener(type, () => { ekoVisitorMoved = true; }, { passive: true, once: true });
});
function ekoRestoreAnchor() {
  if (ekoVisitorMoved || window.location.hash.length < 2) return;
  let target = null;
  try { target = document.querySelector(window.location.hash); } catch (error) { return; }
  if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
}
const EKO_INITIAL_VISIBLE = 6;
let ekoVisibleCount = EKO_INITIAL_VISIBLE;
let ekoCurrentFilter = 'all';

function ekoVimeoEmbed(id) {
  const hash = EKO_VIMEO_HASHES[id];
  const privacy = hash ? `h=${encodeURIComponent(hash)}&` : '';
  return `https://player.vimeo.com/video/${id}?${privacy}title=0&byline=0&portrait=0&badge=0&autopause=0`;
}

function ekoPortfolioFilteredItems() {
  return EKO_PORTFOLIO_ITEMS.filter(item => ekoCurrentFilter === 'all' || String(item.category).toLowerCase() === ekoCurrentFilter.toLowerCase());
}

function ekoRenderPortfolio(append = false) {
  const grid = document.getElementById('portfolioGrid');
  const loadMore = document.getElementById('loadMoreWork');
  if (!grid) return;

  const filtered = ekoPortfolioFilteredItems();
  const start = append ? grid.children.length : 0;
  const visible = filtered.slice(start, ekoVisibleCount);
  if (!append) grid.innerHTML = "";

  grid.insertAdjacentHTML("beforeend", visible.map((item, index) => `
    <article class="portfolio-item portfolio-video-card reveal-card ${item.featured && index < 3 ? 'is-featured' : ''}" data-category="${ekoEscape(item.category)}">
      <button class="portfolio-expand" type="button" aria-expanded="false" aria-label="Expand ${ekoEscape(item.title)}"><span></span></button>
      <div class="portfolio-video-thumb">
        <iframe src="${ekoVimeoEmbed(item.vimeo)}" title="${ekoEscape(item.title)}" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>
      </div>
      <div class="portfolio-body">
        <small>${ekoEscape(item.client)} / ${ekoEscape(item.category)}</small>
        <h3>${ekoEscape(item.title)}</h3>
        <p>${ekoEscape(item.description)}</p>
      </div>
    </article>
  `).join(''));

  [...grid.children].slice(start).forEach(card => {
    const button = card.querySelector('.portfolio-expand');
    button.addEventListener('click', () => {
      const opening = !card.classList.contains('is-active');
      grid.querySelectorAll('.portfolio-video-card').forEach(item => {
        item.classList.remove('is-active');
        const control = item.querySelector('.portfolio-expand');
        control.setAttribute('aria-expanded', 'false');
        control.setAttribute('aria-label', `Expand ${item.querySelector('h3').textContent}`);
      });
      grid.classList.toggle('has-active', opening);
      card.classList.toggle('is-active', opening);
      button.setAttribute('aria-expanded', String(opening));
      button.setAttribute('aria-label', `${opening ? 'Collapse' : 'Expand'} ${card.querySelector('h3').textContent}`);
      requestAnimationFrame(() => card.scrollIntoView({block: 'start', behavior: 'instant'}));
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
      ekoRenderPortfolio(true);
    });
  }

  ekoLoadPortfolio().then(() => {
    ekoRenderPortfolio();
    ekoRestoreAnchor();
  });
}



// Do not request decorative video on phones or when reduced motion is selected.
(function initHeroVideo() {
  const video = document.querySelector('.hero-bg-video');
  if (!video) return;
  const viewport = matchMedia('(min-width: 981px)');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const source = video.querySelector('source');
  const sync = () => {
    if (viewport.matches && !motion.matches && !navigator.connection?.saveData) {
      if (!source.hasAttribute('src')) { source.src = source.dataset.src; video.load(); }
      video.play().catch(() => {});
    } else {
      video.pause();
      if (source.hasAttribute('src')) { source.removeAttribute('src'); video.load(); }
    }
  };
  viewport.addEventListener('change', sync);
  motion.addEventListener('change', sync);
  sync();
})();

// Scroll-linked depth without intercepting scrolling or running a perpetual loop.
function initScrollMotion() {
  const media = document.querySelector('.hero-media');
  const hero = document.querySelector('.hero');
  if (!media || !hero) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let scheduled = false;
  const paint = () => {
    scheduled = false;
    const bounds = hero.getBoundingClientRect();
    const enabled = !preference.matches && innerWidth > 680;
    const offset = enabled ? Math.min(bounds.height, Math.max(0, -bounds.top)) * .16 : 0;
    media.style.setProperty('--parallax-y', `${offset}px`);
  };
  const schedule = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(paint); }
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  preference.addEventListener('change', schedule);
  paint();
}

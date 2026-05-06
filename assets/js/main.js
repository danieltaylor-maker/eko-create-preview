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

  const reelFrame = document.querySelector('#reel iframe');
  const reelObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && reelFrame && !reelFrame.src) {
        reelFrame.src = reelFrame.dataset.src;
        reelObserver.disconnect();
      }
    });
  }, { threshold: 0.25 });
  const reel = document.querySelector('#reel');
  if (reel) reelObserver.observe(reel);

  document.querySelectorAll('[data-reel-trigger]').forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(() => document.querySelector('#reel')?.classList.add('in-view'), 220);
    });
  });

  initPortfolio();
});

const portfolioItems = [
  {
    title: 'Eko Create — Selected Work Reel',
    client: 'Eko Create',
    category: 'video',
    description: 'Video, social and motion content for complex organisations.',
    vimeo: '1134600172'
  },
  {
    title: 'Internal Communications',
    client: 'Aviva',
    category: 'video',
    description: 'Leadership and campaign content for internal teams.',
    vimeo: '1134600172'
  },
  {
    title: 'Research Integrity',
    client: 'Elsevier',
    category: 'motion',
    description: 'Animated explainer content for a complex global message.',
    vimeo: '1134600172'
  },
  {
    title: 'Customer Experience',
    client: 'LNER',
    category: 'video',
    description: 'Interview-led content shaped from real project conversations.',
    vimeo: '1134600172'
  },
  {
    title: 'Podcast Production',
    client: 'Eko Create',
    category: 'podcast',
    description: 'Multi-camera podcast filming with social cutdowns.',
    vimeo: '1134600172'
  },
  {
    title: 'Social Campaign Cutdowns',
    client: 'Eko Create',
    category: 'social',
    description: 'Short-form edits and formats for teams, platforms and campaigns.',
    vimeo: '1134600172'
  },
  {
    title: 'Production Photography',
    client: 'Eko Create',
    category: 'photography',
    description: 'Still image capture alongside video shoots for flexible campaign assets.',
    vimeo: '1134600172'
  }
];

function initPortfolio() {
  const grid = document.getElementById('portfolioGrid');
  if (!grid) return;

  grid.innerHTML = portfolioItems.map((item, index) => `
    <article class="portfolio-item reveal-card" data-category="${item.category}" data-vimeo="${item.vimeo}" style="transition-delay:${index * 70}ms">
      <div class="portfolio-thumb" aria-hidden="true"></div>
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

  document.querySelectorAll('.portfolio-item').forEach(item => {
    item.addEventListener('click', () => openVideo(item.dataset.vimeo));
  });

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

window.initMap = function initMap() {
  const el = document.getElementById('map');
  if (!el || !window.google) return;
  const eko = { lat: 53.9591, lng: -1.0822 };
  const map = new google.maps.Map(el, {
    zoom: 16,
    center: eko,
    disableDefaultUI: true,
    zoomControl: true,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#171a1f' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#171a1f' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#8f98a3' }] },
      { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
      { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#252a30' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#b8b8b8' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0c0f' }] }
    ]
  });
  new google.maps.Marker({
    position: eko,
    map,
    title: 'Eko Create UK Ltd',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#079df3',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2
    }
  });
};

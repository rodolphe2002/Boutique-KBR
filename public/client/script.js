
const baseUrl = window.location.hostname === "localhost"
  ? "http://localhost:3000"
  : "https://boutique-kbr.onrender.com";

let currentProducts = []; // Stocke les produits actuellement affichés

document.addEventListener('DOMContentLoaded', () => {
  fetchSessions();
  fetchRecentProducts();
  // Search toggle
  const toggle = document.getElementById('searchToggle');
  const bar = document.getElementById('collapsibleSearch');
  const input = document.getElementById('searchInput');
  // Banner intro animation on page load
  const banner = document.querySelector('.banniere');
  if (banner) {
    // Use RAF to ensure styles are applied before starting animation
    requestAnimationFrame(() => banner.classList.add('intro-anim'));
  }
  if (typeof window !== 'undefined') {
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }
    if (window.Lenis) {
      const isMobile = (typeof window !== 'undefined') && (
        (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) ||
        ('ontouchstart' in window && !(window.matchMedia && window.matchMedia('(pointer: fine)').matches))
      );
      const baseDuration = isMobile ? 10.0 : 7.0;
      const lenis = new window.Lenis({
        duration: baseDuration,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        smoothWheel: true,
        smoothTouch: true,
        touchMultiplier: 1.2,
        normalizeWheel: true,
        syncTouch: true
      });
      window.lenis = lenis;

      function raf(time) {
        lenis.raf(time);
        if (window.ScrollTrigger) window.ScrollTrigger.update();
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);

      if (window.ScrollTrigger && typeof lenis.on === 'function') {
        try { lenis.on('scroll', () => window.ScrollTrigger.update()); } catch {}
      }

      try {
        document.querySelectorAll('a[href^="#"]').forEach((a) => {
          a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (target) {
              e.preventDefault();
              const isMob = (typeof window !== 'undefined') && (
                (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) ||
                ('ontouchstart' in window && !(window.matchMedia && window.matchMedia('(pointer: fine)').matches))
              );
              const dur = isMob ? 10.0 : 7.0;
              lenis.scrollTo(target, { offset: -12, duration: dur, easing: (t) => 1 - Math.pow(1 - t, 3) });
            }
          });
        });
      } catch {}
    }
    if (window.gsap && document.querySelector('.banniere .fancy')) {
      try { window.gsap.from('.banniere .fancy', { opacity: 0, y: 20, duration: 0.8, ease: 'power2.out', delay: 0.2 }); } catch {}
    }
  }
  if (toggle && bar) {
    bar.classList.remove('open');
    let suppressNextFocusNavigate = false;
    toggle.addEventListener('click', () => {
      const willOpen = !bar.classList.contains('open');
      bar.classList.toggle('open');
      if (willOpen) {
        suppressNextFocusNavigate = true; // prevent immediate nav on programmatic focus
        setTimeout(() => { suppressNextFocusNavigate = false; }, 350);
        setTimeout(() => { input && input.focus({ preventScroll: false }); }, 180);
      }
    });
    const goSearchIfUser = () => {
      if (!suppressNextFocusNavigate) window.location.href = './search.html';
    };
    if (input) {
      input.addEventListener('focus', goSearchIfUser);
      input.addEventListener('click', goSearchIfUser);
    }
  }
});

// Premium scroll behaviors and animations
(function(){
  if (typeof window === 'undefined') return;
  document.addEventListener('DOMContentLoaded', () => {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    // Navbar compact on scroll
    try {
      const nav = document.querySelector('.navbar');
      if (nav) {
        const onScroll = () => {
          const y = window.scrollY || document.documentElement.scrollTop || 0;
          if (y > 10) nav.classList.add('navbar--condensed');
          else nav.classList.remove('navbar--condensed');
        };
        onScroll();
        if (window.lenis && typeof window.lenis.on === 'function') {
          try { window.lenis.on('scroll', onScroll); } catch {}
        } else {
          window.addEventListener('scroll', onScroll, { passive: true });
        }
      }
    } catch {}

    // Scroll progress bar
    try {
      let bar = document.getElementById('scrollProgress');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'scrollProgress';
        const inner = document.createElement('div');
        inner.className = 'scroll-progress__bar';
        bar.appendChild(inner);
        document.body.appendChild(bar);
      }
      const inner = bar.querySelector('.scroll-progress__bar');
      const update = (p) => { if (inner) inner.style.transform = `scaleX(${p})`; };
      const doUpdate = () => {
        const doc = document.documentElement;
        const scrollTop = doc.scrollTop || window.pageYOffset || 0;
        const max = (doc.scrollHeight - doc.clientHeight) || 1;
        update(Math.min(1, Math.max(0, scrollTop / max)));
      };
      doUpdate();
      if (window.lenis && typeof window.lenis.on === 'function') {
        try { window.lenis.on('scroll', doUpdate); } catch {}
      } else {
        window.addEventListener('scroll', doUpdate, { passive: true });
      }
    } catch {}

    // Parallax banner and content fade
    if (gsap && ScrollTrigger && document.querySelector('.banniere')) {
      try {
        const media = document.querySelector('.banniere .banniere-media');
        const content = document.querySelector('.banniere .banniere-contenu');
        if (media) {
          gsap.to(media, {
            scale: 1.08,
            ease: 'none',
            scrollTrigger: { trigger: '.banniere', start: 'top top', end: 'bottom top', scrub: true }
          });
        }
        if (content) {
          gsap.to(content, {
            yPercent: -20, autoAlpha: 0.0,
            ease: 'none',
            scrollTrigger: { trigger: '.banniere', start: 'top top', end: 'bottom top', scrub: true }
          });
        }
      } catch {}
    }

    // Reveal animations for sections/cards
    if (gsap && ScrollTrigger) {
      try {
        gsap.utils.toArray('.session-card, .why-card, .product-card').forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 40,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
          });
        });
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      } catch {}
    }

    // Why KBR: dock previous image when the next one scrolls into view
    (function setupWhyKBRDocking(){
      const gsap = window.gsap; const ST = window.ScrollTrigger;
      if (!gsap || !ST) return;
      try {
        const container = document.querySelector('.why-kbr');
        if (!container) return;
        const cards = Array.from(container.querySelectorAll('.why-card'));
        if (cards.length < 2) return;
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
        const sideX = isMobile ? (window.innerWidth * 0.18) : (window.innerWidth * 0.22);
        const stackGap = isMobile ? 60 : 72;
        const dockSize = isMobile ? 88 : 120; // square size when docked

        cards.forEach((card, i) => {
          if (i === 0) return; // from second card onward
          const prevCards = cards.slice(0, i);
          prevCards.forEach((el) => gsap.set(el, { transformOrigin: 'top left', willChange: 'transform,width,height' }));

          // Create a scrubbed timeline so the docking eases with scroll and reverses naturally
          const tl = gsap.timeline({
            defaults: { ease: 'power2.out' },
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              end: 'top 50%',
              scrub: true,
              invalidateOnRefresh: true
            }
          });

          prevCards.forEach((el, j) => {
            tl.to(el, {
              x: -sideX,
              y: j * (isMobile ? 48 : 56),
              width: dockSize,
              height: dockSize,
              borderRadius: 12,
              scale: isMobile ? 0.66 : 0.6
            }, 0);
          });
        });
        ST.refresh();
      } catch {}
    })();

    // Expose a small API to tune feel at runtime
    try {
      window.setScrollFeel = function(opts = {}){
        const l = window.lenis; if (!l) return;
        const curr = l.options || {};
        const next = {
          duration: opts.duration != null ? opts.duration : curr.duration,
          easing: typeof opts.easing === 'function' ? opts.easing : curr.easing,
          smoothWheel: opts.smoothWheel != null ? opts.smoothWheel : curr.smoothWheel,
          smoothTouch: opts.smoothTouch != null ? opts.smoothTouch : curr.smoothTouch,
          touchMultiplier: opts.touchMultiplier != null ? opts.touchMultiplier : curr.touchMultiplier,
          normalizeWheel: opts.normalizeWheel != null ? opts.normalizeWheel : curr.normalizeWheel,
          syncTouch: opts.syncTouch != null ? opts.syncTouch : curr.syncTouch
        };
        try { l.update(next); } catch {}
      };
    } catch {}
  });
})();

async function fetchSessions() { 
  try {
    const res = await fetch(`${baseUrl}/api/sessions`);
    const sessions = await res.json();
    const sessionTabs = document.getElementById('sessionTabs');
    if (sessionTabs) {
      sessionTabs.innerHTML = '';
      sessions.forEach((session, index) => {
        const tab = document.createElement('button');
        tab.className = 'tab';
        if (index === 0) tab.classList.add('active');
        tab.textContent = session.name;
        tab.dataset.sessionId = session._id;

        tab.addEventListener('click', () => {
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          fetchProducts(session._id);
        });

        sessionTabs.appendChild(tab);
      });
    }


    // Render sessions grid cards
    renderSessionsGrid(sessions);

    // Do not auto-load products on index anymore

  } catch (error) {
    console.error('Erreur lors du chargement des sessions :', error);
  }
}

async function fetchRecentProducts() {
  try {
    const res = await fetch(`${baseUrl}/api/products/recent?limit=10&_=${Date.now()}`);
    const items = await res.json();
    renderRecent(items);
  } catch (e) {
    console.error('Erreur chargement produits récents:', e);
  }
}

function renderRecent(products) {
  const wrap = document.getElementById('recentScroller');
  if (!wrap) return;
  wrap.innerHTML = '';
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
  if (isMobile) {
    const stack = document.createElement('div');
    stack.className = 'uiverse-stack play';
    const top4 = products.slice(0, 4);
    // Ensure we have 4 cards (duplicate if fewer)
    while (top4.length < 4 && products.length) top4.push(products[top4.length % products.length]);
    while (top4.length < 4) top4.push({ title: 'KBR', image: './img/Logo.jpg' });

    top4.forEach((p) => {
      const imgSrc = p.image || (Array.isArray(p.images) && p.images[0]) || '';
      const div = document.createElement('div');
      div.className = 'uiverse-card';
      if (imgSrc) div.style.backgroundImage = `url('${imgSrc}')`;
      const label = document.createElement('span');
      label.textContent = p.title || '';
      div.appendChild(label);
      if (p._id) {
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
          window.location.href = `./product.html?productId=${encodeURIComponent(p._id)}`;
        });
      }
      stack.appendChild(div);
    });

    wrap.appendChild(stack);

    // Mobile-only smooth animations for the recent products stack
    try {
      const gsap = window.gsap; const ST = window.ScrollTrigger;
      const cards = stack.querySelectorAll('.uiverse-card');
      if (gsap && cards.length) {
        // Initial reveal of the stack cards
        try {
          gsap.set(cards, { opacity: 0, y: 24, scale: 0.985 });
          gsap.to(cards, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power2.out',
            stagger: 0.08,
            scrollTrigger: ST ? { trigger: wrap, start: 'top 85%' } : undefined
          });
        } catch {}

        // Subtle parallax drift while scrolling the section
        if (ST) {
          try {
            gsap.utils.toArray(cards).forEach((el, i) => {
              gsap.to(el, {
                yPercent: 4 + (i * 1),
                ease: 'none',
                scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true }
              });
            });
            ST.refresh();
          } catch {}
        }
      }
    } catch {}

    return;
  }

  // Desktop/tablet: keep grid of recent cards
  products.forEach((p) => {
    const imgSrc = p.image || (Array.isArray(p.images) && p.images[0]) || '';
    const card = document.createElement('article');
    card.className = 'recent-card';
    card.innerHTML = `
      <img src="${imgSrc}" alt="${p.title}" loading="lazy" decoding="async">
      <span class="rc-title">${p.title}</span>
    `;
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      window.location.href = `./product.html?productId=${encodeURIComponent(p._id)}`;
    });
    wrap.appendChild(card);
  });

  // Inject JSON-LD ItemList for recent products (top 10)
  try {
    const list = (products || []).slice(0, 10).map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${window.location.origin}/client/product.html?productId=${encodeURIComponent(p._id)}`,
      name: p.title
    }));
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Nouveautés Boutique KBR',
      itemListElement: list
    };
    let tag = document.getElementById('ld-recent-itemlist');
    if (!tag) {
      tag = document.createElement('script');
      tag.type = 'application/ld+json';
      tag.id = 'ld-recent-itemlist';
      document.head.appendChild(tag);
    }
    tag.textContent = JSON.stringify(ld);
  } catch {}

  if (window.gsap && window.ScrollTrigger) {
    try {
      window.gsap.utils.toArray('.recent-card').forEach((el) => {
        window.gsap.from(el, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
        });
      });
      window.ScrollTrigger.refresh();
    } catch {}
  }
}

function renderSessionsGrid(sessions) {
  const grid = document.getElementById('sessionsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  sessions.forEach((s) => {
    const card = document.createElement('article');
    card.className = 'session-card';

    const bgUrl = s.image ? s.image : './img/banniere.jpg';
    card.style.backgroundImage = `url('${bgUrl}')`;

    card.innerHTML = `
      <div class="session-overlay">
        <p class="session-subtitle">${s.name}</p>
        <h3 class="session-title">Découvrez ${s.name}</h3>
        <button class="session-cta cta" data-session-id="${s._id}">
          <span class="hover-underline-animation">Acheter</span>
          <svg id="arrow-horizontal" xmlns="http://www.w3.org/2000/svg" width="30" height="10" viewBox="0 0 46 16" aria-hidden="true">
            <path id="Path_10" data-name="Path 10" d="M8,0,6.545,1.455l5.506,5.506H-30V9.039H12.052L6.545,14.545,8,16l8-8Z" transform="translate(30)"></path>
          </svg>
        </button>
      </div>
    `;

    const btn = card.querySelector('.session-cta');
    let isNavigating = false;
    const navigate = () => {
      if (isNavigating) return;
      isNavigating = true;
      try {
        const cube = document.createElement('div');
        cube.className = 'page-transition page-transition--preview';
        const url = `./session.html?sessionId=${encodeURIComponent(s._id)}`;
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        cube.appendChild(iframe);
        document.body.appendChild(cube);
        // Forcer le reflow pour que la transition démarre
        void cube.offsetWidth;
        cube.classList.add('page-transition--expand');
        const go = () => { window.location.href = url; };
        // Sécurité: navigation après la durée de la transition
        cube.addEventListener('transitionend', go, { once: true });
        setTimeout(go, 1300);
      } catch {
        window.location.href = `./session.html?sessionId=${encodeURIComponent(s._id)}`;
      }
    };
    btn.addEventListener('click', navigate);
    card.addEventListener('click', (e) => {
      if (!(e.target && e.target.classList && e.target.classList.contains('session-cta'))) {
        navigate();
      }
    });

    grid.appendChild(card);
  });

  if (window.gsap && window.ScrollTrigger) {
    try {
      window.gsap.utils.toArray('.session-card').forEach((el) => {
        window.gsap.from(el, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
        });
      });
      window.ScrollTrigger.refresh();
    } catch {}
  }
}

async function fetchProducts(sessionId) {
  try {
    const res = await fetch(`${baseUrl}/api/products?sessionId=${sessionId}&_=${Date.now()}`);
    const products = await res.json();
    currentProducts = products;

    const productList = document.getElementById('productList');
    productList.innerHTML = '';

    products.forEach((product, index) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      const gallery = Array.isArray(product.images) ? product.images : [];
      const base = product.image ? [product.image] : [];
      // Merge unique URLs to ensure we show both main image and gallery
      const imagesArr = Array.from(new Set([...base, ...gallery]));
      if (imagesArr.length === 0) imagesArr.push('');
      const primaryImage = imagesArr[0];
      const chips = Array.isArray(product.variants) && product.variants.length > 0
        ? `<div class="variant-chips" title="${product.variantType || ''}">` +
            product.variants.map(v => `<span class="chip">${v}</span>`).join('') +
          `</div>`
        : '';

      card.innerHTML = `
        <div class="product-gallery">
          <img class="main-image" src="${primaryImage}" alt="${product.title}" loading="lazy" decoding="async">
          <div class="thumbs">
            ${imagesArr.map((src, i) => `<img src="${src}" alt="${product.title} ${i+1}" class="${i===0?'active':''}" data-idx="${i}" loading="lazy" decoding="async">`).join('')}
          </div>
        </div>
        <h3>${product.title}</h3>
        <p>${product.description}</p>
        ${chips}
        <p><strong>${product.price} FCFA</strong></p>
        <label>Quantité :
          <input type="number" id="qty-${index}" min="1" value="1" style="width: 60px;">
        </label>
        <button onclick="addToCart(${index})">Commander</button>
      `;

      // Thumbnails click -> switch main image
      const mainImg = card.querySelector('.main-image');
      card.querySelectorAll('.thumbs img').forEach((imgEl) => {
        imgEl.addEventListener('click', () => {
          mainImg.src = imgEl.src;
          card.querySelectorAll('.thumbs img').forEach(e => e.classList.remove('active'));
          imgEl.classList.add('active');
        });
      });

      // Variant selection -> toggle active and store on product temp field
      const chipEls = card.querySelectorAll('.variant-chips .chip');
      if (chipEls.length) {
        chipEls.forEach((chip) => {
          chip.addEventListener('click', () => {
            chipEls.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            // Save chosen variant on client state
            currentProducts[index].selectedVariant = chip.textContent.trim();
          });
        });
      }

      productList.appendChild(card);
    });

  } catch (error) {
    console.error('Erreur lors du chargement des produits :', error);
  }
}

function addToCart(index) {
  const product = currentProducts[index];
  const qtyInput = document.getElementById(`qty-${index}`);
  const quantity = parseInt(qtyInput.value);

  if (isNaN(quantity) || quantity < 1) {
    alert('Veuillez entrer une quantité valide.');
    return;
  }

  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  cart.push({ ...product, quantity, selectedVariant: product.selectedVariant || null });

  localStorage.setItem('cart', JSON.stringify(cart));
  window.location.href = 'cart.html';
}

// Recherche

document.getElementById('searchInput').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    const query = event.target.value.trim().toLowerCase();
    performSearch(query);
  }
});

function performSearch(query) {
  const productList = document.getElementById('productList');
  productList.innerHTML = '';

  const filtered = currentProducts.filter(product =>
    product.title.toLowerCase().includes(query) ||
    product.description.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    productList.innerHTML = '<p>Aucun produit trouvé.</p>';
    return;
  }

  filtered.forEach((product, index) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const imagesArr = (product.images && product.images.length > 0) ? product.images : [product.image];
    const primaryImage = imagesArr[0];
    const chips = Array.isArray(product.variants) && product.variants.length > 0
      ? `<div class="variant-chips" title="${product.variantType || ''}">` +
          product.variants.map(v => `<span class=\"chip\">${v}</span>`).join('') +
        `</div>`
      : '';

    card.innerHTML = `
      <div class="product-gallery">
        <img class="main-image" src="${primaryImage}" alt="${product.title}">
        <div class="thumbs">
          ${imagesArr.map((src, i) => `<img src="${src}" alt="${product.title} ${i+1}" class="${i===0?'active':''}" data-idx="${i}">`).join('')}
        </div>
      </div>
      <h3>${product.title}</h3>
      <p>${product.description}</p>
      ${chips}
      <p><strong>${product.price} FCFA</strong></p>
      <label>Quantité :
        <input type="number" id="qty-${index}" min="1" value="1" style="width: 60px;">
      </label>
      <button onclick="addToCart(${index})">Commander</button>
    `;
    // thumbnails behavior
    const mainImg = card.querySelector('.main-image');
    card.querySelectorAll('.thumbs img').forEach((imgEl) => {
      imgEl.addEventListener('click', () => {
        mainImg.src = imgEl.src;
        card.querySelectorAll('.thumbs img').forEach(e => e.classList.remove('active'));
        imgEl.classList.add('active');
      });
    });

    // variant behavior
    const chipEls = card.querySelectorAll('.variant-chips .chip');
    if (chipEls.length) {
      chipEls.forEach((chip) => {
        chip.addEventListener('click', () => {
          chipEls.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          product.selectedVariant = chip.textContent.trim();
        });
      });
    }

    productList.appendChild(card);
  });
}
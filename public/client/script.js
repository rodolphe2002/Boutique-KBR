
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
        <button class="session-cta" data-session-id="${s._id}">Acheter</button>
      </div>
    `;

    const btn = card.querySelector('.session-cta');
    const navigate = () => {
      window.location.href = `./session.html?sessionId=${encodeURIComponent(s._id)}`;
    };
    btn.addEventListener('click', navigate);
    card.addEventListener('click', (e) => {
      if (!(e.target && e.target.classList && e.target.classList.contains('session-cta'))) {
        navigate();
      }
    });

    grid.appendChild(card);
  });
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
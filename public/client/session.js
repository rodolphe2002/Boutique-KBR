const baseUrl = window.location.hostname === "localhost"
  ? "http://localhost:3000"
  : "https://boutique-kbr.onrender.com";

let currentProducts = [];

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('sessionId');
  if (!sessionId) {
    window.location.replace('./index.html');
    return;
  }
  initSessionPage(sessionId);
});

function truncateWords(text, maxWords = 5) {
  if (!text || typeof text !== 'string') return '';
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= maxWords) return parts.join(' ');
  return parts.slice(0, maxWords).join(' ') + '…';
}

// --- SEO helpers ---
function setMetaName(name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
function setMetaProp(prop, content) {
  if (!content) return;
  let el = document.querySelector(`meta[property="${prop}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', prop);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
function injectJSONLD(id, data) {
  try {
    let tag = document.getElementById(id);
    if (!tag) {
      tag = document.createElement('script');
      tag.type = 'application/ld+json';
      tag.id = id;
      document.head.appendChild(tag);
    }
    tag.textContent = JSON.stringify(data);
  } catch {}
}

function renderColorDots(colors) {
  if (!Array.isArray(colors) || colors.length === 0) return '';
  const max = 6;
  const shown = colors.slice(0, max);
  const more = colors.length - shown.length;
  const dots = shown
    .map(c => `<span class="color-dot" title="${c}" style="background:${c}"></span>`)
    .join('');
  const moreTxt = more > 0 ? `<span class="color-more">+${more}</span>` : '';
  return `<div class="color-dots">${dots}${moreTxt}</div>`;
}

async function initSessionPage(sessionId) {
  try {
    // Load session meta (name, image) from the list
    const sessionsRes = await fetch(`${baseUrl}/api/sessions`);
    const sessions = await sessionsRes.json();
    const session = sessions.find(s => s._id === sessionId);

    if (session) {
      const banner = document.getElementById('sessionBanner');
      const bannerImg = document.getElementById('sessionBannerImg');
      const sessionSubtitle = document.getElementById('sessionSubtitle');
      if (session.image) {
        bannerImg.src = session.image;
        banner.style.display = 'block';
      }
      sessionSubtitle.textContent = session.name;
      document.title = `${session.name} - Boutique KBR`;

      // Dynamic SEO meta/OG for the session
      const url = window.location.href;
      const desc = `Découvrez la sélection ${session.name} chez Boutique KBR: vêtements, chaussures et accessoires.`;
      setMetaName('description', desc);
      setMetaProp('og:title', `${session.name} | Boutique KBR`);
      setMetaProp('og:description', desc);
      setMetaProp('og:url', url);
      if (session.image) setMetaProp('og:image', session.image);
      setMetaName('twitter:title', `${session.name} | Boutique KBR`);
      setMetaName('twitter:description', desc);
      if (session.image) setMetaName('twitter:image', session.image);

      // BreadcrumbList JSON-LD
      injectJSONLD('ld-breadcrumb', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: `${window.location.origin}/client/index.html`
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: session.name,
            item: url
          }
        ]
      });
    }

    // Load products for this session
    await fetchProducts(sessionId, session);
  } catch (err) {
    console.error('Erreur chargement session:', err);
  }
}

async function fetchProducts(sessionId, sessionMeta) {
  try {
    const res = await fetch(`${baseUrl}/api/products?sessionId=${encodeURIComponent(sessionId)}&_=${Date.now()}`);
    const products = await res.json();
    currentProducts = products;

    const productList = document.getElementById('productList');
    productList.innerHTML = '';

    if (!products.length) {
      productList.innerHTML = '<p>Aucun produit dans cette session.</p>';
      return;
    }

    products.forEach((product) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      const imgSrc = product.image || (Array.isArray(product.images) && product.images[0]) || '';
      const colorDots = renderColorDots(product.colors);
      card.innerHTML = `
        <img class="main-image" src="${imgSrc}" alt="${product.title}" loading="lazy" decoding="async">
        <h3>${product.title}</h3>
        <p>${truncateWords(product.description || '', 5)}</p>
        ${colorDots}
        <p><strong>${product.price} FCFA</strong></p>
      `;
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        window.location.href = `./product.html?productId=${encodeURIComponent(product._id)}`;
      });
      productList.appendChild(card);
    });
    // Inject ItemList JSON-LD for session products
    try {
      const list = (products || []).slice(0, 12).map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${window.location.origin}/client/product.html?productId=${encodeURIComponent(p._id)}`,
        name: p.title
      }));
      injectJSONLD('ld-session-itemlist', {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Produits de la session ${sessionMeta?.name || ''}`.trim(),
        itemListElement: list
      });
    } catch {}

  } catch (error) {
    console.error('Erreur chargement produits:', error);
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
  cart.push({ ...product, quantity });
  localStorage.setItem('cart', JSON.stringify(cart));
  window.location.href = 'cart.html';
}

// Search within session
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      const query = event.target.value.trim().toLowerCase();
      performSearch(query);
    }
  });
}

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
    const gallery = Array.isArray(product.images) ? product.images : [];
    const base = product.image ? [product.image] : [];
    const imagesArr = Array.from(new Set([...base, ...gallery]));
    const primaryImage = imagesArr[0] || '';
    const colorDots = renderColorDots(product.colors);
    const chips = Array.isArray(product.variants) && product.variants.length > 0
      ? `<div class="variant-chips" title="${product.variantType || ''}">` +
          product.variants.map(v => `<span class=\"chip\">${v}</span>`).join('') +
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
      <p>${truncateWords(product.description || '', 5)}</p>
      ${chips}
      ${colorDots}
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
    productList.appendChild(card);
  });
}

const baseUrl = window.location.hostname === "localhost"
  ? "http://localhost:3000"
  : "https://boutique-kbr.onrender.com";

function getParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function uniqueImages(product) {
  const gallery = Array.isArray(product.images) ? product.images : [];
  const base = product.image ? [product.image] : [];
  const all = Array.from(new Set([...base, ...gallery]));
  return all.length ? all : [''];
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

function renderProduct(product) {
  const container = document.getElementById('productDetail');
  if (!container) return;

  const imagesArr = uniqueImages(product);
  const primary = imagesArr[0];
  // default selected image
  product.selectedImage = primary;
  const chips = Array.isArray(product.variants) && product.variants.length > 0
    ? `<div class="variant-chips" title="${product.variantType || ''}">`
        + product.variants.map(v => `<span class="chip">${v}</span>`).join('')
        + `</div>`
    : '';

  const colorsUI = Array.isArray(product.colors) && product.colors.length > 0
    ? `<div class="color-dots color-dots--selectable" id="colorSelector">
         ${product.colors.map(c => `<button class="color-dot selectable" title="${c}" data-color="${c}" style="background:${c}"></button>`).join('')}
       </div>`
    : '';

  container.innerHTML = `
    <div class="product-detail-grid">
      <section class="product-media">
        <div class="product-gallery">
          <img class="main-image" src="${primary}" alt="${product.title}" loading="lazy" decoding="async">
          <div class="thumbs">
            ${imagesArr.map((src, i) => `
              <button type="button" class="thumb ${i===0?'active':''}" data-idx="${i}" aria-label="Miniature ${i+1}">
                <img src="${src}" alt="${product.title} ${i+1}" loading="lazy" decoding="async">
              </button>
            `).join('')}
          </div>
        </div>
      </section>
      <section class="product-info">
        <h1 class="product-title">${product.title}</h1>
        <p class="product-desc">${product.description}</p>
        ${chips}
        ${colorsUI}
        <p class="product-price"><strong>${product.price} FCFA</strong></p>
        <div class="product-actions">
          <label>Quantité :
            <input type="number" id="qty-detail" min="1" value="1" style="width: 80px;">
          </label>
          <button id="addToCartBtn">Ajouter au panier</button>
          <button class="cta-secondary" id="favBtn" aria-label="Ajouter aux favoris">Favori ♥</button>
        </div>

        <div class="accordion" id="infoAccordion" style="margin-top:1rem;">
          <div class="accordion-item">
            <div class="accordion-header" data-acc="shipping">Livraison & Retours <span>▾</span></div>
            <div class="accordion-content">
              <p>Livraison standard disponible. Retours acceptés sous 7 jours si le produit est inutilisé et dans son emballage d'origine.</p>
            </div>
          </div>
          <div class="accordion-item">
            <div class="accordion-header" data-acc="sizing">Guide des tailles <span>▾</span></div>
            <div class="accordion-content">
              <p>Choisissez votre taille habituelle. En cas d'hésitation entre deux tailles/pointures, prenez la plus grande.</p>
            </div>
          </div>
          <div class="accordion-item">
            <div class="accordion-header" data-acc="details">Détails du produit <span>▾</span></div>
            <div class="accordion-content">
              <p>${product.description || ''}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  // thumbs behavior
  const mainImg = container.querySelector('.main-image');
  container.querySelectorAll('.thumbs .thumb').forEach((thumbEl) => {
    const imgEl = thumbEl.querySelector('img');
    thumbEl.addEventListener('click', () => {
      const isAlreadyActive = thumbEl.classList.contains('active');
      // Switch main image
      mainImg.src = imgEl.src;
      product.selectedImage = imgEl.src;
      // Toggle active
      container.querySelectorAll('.thumbs .thumb').forEach(e => { e.classList.remove('active'); e.classList.remove('checked'); });
      thumbEl.classList.add('active');
      // If clicking the active thumb again, mark as checked
      if (isAlreadyActive) {
        thumbEl.classList.add('checked');
      }
    });
  });

  // variant behavior
  const chipEls = container.querySelectorAll('.variant-chips .chip');
  if (chipEls.length) {
    chipEls.forEach((chip) => {
      chip.addEventListener('click', () => {
        chipEls.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        product.selectedVariant = chip.textContent.trim();
      });
    });
  }

  // color selection behavior
  const colorWrap = container.querySelector('#colorSelector');
  if (colorWrap) {
    const colorBtns = colorWrap.querySelectorAll('.color-dot.selectable');
    colorBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        colorBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        product.selectedColor = e.currentTarget.getAttribute('data-color');
      });
    });
  }

  // add to cart
  const btn = document.getElementById('addToCartBtn');
  btn.addEventListener('click', () => {
    const qty = parseInt(document.getElementById('qty-detail').value);
    if (isNaN(qty) || qty < 1) {
      alert('Veuillez entrer une quantité valide.');
      return;
    }
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const chosenImage = product.selectedImage || mainImg.src || (product.image || (Array.isArray(product.images) && product.images[0]) || '');
    cart.push({ ...product, image: chosenImage, quantity: qty, selectedVariant: product.selectedVariant || null, selectedColor: product.selectedColor || null });
    localStorage.setItem('cart', JSON.stringify(cart));

    // Animated transition: right -> left (bounce) -> center small -> expand -> navigate
    try {
      const url = './cart.html';
      const cube = document.createElement('div');
      cube.className = 'page-transition page-transition--preview page-transition--from-right';
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.setAttribute('aria-hidden', 'true');
      iframe.tabIndex = -1;
      cube.appendChild(iframe);
      document.body.appendChild(cube);

      // Force reflow before moving
      void cube.offsetWidth;
      // 1) slide to left edge
      cube.classList.add('page-transition--to-left');
      // 2) after reaching left, go to center (reuse existing center size)
      setTimeout(() => {
        cube.classList.add('page-transition--center');
        // 3) expand to full screen
        setTimeout(() => {
          cube.classList.add('page-transition--expand');
        }, 650);
      }, 700);

      const go = () => { window.location.href = url; };
      cube.addEventListener('transitionend', go, { once: true });
      // Fallback in case transitionend is missed
      setTimeout(go, 2200);
    } catch {
      window.location.href = 'cart.html';
    }
  });

  // accordions toggle
  container.querySelectorAll('.accordion-header').forEach((hdr) => {
    hdr.addEventListener('click', () => {
      const item = hdr.parentElement;
      item.classList.toggle('active');
    });
  });

  // --- Dynamic meta/OG ---
  const url = window.location.href;
  const desc = (product.description && product.description.length > 0) ? product.description : `${product.title} disponible chez Boutique KBR.`;
  document.title = `${product.title} - Boutique KBR`;
  setMetaName('description', desc);
  setMetaProp('og:type', 'product');
  setMetaProp('og:title', `${product.title} | Boutique KBR`);
  setMetaProp('og:description', desc);
  setMetaProp('og:url', url);
  setMetaProp('og:image', product.selectedImage || primary);
  setMetaName('twitter:title', `${product.title} | Boutique KBR`);
  setMetaName('twitter:description', desc);
  setMetaName('twitter:image', product.selectedImage || primary);

  // --- JSON-LD Product ---
  const currency = 'XOF';
  injectJSONLD('ld-product', {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: desc,
    image: imagesArr,
    brand: product.brand || 'Boutique KBR',
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      url
    }
  });

  // --- BreadcrumbList ---
  injectJSONLD('ld-breadcrumb', {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${window.location.origin}/client/index.html` },
      { '@type': 'ListItem', position: 2, name: product.title, item: url }
    ]
  });
}

async function init() {
  const id = getParam('productId');
  if (!id) {
    window.location.replace('./index.html');
    return;
  }
  try {
    const res = await fetch(`${baseUrl}/api/products/${encodeURIComponent(id)}?_=${Date.now()}`);
    if (!res.ok) throw new Error('Produit introuvable');
    const product = await res.json();
    if (!product || (!product.image && !Array.isArray(product.images))) {
      throw new Error('Données produit incomplètes');
    }
    renderProduct(product);
  } catch (e) {
    console.error('Erreur chargement produit:', e);
    const container = document.getElementById('productDetail');
    if (container) container.innerHTML = '<p>Impossible de charger ce produit. Veuillez réessayer plus tard.</p>';
  }
}

document.addEventListener('DOMContentLoaded', init);

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

function renderProduct(product) {
  const container = document.getElementById('productDetail');
  if (!container) return;

  const imagesArr = uniqueImages(product);
  const primary = imagesArr[0];
  const chips = Array.isArray(product.variants) && product.variants.length > 0
    ? `<div class="variant-chips" title="${product.variantType || ''}">`
        + product.variants.map(v => `<span class="chip">${v}</span>`).join('')
        + `</div>`
    : '';

  container.innerHTML = `
    <div class="product-detail-grid">
      <section class="product-media">
        <div class="product-gallery">
          <img class="main-image" src="${primary}" alt="${product.title}">
          <div class="thumbs">
            ${imagesArr.map((src, i) => `<img src="${src}" alt="${product.title} ${i+1}" class="${i===0?'active':''}" data-idx="${i}">`).join('')}
          </div>
        </div>
      </section>
      <section class="product-info">
        <h1 class="product-title">${product.title}</h1>
        <p class="product-desc">${product.description}</p>
        ${chips}
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
  container.querySelectorAll('.thumbs img').forEach((imgEl) => {
    imgEl.addEventListener('click', () => {
      mainImg.src = imgEl.src;
      container.querySelectorAll('.thumbs img').forEach(e => e.classList.remove('active'));
      imgEl.classList.add('active');
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

  // add to cart
  const btn = document.getElementById('addToCartBtn');
  btn.addEventListener('click', () => {
    const qty = parseInt(document.getElementById('qty-detail').value);
    if (isNaN(qty) || qty < 1) {
      alert('Veuillez entrer une quantité valide.');
      return;
    }
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push({ ...product, quantity: qty, selectedVariant: product.selectedVariant || null });
    localStorage.setItem('cart', JSON.stringify(cart));
    window.location.href = 'cart.html';
  });

  // accordions toggle
  container.querySelectorAll('.accordion-header').forEach((hdr) => {
    hdr.addEventListener('click', () => {
      const item = hdr.parentElement;
      item.classList.toggle('active');
    });
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

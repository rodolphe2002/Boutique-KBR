
const baseUrl = window.location.hostname === "localhost"
  ? "http://localhost:3000"
  : "https://boutique-kbr.onrender.com";


document.addEventListener('DOMContentLoaded', () => {
  renderCart();
});

function getCart() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}

function setCart(items) {
  localStorage.setItem('cart', JSON.stringify(items));
}

function renderCart() {
  const items = getCart();
  const emptyState = document.getElementById('emptyState');
  const cartGrid = document.getElementById('cartGrid');
  const cartDiv = document.getElementById('cartItems');
  const summary = document.getElementById('cartSummary');

  // If essential containers are missing, do nothing gracefully
  if (!emptyState && !cartGrid && !cartDiv && !summary) {
    return;
  }

  if (!items.length) {
    if (emptyState) emptyState.style.display = 'block';
    if (cartGrid) cartGrid.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (cartGrid) cartGrid.style.display = 'grid';

  if (!cartDiv) return; // safety
  cartDiv.classList.add('cards-mode');
  cartDiv.innerHTML = '';

  let subtotal = 0;
  items.forEach((item) => {
    const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
    subtotal += itemTotal;
  });

  // Uiverse stacked cards for up to 3 items
  const top3 = items.slice(0, 3);
  const cardsWrap = document.createElement('div');
  cardsWrap.className = 'cards';
  // set CSS vars with item images for background
  const bg1 = (top3[0] && (top3[0].image || (Array.isArray(top3[0].images) && top3[0].images[0]))) || '';
  const bg2 = (top3[1] && (top3[1].image || (Array.isArray(top3[1].images) && top3[1].images[0]))) || '';
  const bg3 = (top3[2] && (top3[2].image || (Array.isArray(top3[2].images) && top3[2].images[0]))) || '';
  if (bg1) cardsWrap.style.setProperty('--bg1', `url('${bg1}')`);
  if (bg2) cardsWrap.style.setProperty('--bg2', `url('${bg2}')`);
  if (bg3) cardsWrap.style.setProperty('--bg3', `url('${bg3}')`);

  top3.forEach((item, i) => {
    const cls = ['one','two','three'][i] || 'one';
    const idx = items.indexOf(item);
    const price = Number(item.price) || 0;
    const navigate = () => { if (item._id) window.location.href = `product.html?productId=${encodeURIComponent(item._id)}`; };
    const card = document.createElement('div');
    card.className = `card ${cls}`;
    card.innerHTML = `
      <div class="cardDetails" role="group" aria-label="Détails de l'article">
        <div class="cardDetailsHaeder">${item.title}<br><span style="font-weight:700;color:#fff;">${price} FCFA</span></div>
        <div class="cardControls">
          <input type="number" min="1" value="${item.quantity}" aria-label="Quantité" onchange="updateQty(${idx}, this.value)">
          <a class="remove-link" onclick="removeItem(${idx})">Retirer</a>
        </div>
      </div>
    `;
    card.style.cursor = 'pointer';
    const isTouch = typeof window !== 'undefined' && (window.matchMedia('(hover: none)').matches || window.matchMedia('(max-width: 768px)').matches);
    card.addEventListener('click', (e) => {
      if (e.target.closest('.cardControls')) return; // interacting with qty/remove
      if (isTouch) {
        const alreadyOpen = card.classList.contains('open');
        // Close others
        cardsWrap.querySelectorAll('.card.open').forEach(c => { if (c !== card) c.classList.remove('open'); });
        if (!alreadyOpen) { card.classList.add('open'); return; }
      }
      if (item._id) navigate();
    });
    cardsWrap.appendChild(card);
  });

  // Mount the cards layout
  cartDiv.appendChild(cardsWrap);

  const shipping = 0; // placeholder Libre
  const tax = 0;
  const total = subtotal + shipping + tax;

  if (!summary) return; // safety
  summary.innerHTML = `
    <h3>Résumé</h3>
    <div class="summary-line"><span>Sous-total</span><span>${subtotal} FCFA</span></div>
    <div class="summary-line"><span>Livraison estimée</span><span>Libre</span></div>
    <div class="summary-line"><span>Estimation de l'impôt</span><span>—</span></div>
    <div class="summary-total"><span>Total</span><span>${total} FCFA</span></div>
    <div data-tooltip="Total: ${total} FCFA" class="button checkout-cta" role="button" tabindex="0">
      <div class="button-wrapper">
        <div class="text">Aller à la caisse</div>
        <span class="icon">
          <svg viewBox="0 0 16 16" class="bi bi-cart2" fill="currentColor" height="16" width="16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5zM3.14 5l1.25 5h8.22l1.25-5H3.14zM5 13a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm9-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0z"></path>
          </svg>
        </span>
      </div>
    </div>
  `;

  // Bind CTA click/keyboard navigation
  const checkoutCta = summary.querySelector('.checkout-cta');
  if (checkoutCta) {
    const go = () => { window.location.href = './checkout.html'; };
    checkoutCta.addEventListener('click', go);
    checkoutCta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  }

  // Render recommendations from same session(s) as items in cart
  const sessionIds = Array.from(new Set(items.map(it => it.sessionId).filter(Boolean)));
  if (sessionIds.length) {
    renderRecommendationsForSessions(sessionIds, items.map(it => it._id));
  }
}

// Supprimer un article du panier
function removeItem(index) {
  const cart = getCart();
  cart.splice(index, 1);
  setCart(cart);
  renderCart();
}

// Fetch and render recommendations for one or more session IDs
async function renderRecommendationsForSessions(sessionIds, excludeIds) {
  try {
    const recoGrid = document.getElementById('recoGrid');
    if (!recoGrid) return;
    const excludeSet = new Set(excludeIds || []);

    // Fetch products for each session id in parallel
    const responses = await Promise.all(
      sessionIds.map(id => fetch(`${baseUrl}/api/products?sessionId=${encodeURIComponent(id)}&_=${Date.now()}`))
    );
    const lists = await Promise.all(responses.map(r => r.ok ? r.json() : Promise.resolve([])));
    const combined = lists.flat();

    const seen = new Set();
    const filtered = combined.filter(p => {
      if (!p || !p._id || excludeSet.has(p._id) || seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    });

    let picks = filtered.slice(0, 6);
    if (!picks.length) {
      recoGrid.innerHTML = '<p class="muted">Aucune recommandation pour le moment.</p>';
      return;
    }
    // Ensure 6 slides for consistent animation
    while (picks.length < 6 && filtered.length) picks.push(filtered[picks.length % filtered.length]);
    while (picks.length < 6) picks.push({ title: 'KBR', image: './img/Logo.jpg' });

    const slides = picks.map(p => {
      const img = (Array.isArray(p.images) && p.images[0]) || p.image || '';
      const click = p._id ? `onclick=\"location.href='product.html?productId=${encodeURIComponent(p._id)}'\"` : '';
      return `<div class="slide" style="background:url('${img}') center/cover no-repeat;" ${click} title="${p.title||''}"></div>`;
    }).join('');

    recoGrid.innerHTML = `
      <section class="gallery">
        <div class="slider">
          <div class="wrapper">
            ${slides}
          </div>
        </div>
      </section>
    `;
  } catch (e) {
    console.error('Erreur recommandations:', e);
  }
}

// Vider complètement le panier
function clearCart() {
  localStorage.removeItem('cart');
  renderCart();
}

function updateQty(index, value) {
  let qty = parseInt(value);
  if (isNaN(qty) || qty < 1) qty = 1;
  const cart = getCart();
  if (!cart[index]) return;
  cart[index].quantity = qty;
  setCart(cart);
  renderCart();
}

// Validation de la commande
async function validateOrder() {
  const name = document.getElementById('clientName').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();
  const address = document.getElementById('clientAddress').value.trim();
  const items = JSON.parse(localStorage.getItem('cart')) || [];

  if (!name || !phone || !address || items.length === 0) {
    alert("Veuillez remplir toutes les informations et ajouter au moins un produit.");
    return;
  }

  // Calcul du total
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    const response = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, address, items, total })
    });

    const data = await response.json();

if (response.ok) {
  localStorage.removeItem('cart');
  document.getElementById('orderSuccessPopup').style.display = 'flex';

  setTimeout(() => {
    window.location.href = './index.html';
  }, 5000); // redirection après 5 sec
}

  } catch (error) {
    alert("Erreur lors de la validation de la commande.");
    console.error(error);
  }
}

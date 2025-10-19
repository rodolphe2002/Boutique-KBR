
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
  cartDiv.innerHTML = '';

  let subtotal = 0;
  items.forEach((item, index) => {
    const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
    subtotal += itemTotal;

    const firstImage = item.image || (Array.isArray(item.images) && item.images[0]) || '';

    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <div class="cart-media">
        <img src="${firstImage}" alt="${item.title}">
      </div>
      <div class="cart-info">
        <h3>${item.title}</h3>
        ${item.selectedVariant ? `<p class="muted">Variante: <strong>${item.selectedVariant}</strong></p>` : ''}
        <button class="link danger" onclick="removeItem(${index})">Retirer</button>
      </div>
      <div class="cart-qty">
        <input type="number" min="1" value="${item.quantity}" onchange="updateQty(${index}, this.value)">
      </div>
      <div class="cart-price">${Number(item.price) || 0} FCFA</div>
      <div class="cart-total">${itemTotal} FCFA</div>
    `;
    cartDiv.appendChild(row);
  });

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
    <a class="checkout-btn" href="./checkout.html">Aller à la caisse</a>
  `;

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

    const picks = filtered.slice(0, 6);
    if (!picks.length) {
      recoGrid.innerHTML = '<p class="muted">Aucune recommandation pour le moment.</p>';
      return;
    }

    recoGrid.innerHTML = picks.map(p => {
      const img = (Array.isArray(p.images) && p.images[0]) || p.image || '';
      return `
        <article class="reco-card" onclick="location.href='product.html?productId=${encodeURIComponent(p._id)}'" style="cursor:pointer">
          <img src="${img}" alt="${p.title}">
          <div class="reco-info">
            <div>${p.title}</div>
            <div style="font-weight:700;">${p.price} FCFA</div>
          </div>
        </article>
      `;
    }).join('');
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

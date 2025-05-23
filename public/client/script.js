let currentProducts = []; // Stocke les produits actuellement affichés


document.addEventListener('DOMContentLoaded', () => {
  fetchSessions();
});

async function fetchSessions() {
  try {
    const res = await fetch('/api/sessions');
    const sessions = await res.json();
    const sessionTabs = document.getElementById('sessionTabs');
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

    if (sessions.length > 0) {
      fetchProducts(sessions[0]._id);
    }

  } catch (error) {
    console.error('Erreur lors du chargement des sessions :', error);
  }
}

async function fetchProducts(sessionId) {
  try {
    const res = await fetch(`/api/products?sessionId=${sessionId}`);
    const products = await res.json();
    currentProducts = products;

    const productList = document.getElementById('productList');
    productList.innerHTML = '';

    products.forEach((product, index) => {
      const card = document.createElement('div');
      card.className = 'product-card';

      card.innerHTML = `
        <img src="/uploads/${product.image}" alt="${product.title}">
        <h3>${product.title}</h3>
        <p>${product.description}</p>
        <p><strong>${product.price} FCFA</strong></p>
        <label>Quantité :
          <input type="number" id="qty-${index}" min="1" value="1" style="width: 60px;">
        </label>
        <button onclick="addToCart(${index})">Commander</button>
      `;

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

  // On ajoute la quantité choisie
  cart.push({ ...product, quantity });

  localStorage.setItem('cart', JSON.stringify(cart));
  window.location.href = 'cart.html';
}







// recherche 


// Ajoute cet écouteur après le chargement du DOM
document.getElementById('searchInput').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    const query = event.target.value.trim().toLowerCase();
    performSearch(query);
  }
});

function performSearch(query) {
  const productList = document.getElementById('productList');
  productList.innerHTML = '';

  // Filtrer currentProducts côté client
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

    card.innerHTML = `
      <img src="/uploads/${product.image}" alt="${product.title}">
      <h3>${product.title}</h3>
      <p>${product.description}</p>
      <p><strong>${product.price} FCFA</strong></p>
      <label>Quantité :
        <input type="number" id="qty-${index}" min="1" value="1" style="width: 60px;">
      </label>
      <button onclick="addToCart(${index})">Commander</button>
    `;

    productList.appendChild(card);
  });
}


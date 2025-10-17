const baseUrl = window.location.hostname === "localhost"
  ? "http://localhost:3000"
  : "https://boutique-kbr.onrender.com";

const $ = (s) => document.querySelector(s);

document.addEventListener('DOMContentLoaded', () => {
  const q = $('#q');
  const cancel = $('#cancelSearch');
  const results = $('#searchResults');
  const urlQ = new URLSearchParams(location.search).get('q') || '';

  // Focus input on load
  if (q) {
    if (urlQ) q.value = urlQ;
    q.focus();
  }

  // Cancel returns to index
  cancel?.addEventListener('click', () => {
    window.location.href = './index.html';
  });

  // Submit on Enter
  q?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch(q.value.trim());
  });

  // Live search
  q?.addEventListener('input', () => {
    const val = q.value.trim();
    if (val.length >= 2) doSearch(val);
    else results.innerHTML = '';
  });

  async function doSearch(query) {
    if (!query) { results.innerHTML = ''; return; }
    // Try backend route first
    try {
      const res = await fetch(`${baseUrl}/api/products/search?q=${encodeURIComponent(query)}&_=${Date.now()}`);
      if (res.ok) {
        const items = await res.json();
        render(items);
        return;
      }
      // If 404 or not ok, fallback to client-side
    } catch (_) {}

    try {
      const resAll = await fetch(`${baseUrl}/api/products?_=${Date.now()}`);
      const all = await resAll.json();
      const qlc = query.toLowerCase();
      const filtered = (Array.isArray(all) ? all : []).filter(p =>
        (p.title || '').toLowerCase().includes(qlc) || (p.description || '').toLowerCase().includes(qlc)
      );
      render(filtered);
    } catch (e) {
      results.innerHTML = '<p>Erreur lors de la recherche.</p>';
    }
  }

  function render(products) {
    results.innerHTML = '';
    if (!Array.isArray(products) || !products.length) {
      results.innerHTML = '<p>Aucun produit trouvé.</p>';
      return;
    }
    const frag = document.createDocumentFragment();
    products.forEach(p => {
      const img = p.image || (Array.isArray(p.images) && p.images[0]) || '';
      const el = document.createElement('article');
      el.className = 'search-card';
      el.innerHTML = `
        <img src="${img}" alt="${p.title}">
        <div class="sc-body">
          <h3>${p.title}</h3>
          <p>${p.description || ''}</p>
          <strong>${p.price} FCFA</strong>
        </div>
      `;
      el.addEventListener('click', () => {
        window.location.href = `./product.html?productId=${encodeURIComponent(p._id)}`;
      });
      frag.appendChild(el);
    });
    results.appendChild(frag);
  }
  // Run initial search if ?q=
  if (urlQ) doSearch(urlQ);
});

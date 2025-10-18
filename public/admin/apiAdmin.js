// API endpoints
// const baseUrl = 'https://boutique-kbr.onrender.com/api';

// const baseUrl = 'http://localhost:3000/api';

const baseUrl = window.location.hostname === "localhost"
  ? "http://localhost:3000/api"
  : "https://boutique-kbr.onrender.com/api";



// Simple in-memory cache for products looked up by ID (for orders rendering)
const productCache = new Map();
async function getProductById(pid) {
  if (!pid) return null;
  if (productCache.has(pid)) return productCache.get(pid);
  try {
    const res = await fetch(`${baseUrl}/products/${encodeURIComponent(pid)}`);
    if (!res.ok) throw new Error('not found');
    const p = await res.json();
    productCache.set(pid, p);
    return p;
  } catch(_) { return null; }
}

// deconnexion
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('adminToken'); // Supprime le token
  alert('Vous êtes déconnecté.');
  window.location.href = './adminLogin.html'; // Redirection vers la page login
});

// token de connexion

// Vérifie que l'admin est connecté
const token = localStorage.getItem('adminToken');
if (!token) {
  alert("Accès interdit. Veuillez vous connecter.");
  window.location.href = './adminLogin.html'; // redirection vers login
}

// ===== Notifications (new orders) helpers =====
function getSeenOrders() {
  try { return new Set(JSON.parse(localStorage.getItem('seenOrders') || '[]')); }
  catch { return new Set(); }
}
function saveSeenOrders(set) {
  try { localStorage.setItem('seenOrders', JSON.stringify(Array.from(set))); } catch {}
}
function updateNotifBadgeFromOrders(orders) {
  const badge = document.getElementById('notifBadge');
  if (!badge || !Array.isArray(orders)) return;
  const seen = getSeenOrders();
  const unseenCount = orders.reduce((acc, o) => acc + (seen.has(o._id) ? 0 : 1), 0);
  if (unseenCount > 0) {
    badge.textContent = unseenCount > 99 ? '99+' : String(unseenCount);
    badge.hidden = false;
  } else {
    badge.hidden = true;
  }
}
function markOrderSeen(id) {
  if (!id) return;
  const seen = getSeenOrders();
  if (!seen.has(id)) {
    seen.add(id);
    saveSeenOrders(seen);
  }
  // Update UI: remove highlight and update badge
  const card = document.querySelector(`.order-card[data-id="${id}"]`);
  if (card) card.classList.remove('order-new');
  // Recompute from currently rendered list
  const currentOrdersEls = Array.from(document.querySelectorAll('#orderList .order-card'));
  const ordersIds = currentOrdersEls.map(el => ({ _id: el.getAttribute('data-id') }));
  updateNotifBadgeFromOrders(ordersIds);
}

async function showSection(id) {
  document.querySelectorAll('.admin-section').forEach(section => section.style.display = 'none');
  const sectionToShow = document.getElementById(id);
  if (sectionToShow) {
    sectionToShow.style.display = 'block';

    // Active state for tabs
    document.querySelectorAll('.admin-tabs button').forEach(btn => {
      if (btn.getAttribute('data-section') === id) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // Home dashboard: show stats
    if (id === 'dashboard-home') {
      const statsEl = document.getElementById('stats');
      if (statsEl) statsEl.style.display = 'block';
      loadStats();
    }

    // Orders: only orders list
    if (id === 'orders') {
      await loadOrders();
    }
    // Manage products list
    if (id === 'manage-products') {
      try { await loadProductManagement(); } catch(_) {}
    }

    // Reset viewport to top (prevents initial hidden bottom bar on mobile)
    try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch(_) { window.scrollTo(0,0); }
    if (id === 'orders' || id === 'manage-products' || id === 'create-product') {
      setTimeout(() => { try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch(_) { window.scrollTo(0,0); } }, 0);
    }
  }
}

async function createSession() {
  const token = localStorage.getItem('adminToken');
  const name = document.getElementById('sessionName').value.trim();
  const imageInput = document.getElementById('sessionImage');
  const image = imageInput && imageInput.files[0] ? imageInput.files[0] : null;
  if (!name) {
    alert('Veuillez entrer un nom de session.');
    return;
  }

  const formData = new FormData();
  formData.append('name', name);
  if (image) formData.append('image', image);

  try {
    const btn = document.getElementById('createSessionBtn');
    if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }
    const res = await fetch(`${baseUrl}/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) throw new Error('Erreur lors de la création de la session.');
    const data = await res.json();
    document.getElementById('sessionMessage').innerText = `Session ajoutée : ${data.name}`;
    loadSessions();
    document.getElementById('sessionName').value = '';
    if (imageInput) imageInput.value = '';
  } catch (error) {
    alert(error.message);
  } finally {
    const btn = document.getElementById('createSessionBtn');
    if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
  }
}

async function loadSessions() {
  const token = localStorage.getItem('adminToken');
  try {
    const res = await fetch(`${baseUrl}/sessions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Erreur chargement sessions.');
    const sessions = await res.json();
    const select = document.getElementById('sessionSelect');
    select.innerHTML = '';
    sessions.forEach(session => {
      const option = document.createElement('option');
      option.value = session._id;
      option.innerText = session.name;
      select.appendChild(option);
    });
  } catch (error) {
    alert(error.message);
  }
}

let isAddingProduct = false;

// Optional product colors state and UI helpers
let selectedColors = [];
function renderSelectedColors() {
  const wrap = document.getElementById('colorList');
  if (!wrap) return;
  wrap.innerHTML = '';
  selectedColors.forEach((c, idx) => {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = '6px';
    item.innerHTML = `
      <span style="display:inline-block;width:18px;height:18px;border-radius:50%;border:1px solid rgba(0,0,0,.2);background:${c}"></span>
      <button type="button" data-idx="${idx}">Supprimer</button>
    `;
    item.querySelector('button').addEventListener('click', (e) => {
      const i = parseInt(e.currentTarget.getAttribute('data-idx'));
      selectedColors.splice(i, 1);
      renderSelectedColors();
    });
    wrap.appendChild(item);
  });
}

let editProductId = null;
let editColors = [];
let productFilesSelected = [];
let editFilesSelected = [];
let sessionCreateFileSelected = null;
let editSessionId = null;
let editSessionFileSelected = null;

function renderFilePreviews(containerId, files, onDelete) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  files.forEach((file, idx) => {
    const card = document.createElement('div');
    card.className = 'img-card';
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Suppr';
    btn.addEventListener('click', () => {
      onDelete(idx);
    });
    card.appendChild(img);
    card.appendChild(btn);
    container.appendChild(card);
  });
}
function renderEditColors() {
  const wrap = document.getElementById('editColorList');
  if (!wrap) return;
  wrap.innerHTML = '';
  editColors.forEach((c, idx) => {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = '6px';
    item.innerHTML = `
      <span style="display:inline-block;width:18px;height:18px;border-radius:50%;border:1px solid rgba(0,0,0,.2);background:${c}"></span>
      <button type="button" data-idx="${idx}">Supprimer</button>
    `;
    item.querySelector('button').addEventListener('click', (e) => {
      const i = parseInt(e.currentTarget.getAttribute('data-idx'));
      editColors.splice(i, 1);
      renderEditColors();
    });
    wrap.appendChild(item);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const addColorBtn = document.getElementById('addColorBtn');
  const colorPicker = document.getElementById('colorPicker');
  if (addColorBtn && colorPicker) {
    addColorBtn.addEventListener('click', () => {
      const val = (colorPicker.value || '').trim();
      if (!val) return;
      if (!selectedColors.includes(val)) selectedColors.push(val);
      renderSelectedColors();
    });
  }
  const productInput = document.getElementById('productImages');
  if (productInput) {
    productInput.addEventListener('change', () => {
      const files = Array.from(productInput.files || []);
      productFilesSelected = files.slice(0, 10);
      renderFilePreviews('productImagePreview', productFilesSelected, (idx) => {
        productFilesSelected.splice(idx, 1);
        renderFilePreviews('productImagePreview', productFilesSelected, arguments.callee);
      });
    });
  }
  // Session create image preview
  const sessionCreateInput = document.getElementById('sessionImage');
  if (sessionCreateInput) {
    const renderSessionCreatePreview = () => {
      const cont = document.getElementById('sessionCreateImagePreview');
      if (!cont) return;
      cont.innerHTML = '';
      if (!sessionCreateFileSelected) return;
      const card = document.createElement('div');
      card.className = 'img-card';
      const img = document.createElement('img');
      img.src = URL.createObjectURL(sessionCreateFileSelected);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Suppr';
      btn.addEventListener('click', () => {
        sessionCreateFileSelected = null;
        sessionCreateInput.value = '';
        renderSessionCreatePreview();
      });
      card.appendChild(img);
      card.appendChild(btn);
      cont.appendChild(card);
    };
    sessionCreateInput.addEventListener('change', () => {
      const f = (sessionCreateInput.files && sessionCreateInput.files[0]) || null;
      sessionCreateFileSelected = f;
      renderSessionCreatePreview();
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const addEditColorBtn = document.getElementById('addEditColorBtn');
  const editColorPicker = document.getElementById('editColorPicker');
  if (addEditColorBtn && editColorPicker) {
    addEditColorBtn.addEventListener('click', () => {
      const val = (editColorPicker.value || '').trim();
      if (!val) return;
      if (!editColors.includes(val)) editColors.push(val);
      renderEditColors();
    });
  }
  const closeBtn = document.getElementById('closeEditModal');
  const modal = document.getElementById('editProductModal');
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
  }
  const editInput = document.getElementById('editProductImages');
  if (editInput) {
    const rerenderEditPreview = () => {
      renderFilePreviews('editImagePreview', editFilesSelected, (idx) => {
        editFilesSelected.splice(idx, 1);
        rerenderEditPreview();
      });
    };
    editInput.addEventListener('change', () => {
      const files = Array.from(editInput.files || []);
      editFilesSelected = files.slice(0, 10);
      rerenderEditPreview();
    });
  }
  // Session edit modal wiring
  const closeSessionBtn = document.getElementById('closeEditSessionModal');
  const sessionModal = document.getElementById('editSessionModal');
  if (closeSessionBtn && sessionModal) {
    closeSessionBtn.addEventListener('click', () => { sessionModal.style.display = 'none'; });
    sessionModal.addEventListener('click', (e) => { if (e.target === sessionModal) sessionModal.style.display = 'none'; });
  }
  const editSessionInput = document.getElementById('editSessionImage');
  if (editSessionInput) {
    const renderEditSessionPreview = () => {
      const cont = document.getElementById('editSessionImagePreview');
      if (!cont) return;
      cont.innerHTML = '';
      if (!editSessionFileSelected) return;
      const card = document.createElement('div');
      card.className = 'img-card';
      const img = document.createElement('img');
      img.src = URL.createObjectURL(editSessionFileSelected);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Suppr';
      btn.addEventListener('click', () => {
        editSessionFileSelected = null;
        editSessionInput.value = '';
        renderEditSessionPreview();
      });
      card.appendChild(img);
      card.appendChild(btn);
      cont.appendChild(card);
    };
    editSessionInput.addEventListener('change', () => {
      editSessionFileSelected = (editSessionInput.files && editSessionInput.files[0]) || null;
      renderEditSessionPreview();
    });
  }
  const saveBtn = document.getElementById('saveEditProductBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (!editProductId) return;
      const token = localStorage.getItem('adminToken');
      const title = (document.getElementById('editProductTitle')?.value || '').trim();
      const price = (document.getElementById('editProductPrice')?.value || '').trim();
      const description = (document.getElementById('editProductDescription')?.value || '').trim();
      const variantType = document.getElementById('editVariantType')?.value || 'none';
      const variantsRaw = (document.getElementById('editVariantValues')?.value || '').trim();
      const variants = variantsRaw ? variantsRaw.split(',').map(v=>v.trim()).filter(Boolean) : [];
      const files = editFilesSelected || [];
      const replaceAllImages = !!document.getElementById('replaceAllImages')?.checked;
      const formData = new FormData();
      if (title) formData.append('title', title);
      if (price) formData.append('price', price);
      if (description) formData.append('description', description);
      formData.append('variantType', variantType);
      formData.append('variants', JSON.stringify(variants));
      formData.append('colors', JSON.stringify(editColors || []));
      if (files.length) {
        formData.append('image', files[0]);
        files.forEach(f => formData.append('images', f));
      }
      formData.append('replaceAllImages', String(replaceAllImages));
      const originalText = saveBtn.textContent;
      saveBtn.disabled = true;
      saveBtn.classList.add('btn-loading');
      saveBtn.textContent = 'Enregistrement...';
      try {
        const res = await fetch(`${baseUrl}/products/${editProductId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (!res.ok) throw new Error('Erreur modification produit');
        document.getElementById('editProductModal').style.display = 'none';
        loadProductManagement();
      } catch (err) {
        alert(err.message);
      } finally {
        saveBtn.disabled = false;
        saveBtn.classList.remove('btn-loading');
        saveBtn.textContent = originalText;
      }
    });
  }
});

async function openEditProductById(id) {
  const token = localStorage.getItem('adminToken');
  try {
    const res = await fetch(`${baseUrl}/products/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error('Produit introuvable');
    const p = await res.json();
    openEditProduct(p);
  } catch (_) {}
}

function openEditProduct(product) {
  editProductId = product._id;
  const modal = document.getElementById('editProductModal');
  if (!modal) return;
  const t = document.getElementById('editProductTitle');
  const pr = document.getElementById('editProductPrice');
  const d = document.getElementById('editProductDescription');
  const vt = document.getElementById('editVariantType');
  const vv = document.getElementById('editVariantValues');
  if (t) t.value = product.title || '';
  if (pr) pr.value = product.price != null ? product.price : '';
  if (d) d.value = product.description || '';
  if (vt) vt.value = product.variantType || 'none';
  if (vv) vv.value = Array.isArray(product.variants) ? product.variants.join(',') : '';
  editColors = Array.isArray(product.colors) ? [...product.colors] : [];
  renderEditColors();
  const filesInput = document.getElementById('editProductImages');
  if (filesInput) filesInput.value = '';
  editFilesSelected = [];
  renderFilePreviews('editImagePreview', editFilesSelected, () => {});
  const replaceChk = document.getElementById('replaceAllImages');
  if (replaceChk) replaceChk.checked = false;
  modal.style.display = 'flex';
}

async function addProduct() {
  if (isAddingProduct) return; // guard against double-clicks / duplicate requests
  isAddingProduct = true;
  const addBtn = document.getElementById('addProductBtn');
  if (addBtn) {
    addBtn.disabled = true;
    addBtn.textContent = 'Ajout en cours...';
  }
  const token = localStorage.getItem('adminToken');
  const title = document.getElementById('productTitle').value.trim();
  const description = document.getElementById('productDescription').value.trim();
  const price = document.getElementById('productPrice').value.trim();
  const sessionId = document.getElementById('sessionSelect').value;
  const imagesInput = document.getElementById('productImages');
  const files = productFilesSelected || [];

  // Variants
  const variantTypeEl = document.getElementById('variantType');
  const variantValuesEl = document.getElementById('variantValues');
  const variantType = variantTypeEl ? variantTypeEl.value : 'none';
  const variantValuesRaw = (variantValuesEl ? variantValuesEl.value : '').trim();
  const variants = variantValuesRaw
    ? variantValuesRaw.split(',').map(v => v.trim()).filter(Boolean)
    : [];

  if (!title || !description || !price || !sessionId || files.length === 0) {
    alert('Veuillez remplir tous les champs et ajouter au moins une image.');
    isAddingProduct = false;
    if (addBtn) { addBtn.classList.remove('btn-loading'); addBtn.disabled = false; addBtn.textContent = 'Ajouter'; }
    return;
  }
  if (files.length > 10) {
    alert('Vous pouvez ajouter jusqu\'à 10 images maximum.');
    isAddingProduct = false;
    if (addBtn) { addBtn.classList.remove('btn-loading'); addBtn.disabled = false; addBtn.textContent = 'Ajouter'; }
    return;
  }

  const formData = new FormData();
  // Generate idempotency key for this request
  const clientRequestId = `prod_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;
  formData.append('title', title);
  formData.append('description', description);
  formData.append('price', price);
  formData.append('sessionId', sessionId);
  formData.append('clientRequestId', clientRequestId);
  // Send only the first image as 'image' (compatible with current backend)
  formData.append('image', files[0]);
  // Send gallery images (backend now supports 'images')
  files.forEach((f) => formData.append('images', f));
  // New: variants
  formData.append('variantType', variantType);
  formData.append('variants', JSON.stringify(variants));
  // New: optional colors
  formData.append('colors', JSON.stringify(selectedColors || []));

  try {
    if (addBtn) { addBtn.classList.add('btn-loading'); }
    const res = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    if (!res.ok) throw new Error('Erreur ajout produit.');
    const data = await res.json();
    document.getElementById('productMessage').innerText = `Produit ajouté : ${data.title}`;
    document.getElementById('productTitle').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productPrice').value = '';
    if (imagesInput) imagesInput.value = '';
    productFilesSelected = [];
    renderFilePreviews('productImagePreview', productFilesSelected, () => {});
    if (variantTypeEl) variantTypeEl.value = 'none';
    if (variantValuesEl) variantValuesEl.value = '';
    // reset colors
    selectedColors = [];
    renderSelectedColors();
  } catch (error) {
    alert(error.message);
  } finally {
    isAddingProduct = false;
    if (addBtn) {
      addBtn.disabled = false;
      addBtn.textContent = 'Ajouter';
      addBtn.classList.remove('btn-loading');
    }
  }
}
async function loadOrders() {
  const token = localStorage.getItem('adminToken');
  try {
    const res = await fetch(`${baseUrl}/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Erreur chargement commandes.');
    const orders = await res.json();

    const orderList = document.getElementById('orderList');
    orderList.innerHTML = '';

    if (orders.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'order-card';
      empty.textContent = 'Aucune commande pour le moment.';
      orderList.appendChild(empty);
      return;
    }

    // Prefetch product details for items missing image
    const idsToFetch = new Set();
    orders.forEach(o => {
      (o.items || []).forEach(it => {
        const hasImg = it && (it.image || (Array.isArray(it.images) && it.images[0]));
        const pid = it && (it.productId || it.product || it.productID || it.product_id);
        if (!hasImg && pid && !productCache.has(pid)) idsToFetch.add(pid);
      });
    });
    for (const pid of idsToFetch) { await getProductById(pid); }

    const seen = getSeenOrders();
    orders.forEach(order => {
      const card = document.createElement('li');
      card.className = 'order-card';
      card.setAttribute('data-id', order._id);
      if (!seen.has(order._id)) card.classList.add('order-new');
      const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString() : '';
      card.innerHTML = `
        <div class="order-header">
          <div>
            <div class="order-id">Commande #${order._id}</div>
            <div class="order-meta">
              <span>${order.name || ''}</span>
              <span>•</span>
              <span>${order.phone || ''}</span>
              <span>•</span>
              <span>${order.address || ''}</span>
              <span>•</span>
              <span>${createdAt}</span>
            </div>
          </div>
          <div class="order-actions">
            <select data-id="${order._id}" onchange="updateOrderStatus(this)">
              <option value="En attente" ${order.status === 'En attente' ? 'selected' : ''}>En attente</option>
              <option value="Livrée" ${order.status === 'Livrée' ? 'selected' : ''}>Livrée</option>
              <option value="Annulée" ${order.status === 'Annulée' ? 'selected' : ''}>Annulée</option>
            </select>
            <button class="mark-seen" onclick="markOrderSeen('${order._id}')" title="Marquer comme vu"><i class="fa-regular fa-eye"></i></button>
            <button onclick="deleteOrder('${order._id}')" title="Supprimer">Supprimer</button>
          </div>
        </div>
        <div class="order-items">
          ${Array.isArray(order.items) ? order.items.map(item => {
            const images = Array.isArray(item.images) ? item.images : [];
            let img = item.image || images[0] || '';
            if (!img) {
              const pid = item && (item.productId || item.product || item.productID || item.product_id);
              const p = pid ? productCache.get(pid) : null;
              img = p && (p.image || (Array.isArray(p.images) && p.images[0])) || '';
            }
            const variant = item.selectedVariant || item.variant || null;
            const color = item.selectedColor || null;
            const colorDot = color ? `<span class=\"color-dot\" style=\"background:${color}\"></span>` : '';
            const variantChip = variant ? `<span class=\"chip\">${variant}</span>` : '';
            return `
              <div class=\"order-item\">
                <img src=\"${img}\" alt=\"${item.title}\" />
                <div>
                  <div class=\"order-item-title\">${item.title}</div>
                  <div class=\"order-item-sub\">
                    ${variantChip}
                    ${color ? `<span>${colorDot}</span>` : ''}
                    <span class=\"chip\">x${item.quantity}</span>
                    <span class=\"chip\">${item.price} FCFA</span>
                  </div>
                </div>
                <div style=\"font-weight:800;color:#111;\">${(item.price || 0) * (item.quantity || 0)} FCFA</div>
              </div>
            `;
          }).join('') : ''}
        </div>
      `;
      orderList.appendChild(card);
    });

    // Update notification badge with unseen orders count
    updateNotifBadgeFromOrders(orders);
  } catch (error) {
    alert(error.message);
  }
}

// Fonction pour supprimer une commande
async function deleteOrder(orderId) {
  const confirmation = confirm("Voulez-vous vraiment supprimer cette commande ?");
  if (!confirmation) return;

  const token = localStorage.getItem('adminToken');
  try {
    const res = await fetch(`${baseUrl}/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error("Échec de la suppression de la commande.");
    alert("Commande supprimée avec succès.");
    loadOrders(); // Recharger la liste et recalculer le badge
  } catch (error) {
    alert(error.message);
  }
}

async function updateOrderStatus(selectElement) {
  const token = localStorage.getItem('adminToken');
  const orderId = selectElement.getAttribute('data-id');
  const newStatus = selectElement.value;

  try {
    const res = await fetch(`${baseUrl}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!res.ok) throw new Error('Erreur lors de la mise à jour du statut.');
    alert('Statut mis à jour.');
  } catch (error) {
    alert(error.message);
  }
}

async function loadStats() {
  const token = localStorage.getItem('adminToken');
  try {
    const res = await fetch(`${baseUrl}/orders/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('adminToken');
        alert('Session expirée. Veuillez vous reconnecter.');
        window.location.href = './adminLogin.html';
        return;
      }
      throw new Error("Erreur lors du chargement des statistiques.");
    }

    const stats = await res.json();
    // Legacy text fields (if present)
    if (document.getElementById('totalOrders')) document.getElementById('totalOrders').innerText = stats.totalOrders;
    if (document.getElementById('deliveredOrders')) document.getElementById('deliveredOrders').innerText = stats.deliveredOrders;
    if (document.getElementById('cancelledOrders')) document.getElementById('cancelledOrders').innerText = stats.cancelledOrders;
    if (document.getElementById('totalSales')) document.getElementById('totalSales').innerText = `${stats.totalSales} FCFA`;

    // KPI cards
    if (document.getElementById('kpiTotalOrders')) document.getElementById('kpiTotalOrders').innerText = stats.totalOrders;
    if (document.getElementById('kpiDelivered')) document.getElementById('kpiDelivered').innerText = stats.deliveredOrders;
    if (document.getElementById('kpiCancelled')) document.getElementById('kpiCancelled').innerText = stats.cancelledOrders;
    if (document.getElementById('kpiTotalSales')) document.getElementById('kpiTotalSales').innerText = `${stats.totalSales} FCFA`;

    const monthly = Array.isArray(stats.monthlyStats) ? stats.monthlyStats : [];
    const monthlyLabels = monthly.length ? monthly.map(s => s.month || s.label || '') : ['Jan','Feb','Mar','Apr','May','Jun'];
    const monthlyData = monthly.length ? monthly.map(s => (s.totalSales ?? s.sales ?? 0)) : [0,0,0,0,0,0];
    const ctx = document.getElementById('productsChart') && document.getElementById('productsChart').getContext('2d');

    if (ctx) {
      if (window.productsChartInstance) {
        window.productsChartInstance.destroy();
      }

      window.productsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: monthlyLabels,
          datasets: [{
            label: 'Ventes mensuelles (FCFA)',
            data: monthlyData,
            backgroundColor: 'rgba(17,17,17,0.75)'
          }]
        },
        options: {
          scales: { y: { beginAtZero: true } },
          plugins: { legend: { display: false } }
        }
      });
    }

    // Status distribution chart (pie/doughnut)
    const statusCtxEl = document.getElementById('statusChart');
    if (statusCtxEl) {
      const statusCtx = statusCtxEl.getContext('2d');
      if (window.statusChartInstance) window.statusChartInstance.destroy();
      const values = [stats.deliveredOrders, stats.cancelledOrders, Math.max(stats.totalOrders - stats.deliveredOrders - stats.cancelledOrders, 0)];
      window.statusChartInstance = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: ['Livrées', 'Annulées', 'En attente'],
          datasets: [{
            data: values,
            backgroundColor: ['#16a34a', '#ef4444', '#9ca3af']
          }]
        },
        options: { plugins: { legend: { position: 'bottom' } }, cutout: '60%' }
      });
    }

    // Mini KPI charts (simple sparklines)
    const mk = (id, data, color='#111') => {
      const el = document.getElementById(id);
      if (!el) return;
      const ctx = el.getContext('2d');
      if (el._instance) { el._instance.destroy(); }
      el._instance = new Chart(ctx, {
        type: 'line',
        data: { labels: data.map((_,i)=>i+1), datasets: [{ data, borderColor: color, fill: false, tension: 0.3, pointRadius: 0 }] },
        options: { plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
      });
    };

    // Use monthly totals as basis for sparklines; fallback to simple array
    const fallback = (n) => Array.from({length: Math.max(n, 6)}, ()=> Math.floor(Math.random()*10)+1);
    const arrOrders = monthly.length ? monthly.map(s=> (s.orders ?? s.totalOrders ?? s.count ?? 0)) : fallback(6);
    const arrDelivered = monthly.length ? monthly.map(s=> (s.delivered ?? s.deliveredOrders ?? 0)) : fallback(6);
    const arrCancelled = monthly.length ? monthly.map(s=> (s.cancelled ?? s.cancelledOrders ?? 0)) : fallback(6);
    mk('miniChartTotal', arrOrders);
    mk('miniChartDelivered', arrDelivered, '#16a34a');
    mk('miniChartCancelled', arrCancelled, '#ef4444');
    mk('miniChartSales', monthlyData?.length ? monthlyData : fallback(6));

  } catch (error) {
    alert(error.message);
  }
}

loadSessions(); // Initialisation
// Show dashboard by default (renders stats & charts)
try { showSection('dashboard-home'); } catch(_) {}

// Charger les sessions avec options de suppression/modification

async function loadSessionManagement() {
  const token = localStorage.getItem('adminToken');
  try {
    const res = await fetch(`${baseUrl}/sessions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const sessions = await res.json();

    const sessionList = document.getElementById('sessionList');
    sessionList.className = 'mgmt-list';
    sessionList.innerHTML = '';
    sessions.forEach(session => {
      const li = document.createElement('li');
      li.className = 'mgmt-card';
      const img = session.image || '';
      li.innerHTML = `
        <div class="mgmt-main">
          ${img ? `<img class="mgmt-thumb" src="${img}" alt="${session.name}" />` : `<div class="mgmt-thumb" style="display:flex;align-items:center;justify-content:center;color:#6b7280;font-weight:700;">S</div>`}
          <div class="mgmt-title"><div class="mgmt-name">${session.name}</div></div>
        </div>
        <div class="mgmt-side">
          <button class="btn-neutral" onclick="openEditSessionById('${session._id}')">Modifier</button>
          <button class="btn-ghost" onclick="deleteSession('${session._id}')">Supprimer</button>
        </div>
      `;
      sessionList.appendChild(li);
    });
  } catch (err) {
    alert('Erreur chargement sessions à gérer');
  }
}



// supprimer une session
async function deleteSession(id) {
  const token = localStorage.getItem('adminToken');
  if (!confirm('Supprimer cette session ?')) return;

  try {
    const res = await fetch(`${baseUrl}/sessions/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Échec suppression');
    alert('Session supprimée');
    loadSessionManagement();
    loadSessions(); // recharge dropdown
  } catch (err) {
    alert(err.message);
  }
}


// Modifier une session
function openEditSession(session) {
  editSessionId = session._id;
  const modal = document.getElementById('editSessionModal');
  if (!modal) return;
  const n = document.getElementById('editSessionName');
  if (n) n.value = session.name || '';
  const input = document.getElementById('editSessionImage');
  if (input) input.value = '';
  editSessionFileSelected = null;
  const cont = document.getElementById('editSessionImagePreview');
  if (cont) cont.innerHTML = '';
  modal.style.display = 'flex';
}

async function openEditSessionById(id) {
  const token = localStorage.getItem('adminToken');
  try {
    const res = await fetch(`${baseUrl}/sessions`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error('Erreur chargement sessions');
    const sessions = await res.json();
    const session = sessions.find(s => s._id === id);
    if (session) openEditSession(session);
  } catch (_) {}
}

document.addEventListener('DOMContentLoaded', () => {
  const saveEditSessionBtn = document.getElementById('saveEditSessionBtn');
  if (saveEditSessionBtn) {
    saveEditSessionBtn.addEventListener('click', async () => {
      if (!editSessionId) return;
      const token = localStorage.getItem('adminToken');
      const name = (document.getElementById('editSessionName')?.value || '').trim();
      if (!name) { alert('Nom invalide'); return; }
      const formData = new FormData();
      formData.append('name', name);
      if (editSessionFileSelected) formData.append('image', editSessionFileSelected);
      const originalText = saveEditSessionBtn.textContent;
      saveEditSessionBtn.disabled = true;
      saveEditSessionBtn.classList.add('btn-loading');
      saveEditSessionBtn.textContent = 'Enregistrement...';
      try {
        const res = await fetch(`${baseUrl}/sessions/${editSessionId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (!res.ok) throw new Error('Erreur modification');
        document.getElementById('editSessionModal').style.display = 'none';
        loadSessionManagement();
        loadSessions();
      } catch (err) { alert(err.message); }
      finally {
        saveEditSessionBtn.disabled = false;
        saveEditSessionBtn.classList.remove('btn-loading');
        saveEditSessionBtn.textContent = originalText;
      }
    });
  }
});








//Charger les produits avec options de suppression/modification




async function loadProductManagement() {
  const token = localStorage.getItem('adminToken');
  try {
    const res = await fetch(`${baseUrl}/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const products = await res.json();

    const productList = document.getElementById('productList');
    productList.className = 'mgmt-list';
    productList.innerHTML = '';

    products.forEach(product => {
      const li = document.createElement('li');
      li.className = 'mgmt-card';
      const img = product.image || (Array.isArray(product.images) && product.images[0]) || '';
      li.innerHTML = `
        <div class="mgmt-main">
          <img class="mgmt-thumb" src="${img}" alt="${product.title}" />
          <div class="mgmt-title"><div class="mgmt-name">${product.title}</div></div>
        </div>
        <div class="mgmt-side">
          <button class="btn-neutral" onclick="openEditProductById('${product._id}')">Modifier</button>
          <button class="btn-ghost" onclick="deleteProduct('${product._id}')">Supprimer</button>
        </div>
      `;
      productList.appendChild(li);
    });
  } catch (err) {
    alert('Erreur chargement produits à gérer');
  }
}


// supprimer un produit

async function deleteProduct(id) {
  const token = localStorage.getItem('adminToken');
  if (!confirm('Supprimer ce produit ?')) return;

  try {
    const res = await fetch(`${baseUrl}/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Échec suppression');
    alert('Produit supprimé');
    loadProductManagement();
  } catch (err) {
    alert(err.message);
  }
}


// Modifier un produit

async function updateProduct(id) {
  const token = localStorage.getItem('adminToken');
  const title = document.getElementById(`edit-title-${id}`).value.trim();
  const price = document.getElementById(`edit-price-${id}`).value.trim();

  if (!title || !price) {
    alert("Champs invalides");
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, price })
    });

    if (!res.ok) throw new Error("Erreur modification produit");
    alert("Produit modifié");
    loadProductManagement();
  } catch (err) {
    alert(err.message);
  }
}






//  Charger automatiquement selon la section affichée


function showSection(id) {
  document.querySelectorAll('.admin-section').forEach(section => section.style.display = 'none');
  const sectionToShow = document.getElementById(id);
  if (sectionToShow) {
    sectionToShow.style.display = 'block';

    // Home dashboard: show stats and load charts
    if (id === 'dashboard-home') {
      if (document.getElementById('stats')) {
        document.getElementById('stats').style.display = 'block';
      }
      loadStats();
    }

    // Orders: only load orders list (stats now live in 'dashboard-home')
    if (id === 'orders') {
      loadOrders();
    }

    if (id === 'manage-sessions') {
      loadSessionManagement();
    }

    if (id === 'manage-products') {
      loadProductManagement();
    }
  }
}
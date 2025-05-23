// API endpoints
const baseUrl = 'https://boutique-kbr.onrender.com/api';

// const baseUrl = 'http://localhost:3000/api';

function showSection(id) {
  document.querySelectorAll('.admin-section').forEach(section => section.style.display = 'none');
  const sectionToShow = document.getElementById(id);
  if (sectionToShow) {
    sectionToShow.style.display = 'block';
    if (id === 'orders') {
      loadOrders();
      loadStats();
      // Afficher aussi la section statistiques
      document.getElementById('stats').style.display = 'block';
    } else {
      // Cacher la section statistiques si on n’est pas sur les commandes
      if(document.getElementById('stats')) {
        document.getElementById('stats').style.display = 'none';
      }
    }
  }
}


async function createSession() {
  const name = document.getElementById('sessionName').value.trim();
  if (!name) {
    alert('Veuillez entrer un nom de session.');
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (!res.ok) throw new Error('Erreur lors de la création de la session.');

    const data = await res.json();
    document.getElementById('sessionMessage').innerText = `Session ajoutée : ${data.name}`;
    loadSessions(); // Recharge la liste dans select
    document.getElementById('sessionName').value = ''; // reset input
  } catch (error) {
    alert(error.message);
  }
}

async function loadSessions() {
  try {
    const res = await fetch(`${baseUrl}/sessions`);
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

async function addProduct() {
  const title = document.getElementById('productTitle').value.trim();
  const description = document.getElementById('productDescription').value.trim();
  const price = document.getElementById('productPrice').value.trim();
  const sessionId = document.getElementById('sessionSelect').value;
  const imageInput = document.getElementById('productImage');
  const image = imageInput.files[0];

  if (!title || !description || !price || !sessionId || !image) {
    alert('Veuillez remplir tous les champs et choisir une image.');
    return;
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('price', price);
  formData.append('sessionId', sessionId);
  formData.append('image', image);

  try {
    const res = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Erreur ajout produit.');

    const data = await res.json();
    document.getElementById('productMessage').innerText = `Produit ajouté : ${data.title}`;
    // reset form fields if needed
    document.getElementById('productTitle').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productPrice').value = '';
    imageInput.value = '';
  } catch (error) {
    alert(error.message);
  }
}

loadSessions(); // Initialisation

// affichage des informations de commande avec statut
async function loadOrders() {
  try {
    const res = await fetch(`${baseUrl}/orders`);
    if (!res.ok) throw new Error('Erreur chargement commandes.');
    const orders = await res.json();

    const orderList = document.getElementById('orderList');
    orderList.innerHTML = '';

    if (orders.length === 0) {
      orderList.innerHTML = '<li>Aucune commande pour le moment.</li>';
      return;
    }

    orders.forEach(order => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>Commande #${order._id}</strong><br>
        Nom : ${order.name}<br>
        Téléphone : ${order.phone}<br>
        Adresse : ${order.address}<br>
        Total : ${order.total} FCFA<br>
        Statut :
        <select data-id="${order._id}" onchange="updateOrderStatus(this)">
          <option value="En attente" ${order.status === 'En attente' ? 'selected' : ''}>En attente</option>
          <option value="Livrée" ${order.status === 'Livrée' ? 'selected' : ''}>Livrée</option>
          <option value="Annulée" ${order.status === 'Annulée' ? 'selected' : ''}>Annulée</option>
        </select>
        <br>
        Produits :
        <ul>
          ${order.items.map(item => `<li>${item.title} x${item.quantity} - ${item.price} FCFA</li>`).join('')}
        </ul>
        Date : ${new Date(order.createdAt).toLocaleString()}
        <hr>
      `;
      orderList.appendChild(li);
    });
  } catch (error) {
    alert(error.message);
  }
}

// mise à jour du statut de commande
async function updateOrderStatus(selectElement) {
  const orderId = selectElement.getAttribute('data-id');
  const newStatus = selectElement.value;

  try {
    const res = await fetch(`${baseUrl}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (!res.ok) throw new Error('Erreur lors de la mise à jour du statut.');

    alert('Statut mis à jour.');
  } catch (error) {
    alert(error.message);
  }
}




// calcul statistique 



async function loadStats() {
  try {
    const res = await fetch(`${baseUrl}/orders/stats`);
    if (!res.ok) {
      throw new Error("Erreur lors du chargement des statistiques.");
    }

    const stats = await res.json();

    // Statistiques globales
    document.getElementById('totalOrders').innerText = stats.totalOrders;
    document.getElementById('deliveredOrders').innerText = stats.deliveredOrders;
    document.getElementById('cancelledOrders').innerText = stats.cancelledOrders;
    document.getElementById('totalSales').innerText = `${stats.totalSales} FCFA`; // total ventes

    // Statistiques mensuelles (par exemple ventes par mois)
    const monthlyLabels = stats.monthlyStats.map(s => s.month); // Format attendu : "Janvier", "Février", ...
    const monthlyData = stats.monthlyStats.map(s => s.totalSales); // Ventes par mois

    const ctx = document.getElementById('productsChart').getContext('2d');

    // Détruire l'ancienne instance si elle existe
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
          backgroundColor: 'rgba(75, 192, 192, 0.7)'
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true }
        }
      }
    });

  } catch (error) {
    alert(error.message);
  }
}


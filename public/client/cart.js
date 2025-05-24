document.addEventListener('DOMContentLoaded', () => {
  const items = JSON.parse(localStorage.getItem('cart')) || [];
  const cartDiv = document.getElementById('cartItems');
  const totalDiv = document.getElementById('cartTotal');

  if (items.length === 0) {
    cartDiv.innerHTML = '<p>Votre panier est vide.</p>';
    totalDiv.innerHTML = '';
    return;
  }

  let total = 0;

  items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <h3>${item.title}</h3>
      <img src="/uploads/${item.image}" alt="${item.title}" style="max-width:100px">
      <p>${item.description}</p>
      <p><strong>Prix unitaire :</strong> ${item.price} FCFA</p>
      <p><strong>Quantité :</strong> ${item.quantity}</p>
      <p><strong>Total :</strong> ${itemTotal} FCFA</p>
      <button onclick="removeItem(${index})">Retirer</button>
      <hr>
    `;
    cartDiv.appendChild(div);
  });

  totalDiv.innerHTML = `<h3>Total du panier : ${total} FCFA</h3>`;
});

// Supprimer un article du panier
function removeItem(index) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  location.reload();
}

// Vider complètement le panier
function clearCart() {
  localStorage.removeItem('cart');
  location.reload();
}

// À développer plus tard : validation réelle de commande
function validateOrder() {
  alert('Commande validée (fonctionnalité à développer).');
}




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
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, address, items, total })
    });

    const data = await response.json();

    if (response.ok) {
      alert("Commande validée avec succès !");
      localStorage.removeItem('cart');
      location.reload(); // Recharge la page pour rafraîchir le panier
    } else {
      alert(data.error || "Erreur lors de la validation de la commande.");
    }
  } catch (error) {
    alert("Erreur lors de la validation de la commande.");
    console.error(error);
  }
}



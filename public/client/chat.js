const sessionId = Date.now().toString(); // Identifiant unique de session (peut être amélioré)

function toggleChat() {
  const widget = document.getElementById('chat-widget');
  const energyBall = document.getElementById('energy-ball');

  if (widget.style.display === 'none' || !widget.style.display) {
    // Afficher l'effet de la boule
    energyBall.style.animation = 'energy-charge 1s ease forwards';
    
    // Afficher le chat après l'effet
    setTimeout(() => {
      widget.style.display = 'flex';
    }, 800);

    // Réinitialiser l'effet après lecture
    setTimeout(() => {
      energyBall.style.animation = '';
    }, 1000);
  } else {
    widget.style.display = 'none';
  }
}



async function sendMessage() {
  const input = document.getElementById('userMessage');
  const message = input.value.trim();
  if (!message) return;

  addMessage('Vous', message);
  input.value = '';

  try {
    const res = await fetch("/api/chat", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userMessage: message })
    });

    const data = await res.json();
    addMessage('KBR AI', data.result || 'Aucune réponse reçue.');
  } catch (err) {
    addMessage('KBR AI', 'Erreur de connexion à l’IA.');
    console.error(err);
  }
}

function addMessage(sender, text) {
  const chatBody = document.getElementById('chat-body');
  const div = document.createElement('div');
  div.innerHTML = `<strong>${sender} :</strong> ${text}`;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

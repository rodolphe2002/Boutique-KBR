// Ensure API base without redefining global 'baseUrl'
const API_BASE = (typeof window.baseUrl !== 'undefined')
  ? window.baseUrl
  : (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://boutique-kbr.onrender.com');
if (typeof window.baseUrl === 'undefined') window.baseUrl = API_BASE;

const sessionId = Date.now().toString(); // Identifiant unique de session (peut être amélioré)

function toggleChatWidget() {
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

// Expose function safely and bind click if button exists
window.toggleChatWidget = toggleChatWidget;
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('toggleChat');
  if (btn) btn.addEventListener('click', toggleChatWidget);
});

// Lightweight catalog context cache (5 min TTL)
async function getCatalogContext() {
  const KEY = 'kbr_catalog_context_v1';
  const TTL = 5 * 60 * 1000;
  try {
    const cached = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (cached && (Date.now() - cached.timestamp) < TTL) return cached.data;

    const [sessionsRes, recentRes] = await Promise.all([
      fetch(`${API_BASE}/api/sessions`),
      fetch(`${API_BASE}/api/products/recent?limit=10&_=${Date.now()}`)
    ]);
    const sessions = sessionsRes.ok ? await sessionsRes.json() : [];
    const recent = recentRes.ok ? await recentRes.json() : [];

    const ctx = {
      sessions: (sessions || []).map(s => ({ id: s._id, name: s.name })),
      recent: (recent || []).map(p => ({ id: p._id, title: p.title, price: p.price, sessionId: p.sessionId }))
    };
    localStorage.setItem(KEY, JSON.stringify({ timestamp: Date.now(), data: ctx }));
    return ctx;
  } catch {
    return { sessions: [], recent: [] };
  }
}

async function sendMessage() {
  const input = document.getElementById('userMessage');
  const message = input.value.trim();
  if (!message) return;

  addMessage('Vous', message);
  input.value = '';

  try {
    // Add typing indicator
    const typingEl = addTyping();

    // Build lightweight catalog context
    const context = await getCatalogContext();

    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userMessage: message, context })
    });

    const data = await res.json();
    removeTyping(typingEl);
    typeWriterAdd('KBR AI', data.result || 'Aucune réponse reçue.');
  } catch (err) {
    removeTyping();
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

// Create a typing indicator element
function addTyping() {
  const chatBody = document.getElementById('chat-body');
  const wrap = document.createElement('div');
  wrap.innerHTML = `<strong>KBR AI :</strong> <span class="typing-indicator"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>`;
  chatBody.appendChild(wrap);
  chatBody.scrollTop = chatBody.scrollHeight;
  return wrap;
}

function removeTyping(el) {
  try {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    else {
      const last = document.querySelector('#chat-body .typing-indicator');
      if (last) last.parentElement?.parentElement?.remove();
    }
  } catch {}
}

// Typewriter add of assistant message
function typeWriterAdd(sender, fullText) {
  const chatBody = document.getElementById('chat-body');
  const div = document.createElement('div');
  const strong = document.createElement('strong');
  strong.textContent = `${sender} :`;
  div.appendChild(strong);
  div.appendChild(document.createTextNode(' '));
  const span = document.createElement('span');
  div.appendChild(span);
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;

  let i = 0;
  const speed = 12; // ms per char
  function tick() {
    if (i <= fullText.length) {
      span.textContent = fullText.slice(0, i);
      i++;
      chatBody.scrollTop = chatBody.scrollHeight;
      setTimeout(tick, speed);
    }
  }
  tick();
}

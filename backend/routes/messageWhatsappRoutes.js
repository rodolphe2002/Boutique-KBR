const express = require('express');
const router = express.Router();
require('dotenv').config(); 

// Config
const adminWhatsAppNumber = 'NUMERO_WHATSAPP'; // Remplace par ton numéro admin

// Exemple avec Twilio (il faudra installer twilio et configurer tes identifiants)
const twilio = require('twilio');
const client = new twilio('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN');

router.post('/sendWhatsappToAdmin', async (req, res) => {
  const { order } = req.body;

  if (!order) return res.status(400).json({ error: 'Order info is required' });

  // Construire le message
  const message = `
Nouvelle commande reçue :
Nom : ${order.name}
Téléphone client : ${order.phone}
Produits :
${order.items.map(item => `- ${item.title} x${item.quantity}`).join('\n')}
Total : ${order.total} FCFA
Date : ${new Date(order.createdAt).toLocaleString()}
  `;

  try {
    await client.messages.create({
      from: 'whatsapp:+14155238886', // numéro sandbox Twilio WhatsApp ou ton numéro business
      to: `whatsapp:${adminWhatsAppNumber}`,
      body: message,
    });
    res.json({ status: 'Message WhatsApp envoyé à l\'admin' });
  } catch (error) {
    console.error('Erreur envoi WhatsApp:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi WhatsApp' });
  }
});

module.exports = router;

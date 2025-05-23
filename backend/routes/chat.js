const express = require("express");
const router = express.Router();
require("dotenv").config();

const conversations = {};
const systemPrompt = `Tu es KBR AI, l’assistant virtuel de la Boutique KBR. Ta mission est de répondre uniquement aux questions liées à la Boutique KBR, ses produits (vêtements, chaussures, téléphones, accessoires), prix, tailles, couleurs, méthodes de paiement, livraison, promotions, suivi de commande, retours, horaires et contacts.

Consigne importante :  
- Personnalise tes réponses autant que possible selon les besoins et demandes spécifiques de chaque client, afin d’offrir une expérience unique et adaptée.  
- Limite-toi à deux phrases maximum par réponse pour garder la conversation fluide et claire.  
- Si la question est hors sujet, réponds simplement que tu es dédié uniquement à la Boutique KBR.

Voici des exemples de réponses types que tu peux adapter :  

Accueil :  
"Bonjour ! Je suis KBR AI, votre assistant pour la Boutique KBR. Que souhaitez-vous savoir aujourd’hui ?"

Produits :  
"Nous proposons vêtements, chaussures, téléphones et accessoires. Quel produit vous intéresse ?"

Prix :  
"Les prix dépendent de l’article. Quel produit souhaitez-vous connaître ?"

Tailles/couleurs :  
"Plusieurs tailles et couleurs sont disponibles. Quel article voulez-vous préciser ?"

Paiement :  
"Paiement possible par mobile money ou à la livraison. Quelle option préférez-vous ?"

Livraison :  
"La livraison se fait en 2 à 5 jours ouvrés partout en Côte d’Ivoire."

Promotions :  
"Des réductions sont en cours sur certains articles. Voulez-vous que je vous en parle ?"

Suivi de commande :  
"Donnez-moi votre numéro de suivi pour que je vérifie l’état de votre commande."

Retour/remboursement :  
"Les retours sont acceptés sous 7 jours. Besoin d’aide pour un retour ?"

Horaires/contact :  
"Nous sommes ouverts du lundi au samedi, de 9h à 19h. Contactez-nous au 05 02 32 99 09 ou WhatsApp 05 65 69 93 58."

Hors sujet :  
"Je suis KBR AI, dédié uniquement à la Boutique KBR. Pour autre chose, merci de consulter un autre service."

Invite toujours le client à poser une autre question à la fin de chaque réponse.  



`;

router.post("/", async (req, res) => {
  const { sessionId, userMessage } = req.body;
  if (!sessionId || !userMessage) {
    return res.status(400).json({ result: "sessionId et userMessage sont requis." });
  }

  if (!conversations[sessionId]) {
    conversations[sessionId] = [{ role: "system", content: systemPrompt }];
  }
  conversations[sessionId].push({ role: "user", content: userMessage });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: conversations[sessionId],
        max_tokens: 700,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return res.status(429).json({ result: "Limite API dépassée." });
      throw new Error(`Erreur API : ${response.statusText}`);
    }

    const data = await response.json();
    const assistantReply = data.choices[0].message.content;

    conversations[sessionId].push({ role: "assistant", content: assistantReply });

    res.json({ result: assistantReply });
  } catch (error) {
    console.error("Erreur IA:", error);
    res.status(500).json({ result: "Erreur lors de la réponse de l'IA." });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Session = require("../models/Session");
require("dotenv").config();

const conversations = {};

const systemPrompt = `Tu es KBR AI, l’assistant virtuel officiel de la Boutique KBR. Ta mission est de répondre uniquement aux questions liées à la Boutique KBR : ses produits (vêtements, chaussures, téléphones, accessoires), les prix, tailles, couleurs, méthodes de paiement, livraison, promotions, suivi de commande, retours, horaires et contacts.

🧠 Tu as accès aux *données produits en temps réel*, qui te sont transmises dans le bloc ci-dessous :  
**Données produits :**  
(ces données t’indiquent quels produits sont disponibles, ou non)

🎯 Consignes importantes :  
- Si des produits sont listés dans les données, **utilise-les dans ta réponse**.  
- S’il n’y a **aucun produit**, informe poliment le client qu’il n’y a rien en stock pour le moment.  
- Réponds en **1 à 2 phrases maximum** pour garder une discussion fluide.  
- **Invite toujours le client à poser une autre question** à la fin de ta réponse.  
- Si la question est hors sujet (ex. politique, météo, autre entreprise), dis simplement que tu es dédié uniquement à la Boutique KBR.  
- Ne mentionne **jamais de site internet** si ce n’est pas dans les données.

---

📝 **Exemples de réponses adaptables :**

**Accueil :**  
"Bonjour ! Je suis KBR AI, votre assistant pour la Boutique KBR. Que souhaitez-vous savoir aujourd’hui ?"

**Produits (si la base contient des produits) :**  
"Voici ce que nous avons actuellement en stock : [liste de produits]. Vous cherchez un article en particulier ?"

**Produits (si aucun produit n’est dispo) :**  
"Aucun produit n’est disponible en stock pour le moment. Souhaitez-vous être informé dès qu’il y aura du nouveau ?"

**Prix :**  
"Les prix varient selon les articles. Lequel souhaitez-vous connaître ?"

**Tailles/couleurs :**  
"Différentes tailles et couleurs sont disponibles. Pour quel produit exactement ?"

**Paiement :**  
"Le paiement est possible par mobile money ou à la livraison. Quelle méthode préférez-vous ?"

**Livraison :**  
"La livraison se fait sous 2 à 5 jours ouvrés, partout en Côte d’Ivoire."

**Promotions :**  
"Des réductions sont en cours sur certains articles. Souhaitez-vous les découvrir ?"

**Suivi de commande :**  
"Donnez-moi votre numéro de suivi et je vous informe de l’état de votre commande."

**Retours/remboursements :**  
"Les retours sont acceptés dans un délai de 7 jours. Souhaitez-vous en faire un ?"

**Horaires/contact :**  
"Nous sommes ouverts du lundi au samedi, de 9h à 19h. 📞 05 02 32 99 09 ou WhatsApp 05 65 69 93 58."

**Hors sujet :**  
"Je suis KBR AI, dédié uniquement à la Boutique KBR. Pour autre chose, merci de consulter un autre service."

---

Sois toujours poli, précis, rassurant et oriente le client vers l’action ou une question suivante.

`;


async function repondreProduitsDisponibles() {
  const sessions = await Session.find();
  let reponse = "Voici les produits actuellement disponibles à la Boutique KBR :\n";

  for (const session of sessions) {
    const produits = await Product.find({ sessionId: session._id });

    if (produits.length > 0) {
      reponse += `\n🗂️ *${session.name}* :\n`;
      produits.forEach((produit, index) => {
        reponse += `- ${produit.title} (${produit.price} FCFA)\n`;
      });
    }
  }

  if (reponse === "Voici les produits actuellement disponibles à la Boutique KBR :\n") {
    reponse = "Aucun produit n’est disponible pour le moment.";
  }

  return reponse;
}

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
    let dbInfo = "";

    // 🔍 Expression régulière pour reconnaître les demandes générales de liste
    const demandeListeRegex = /liste.*(produits|articles)|produits.*disponibles|quels sont les produits|tous les produits/i;

    // Si l'utilisateur demande une liste complète
    if (demandeListeRegex.test(userMessage)) {
      dbInfo = await repondreProduitsDisponibles();
    } else {
      // Sinon, recherche intelligente par mots-clés spécifiques
      const keywordRegex = /taille|pointure|prix|chaussure|vêtement|téléphone|accessoire|disponible|couleur|stock/i;

      if (keywordRegex.test(userMessage)) {
        const escapedWords = userMessage
          .split(" ")
          .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|");

        const regex = new RegExp(escapedWords, "i");

        const results = await Product.find({
          $or: [{ title: regex }, { description: regex }]
        }).limit(10);

        if (results.length > 0) {
          dbInfo = "Voici les produits actuellement disponibles :\n" +
            results.map(p =>
              `- ${p.title} (${p.price} FCFA) : ${p.description}`
            ).join("\n");
        } else {
          const totalProducts = await Product.countDocuments();
          if (totalProducts === 0) {
            dbInfo = "⚠️ Aucun produit n’est actuellement enregistré dans la boutique. La base de données est vide.";
          } else {
            dbInfo = "Aucun produit ne correspond à votre recherche pour le moment.";
          }
        }
      }
    }

    const messages = [
      { role: "system", content: `${systemPrompt}\n\nDonnées produits :\n${dbInfo}` },
      ...conversations[sessionId]
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages,
        max_tokens: 700,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return res.status(429).json({ result: "Limite API dépassée." });
      }
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

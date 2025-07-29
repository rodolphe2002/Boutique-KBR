const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Session = require("../models/Session");
require("dotenv").config();

const conversations = {};

const systemPrompt = `Tu es **KBR AI**, l’assistant virtuel de la Boutique KBR.

🎯 Ta mission est de répondre **uniquement** aux questions liées à la boutique :  
- Produits (vêtements, chaussures, téléphones, accessoires)  
- Prix, tailles, couleurs disponibles  
- Paiement  
- Livraison  
- Promotions  
- Suivi de commande  
- Retours/remboursements  
- Horaires et contact  

---

🧠 Tu as accès aux données produits ci-dessous :  
**Données produits :**  
[Les données seront injectées ici]

---

📌 Règles strictes :
- N'affiche **jamais** les catégories ou produits **sans que le client les demande explicitement**.
- Ensuite, affiche uniquement les **produits de la catégorie demandée**.  
- Ne jamais tout montrer d’un coup. Guide **étape par étape**.  
- Si rien n’est dispo, dis-le poliment.  
- Réponds en **1 à 2 phrases maximum**.  
- Toujours **demander une précision ou autre question**.  
- Si c’est hors sujet, dis que tu es limité à la Boutique KBR.  
- Ne donne **aucune info non incluse dans les données**.

---

🎤 Style :
- **Professionnel** mais accueillant  
- **Direct**, jamais vague  
- Toujours **inciter à l’action** : choisir, demander, préciser  

---

🧪 Exemples de réponses (à adapter) :

• **Accueil** :  
"Bonjour et bienvenue chez KBR ! Que puis-je faire pour vous aujourd’hui ?"

• **Produits** :  
"Dans la catégorie *[catégorie]*, voici ce qu’on propose :\n- Produit A (prix, description)\n- Produit B..."

• **Aucun stock** :  
"Rien n’est en stock actuellement. Souhaitez-vous être notifié dès qu’il y a du nouveau ?"

• **Prix/Tailles** :  
"Pour quel article souhaitez-vous connaître le prix ou la taille ?"

• **Livraison** :  
"La livraison prend 2 à 5 jours ouvrés, partout en Côte d’Ivoire."

• **Paiement** :  
"Mobile Money ou paiement à la livraison. Vous préférez lequel ?"

• **Hors sujet** :  
"Je suis KBR AI, dédié uniquement à la Boutique KBR."

---

🎬 Prêt ? Tu vas maintenant répondre selon les données suivantes :
`;

async function repondreProduitsDisponibles() {
  const produits = await Product.find();

  if (produits.length === 0) {
    return "Aucun produit n’est disponible pour le moment.";
  }

  let reponse = "Voici les produits actuellement disponibles à la Boutique KBR :\n";
  produits.forEach(produit => {
    reponse += `- ${produit.title} (${produit.price} FCFA) : ${produit.description}\n`;
  });

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

    // 👋 Vérifie si le message est une salutation simple
    const estUnMessageDeSalutation = /^(salut|bonjour|coucou|hello|hey)\b/i.test(userMessage.trim());

    if (!estUnMessageDeSalutation) {
      const demandeListeRegex = /liste.*(produits|articles)|produits.*disponibles|quels sont les produits|tous les produits/i;

      if (demandeListeRegex.test(userMessage)) {
        dbInfo = await repondreProduitsDisponibles();
      } else {
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
            dbInfo = totalProducts === 0
              ? "⚠️ Aucun produit n’est actuellement enregistré dans la boutique. La base de données est vide."
              : "Aucun produit ne correspond à votre recherche pour le moment.";
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
        model: 'meta-llama/llama-3-8b-instruct',
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

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const authAdmin = require('./authAdmin');

// Enregistrer une commande
router.post('/', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtenir toutes les commandes
router.get('/',authAdmin, async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Statistiques commandes
router.get('/stats',authAdmin, async (req, res) => {
  try {
    // Statistiques globales (totaux)
    const totalOrders = await Order.countDocuments();
    const deliveredOrders = await Order.countDocuments({ status: 'Livrée' });
    const cancelledOrders = await Order.countDocuments({ status: 'Annulée' });

    // Total des ventes global (somme des totaux)
    const totalSalesResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$total" }
        }
      }
    ]);
    const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].totalSales : 0;

    // Statistiques mensuelles - nombre commandes, total ventes par mois
    const monthlyStats = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          ordersCount: { $sum: 1 },
          salesTotal: { $sum: "$total" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Produits les plus vendus (globaux)
    const productsStats = await Order.aggregate([
      { $unwind: "$items" },
      { $group: {
          _id: "$items.title",
          totalQuantity: { $sum: "$items.quantity" }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      totalSales,
      monthlyStats,
      productsStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Mise à jour du statut d'une commande
router.put('/:id/status',authAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;

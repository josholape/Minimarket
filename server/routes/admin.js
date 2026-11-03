const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Every route in this file is admin-only
router.use(authMiddleware, adminMiddleware);

const LOW_STOCK_THRESHOLD = 5;
const STATUSES = ['pending', 'shipped', 'completed', 'cancelled'];

router.get('/dashboard', async (req, res) => {
  try {
    // The six queries are independent, so run them at the same time
    const [totals, byStatus, customers, lowStock, topProducts, recentOrders] =
      await Promise.all([
        // Totals across all orders. FILTER applies a condition to just one aggregate.
        pool.query(
          `SELECT
             COALESCE(SUM(total_amount) FILTER (WHERE status <> 'cancelled'), 0) AS revenue,
             COUNT(*)::int AS total_orders,
             (COUNT(*) FILTER (WHERE status <> 'cancelled'))::int AS active_orders
           FROM orders`
        ),

        // One row per status
        pool.query(
          `SELECT status, COUNT(*)::int AS count
           FROM orders
           GROUP BY status`
        ),

        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM users
           WHERE is_admin IS NOT TRUE`
        ),

        pool.query(
          `SELECT id, name, stock
           FROM products
           WHERE stock <= $1
           ORDER BY stock ASC, name ASC
           LIMIT 10`,
          [LOW_STOCK_THRESHOLD]
        ),

        // Best sellers: join order items to orders (to skip cancelled) and products (for names)
        pool.query(
          `SELECT p.id, p.name,
                  SUM(oi.quantity)::int AS units_sold,
                  SUM(oi.quantity * oi.price_at_purchase) AS revenue
           FROM order_items oi
           JOIN orders o ON o.id = oi.order_id
           JOIN products p ON p.id = oi.product_id
           WHERE o.status <> 'cancelled'
           GROUP BY p.id, p.name
           ORDER BY units_sold DESC, revenue DESC
           LIMIT 5`
        ),

        pool.query(
          `SELECT o.id, o.total_amount, o.status, o.created_at,
                  u.name AS customer_name
           FROM orders o
           JOIN users u ON o.user_id = u.id
           ORDER BY o.created_at DESC
           LIMIT 5`
        ),
      ]);

    const { revenue, total_orders, active_orders } = totals.rows[0];
    const revenueNumber = Number(revenue);

    // Make sure all four statuses exist, even with zero orders
    const ordersByStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    for (const row of byStatus.rows) {
      ordersByStatus[row.status] = row.count;
    }

    res.json({
      success: true,
      stats: {
        revenue: revenueNumber,
        totalOrders: total_orders,
        activeOrders: active_orders,
        averageOrder: active_orders > 0 ? revenueNumber / active_orders : 0,
        customers: customers.rows[0].count,
      },
      ordersByStatus,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      lowStock: lowStock.rows,
      topProducts: topProducts.rows,
      recentOrders: recentOrders.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error loading dashboard' });
  }
});

module.exports = router;
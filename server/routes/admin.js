const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

const LOW_STOCK_THRESHOLD = 5;
const STATUSES = ['pending', 'shipped', 'completed', 'cancelled'];

router.get('/dashboard', async (req, res) => {
  try {
    const [
      totals,
      byStatus,
      customers,
      lowStock,
      topProducts,
      recentOrders,
      monthly,
    ] = await Promise.all([
      pool.query(`
        SELECT
          COALESCE(
            SUM(total_amount) FILTER (WHERE status <> 'cancelled'),
            0
          ) AS revenue,
          COUNT(*)::int AS total_orders,
          (
            COUNT(*) FILTER (WHERE status <> 'cancelled')
          )::int AS active_orders
        FROM orders
      `),

      pool.query(`
        SELECT status, COUNT(*)::int AS count
        FROM orders
        GROUP BY status
      `),

      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM users
        WHERE is_admin IS NOT TRUE
      `),

      pool.query(
        `SELECT id, name, stock
         FROM products
         WHERE stock <= $1
         ORDER BY stock ASC, name ASC
         LIMIT 10`,
        [LOW_STOCK_THRESHOLD]
      ),

      pool.query(`
        SELECT
          p.id,
          p.name,
          SUM(oi.quantity)::int AS units_sold,
          SUM(oi.quantity * oi.price_at_purchase) AS revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE o.status <> 'cancelled'
        GROUP BY p.id, p.name
        ORDER BY units_sold DESC, revenue DESC
        LIMIT 5
      `),

      pool.query(`
        SELECT
          o.id,
          o.total_amount,
          o.status,
          o.created_at,
          u.name AS customer_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 5
      `),

      // Current month plus the previous eleven months.
      // LEFT JOIN preserves months without orders.
      pool.query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_TIMESTAMP)::timestamp
              - INTERVAL '11 months',
            date_trunc('month', CURRENT_TIMESTAMP)::timestamp,
            INTERVAL '1 month'
          ) AS month_start
        )
        SELECT
          to_char(m.month_start, 'YYYY-MM') AS month,
          to_char(m.month_start, 'Mon') AS short_label,
          to_char(m.month_start, 'FMMonth YYYY') AS label,
          COALESCE(SUM(o.total_amount), 0) AS order_value,
          COUNT(o.id)::int AS order_count
        FROM months m
        LEFT JOIN orders o
          ON o.created_at >= m.month_start
          AND o.created_at < m.month_start + INTERVAL '1 month'
          AND o.status <> 'cancelled'
        GROUP BY m.month_start
        ORDER BY m.month_start
      `),
    ]);

    const {
      revenue,
      total_orders,
      active_orders,
    } = totals.rows[0];

    const revenueNumber = Number(revenue);

    const ordersByStatus = Object.fromEntries(
      STATUSES.map(status => [status, 0])
    );

    for (const row of byStatus.rows) {
      ordersByStatus[row.status] = row.count;
    }

    const monthlySales = monthly.rows.map(row => ({
      month: row.month,
      shortLabel: row.short_label,
      label: row.label,
      orderValue: Number(row.order_value),
      orders: row.order_count,
    }));

    res.json({
      success: true,

      stats: {
        revenue: revenueNumber,
        totalOrders: total_orders,
        activeOrders: active_orders,
        averageOrder:
          active_orders > 0
            ? revenueNumber / active_orders
            : 0,
        customers: customers.rows[0].count,
      },

      monthlySales,
      ordersByStatus,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      lowStock: lowStock.rows,
      topProducts: topProducts.rows,
      recentOrders: recentOrders.rows,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: 'Server error loading dashboard.',
    });
  }
});

module.exports = router;
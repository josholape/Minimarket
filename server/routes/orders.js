const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// CHECKOUT - convert cart into an order
router.post('/checkout', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Get current cart items with product prices
    const cartResult = await client.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.stock, p.name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1`,
      [req.user.userId]
    );

    const cartItems = cartResult.rows;

    if (cartItems.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    // 2. Check stock availability for every item
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Not enough stock for ${item.name}. Available: ${item.stock}`
        });
      }
    }

    // 3. Calculate total
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + (parseFloat(item.price) * item.quantity),
      0
    );

    // 4. Create the order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, status)
       VALUES ($1, $2, 'pending')
       RETURNING id, total_amount, status, created_at`,
      [req.user.userId, totalAmount]
    );
    const order = orderResult.rows[0];

    // 5. Insert each cart item into order_items (snapshotting price)
    for (const item of cartItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_id, item.quantity, item.price]
      );

      // 6. Reduce product stock
      await client.query(
        `UPDATE products SET stock = stock - $1 WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // 7. Clear the cart
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.userId]);

    await client.query('COMMIT');

    res.status(201).json({ success: true, order });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error during checkout' });
  } finally {
    client.release();
  }
});

// GET order history for logged-in user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json({ success: true, orders: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching orders' });
  }
});

// GET single order with its items
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const itemsResult = await pool.query(
      `SELECT oi.*, p.name, p.image_url
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({ success: true, order: orderResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching order' });
  }
});

module.exports = router;
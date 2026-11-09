const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(authMiddleware);

const VALID_STATUSES = ['pending', 'shipped', 'completed', 'cancelled'];

// [field name, label for error messages, max length]
const SHIPPING_FIELDS = [
  ['name', 'Full name', 100],
  ['phone', 'Phone number', 30],
  ['address', 'Street address', 255],
  ['city', 'City', 100],
  ['province', 'Province', 100],
  ['postal_code', 'Postal code', 20],
];

// Returns { data } with trimmed values, or { error } describing the first problem
function validateShipping(input) {
  const data = {};
  for (const [key, label, max] of SHIPPING_FIELDS) {
    const value = String(input?.[key] ?? '').trim();
    if (!value) return { error: `${label} is required` };
    if (value.length > max) return { error: `${label} must be ${max} characters or less` };
    data[key] = value;
  }
  return { data };
}

// ADMIN: get ALL orders with customer info
// Must stay ABOVE '/:id', otherwise Express treats "admin" as an order id
router.get('/admin/all', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.total_amount, o.status, o.created_at,
              o.shipping_name, o.shipping_phone, o.shipping_address,
              o.shipping_city, o.shipping_province, o.shipping_postal_code,
              u.name AS customer_name, u.email AS customer_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    res.json({ success: true, orders: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching orders' });
  }
});

// ADMIN: change an order's status (restores stock when cancelling)
router.put('/:id/status', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Status must be one of: ${VALID_STATUSES.join(', ')}`
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Read the current status and lock the row until we finish
    const current = await client.query(
      'SELECT status FROM orders WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (current.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const oldStatus = current.rows[0].status;

    // 2. Cancelled orders can't be reopened (stock was already given back)
    if (oldStatus === 'cancelled' && status !== 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'A cancelled order cannot be reopened'
      });
    }

    // 3. Going to cancelled: put each item's quantity back into stock
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      const itemsResult = await client.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        [id]
      );

      for (const item of itemsResult.rows) {
        // product_id is NULL if the product was deleted later, so skip those
        if (item.product_id === null) continue;
        await client.query(
          'UPDATE products SET stock = stock + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
    }

    // 4. Save the new status
    const result = await client.query(
      `UPDATE orders SET status = $1 WHERE id = $2
       RETURNING id, total_amount, status, created_at`,
      [status, id]
    );

    await client.query('COMMIT');

    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error updating order' });
  } finally {
    client.release();
  }
});

// BUY NOW: creates an order for one product and leaves the cart unchanged.
router.post('/buy-now', async (req, res) => {
  const { product_id: productId, quantity } = req.body;
  if (!Number.isSafeInteger(productId) || productId < 1 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 2147483647) {
    return res.status(400).json({ success: false, error: 'A valid product and quantity are required.' });
  }
  const { data: shipping, error: shippingError } = validateShipping(req.body.shipping);
  if (shippingError) return res.status(400).json({ success: false, error: shippingError });
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const found = await client.query('SELECT id, name, price, stock FROM products WHERE id = $1 FOR UPDATE', [productId]);
    const product = found.rows[0];
    if (!product) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }
    if (quantity > product.stock) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Not enough stock. Available: ' + product.stock + '.' });
    }
    const created = await client.query(
      `INSERT INTO orders (user_id, total_amount, status, shipping_name, shipping_phone,
       shipping_address, shipping_city, shipping_province, shipping_postal_code)
       VALUES ($1, $2::numeric * $3::integer, 'pending', $4, $5, $6, $7, $8, $9)
       RETURNING id, total_amount, status, created_at`,
      [req.user.userId, product.price, quantity, shipping.name, shipping.phone,
       shipping.address, shipping.city, shipping.province, shipping.postal_code]
    );
    const order = created.rows[0];
    await client.query('INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)', [order.id, product.id, quantity, product.price]);
    await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [quantity, product.id]);
    await client.query('COMMIT');
    res.status(201).json({ success: true, order });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('Buy now failed:', err.message);
    res.status(500).json({ success: false, error: 'Could not place your order. Please try again.' });
  } finally { client?.release(); }
});

// CHECKOUT: serialize a user's checkouts, then lock cart rows and stock.
router.post('/checkout', async (req, res) => {
  const { data: shipping, error: shippingError } = validateShipping(req.body.shipping);
  if (shippingError) {
    return res.status(400).json({ success: false, error: shippingError });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // A second checkout for this account waits before reading its cart.
    const userResult = await client.query(
      'SELECT id FROM users WHERE id = $1 FOR NO KEY UPDATE',
      [req.user.userId]
    );
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, error: 'Account no longer exists' });
    }

    // Lock current cart rows so quantity edits cannot change this snapshot.
    const cartResult = await client.query(
      `SELECT id, product_id, quantity
       FROM cart_items
       WHERE user_id = $1
       ORDER BY product_id
       FOR UPDATE`,
      [req.user.userId]
    );
    const cartItems = cartResult.rows;
    if (cartItems.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    // Read stock after acquiring locks. Stable order reduces deadlock risk.
    const productIds = cartItems.map(item => item.product_id);
    const productsResult = await client.query(
      `SELECT id, name, price, stock
       FROM products
       WHERE id = ANY($1::int[])
       ORDER BY id
       FOR UPDATE`,
      [productIds]
    );
    const products = new Map(productsResult.rows.map(product => [product.id, product]));
    for (const item of cartItems) {
      const product = products.get(item.product_id);
      if (!product || item.quantity > product.stock) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: product
            ? `Not enough stock for ${product.name}. Available: ${product.stock}`
            : 'A product is no longer available. Please refresh your cart.',
        });
      }
    }

    const cartIds = cartItems.map(item => item.id);
    // Calculate currency with PostgreSQL numeric arithmetic.
    const totalResult = await client.query(
      `SELECT SUM(p.price * ci.quantity) AS total
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.id = ANY($1::int[]) AND ci.user_id = $2`,
      [cartIds, req.user.userId]
    );
    const orderResult = await client.query(
      `INSERT INTO orders
       (user_id, total_amount, status, shipping_name, shipping_phone,
        shipping_address, shipping_city, shipping_province, shipping_postal_code)
       VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8)
       RETURNING id, total_amount, status, created_at`,
      [req.user.userId, totalResult.rows[0].total,
       shipping.name, shipping.phone, shipping.address,
       shipping.city, shipping.province, shipping.postal_code]
    );
    const order = orderResult.rows[0];
    for (const item of cartItems) {
      const product = products.get(item.product_id);
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [order.id, product.id, item.quantity, product.price]
      );
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, product.id]);
    }

    // Preserve new cart rows added while checkout was running.
    await client.query(
      'DELETE FROM cart_items WHERE user_id = $1 AND id = ANY($2::int[])',
      [req.user.userId, cartIds]
    );
    await client.query('COMMIT');
    res.status(201).json({ success: true, order });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('Checkout failed:', err.message);
    res.status(500).json({ success: false, error: 'Server error during checkout' });
  } finally {
    client?.release();
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
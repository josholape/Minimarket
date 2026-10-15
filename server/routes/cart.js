const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All cart routes require login
router.use(authMiddleware);

// GET current user's cart
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.price, p.image_url, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [req.user.userId]
    );
    res.json({ success: true, cart: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching cart' });
  }
});

// ADD item to cart (or increase quantity if it already exists)
router.post('/', async (req, res) => {
  const { product_id, quantity } = req.body;
  const qty = quantity || 1;

  if (!product_id) {
    return res.status(400).json({ success: false, error: 'product_id is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + $3
       RETURNING *`,
      [req.user.userId, product_id, qty]
    );
    res.status(201).json({ success: true, cartItem: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error adding to cart' });
  }
});

// UPDATE quantity of a specific cart item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ success: false, error: 'Valid quantity is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE cart_items SET quantity = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [quantity, id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cart item not found' });
    }
    res.json({ success: true, cartItem: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error updating cart' });
  }
});

// REMOVE item from cart
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cart item not found' });
    }
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error removing from cart' });
  }
});

module.exports = router;
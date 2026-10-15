const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// GET all products (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.created_at DESC`
    );
    res.json({ success: true, products: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching products' });
  }
});

// GET single product by id (public)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching product' });
  }
});

// CREATE product (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, description, price, stock, image_url, category_id } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ success: false, error: 'Name and price are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock, image_url, category_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description || null, price, stock || 0, image_url || null, category_id || null]
    );
    res.status(201).json({ success: true, product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error creating product' });
  }
});

// UPDATE product (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, image_url, category_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE products
       SET name = $1, description = $2, price = $3, stock = $4, image_url = $5, category_id = $6
       WHERE id = $7
       RETURNING *`,
      [name, description, price, stock, image_url, category_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error updating product' });
  }
});

// DELETE product (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error deleting product' });
  }
});

module.exports = router;
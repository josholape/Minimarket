const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// PUBLIC: list categories
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM categories ORDER BY name');
    res.json({ success: true, categories: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching categories' });
  }
});

// ADMIN: add a category
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  const name = (req.body.name || '').trim();

  if (!name) {
    return res.status(400).json({ success: false, error: 'Category name is required' });
  }
  if (name.length > 100) {
    return res.status(400).json({ success: false, error: 'Name must be 100 characters or less' });
  }

  try {
    // The UNIQUE constraint is case-sensitive, so check "books" vs "Books" ourselves
    const existing = await pool.query(
      'SELECT 1 FROM categories WHERE LOWER(name) = LOWER($1)',
      [name]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'That category already exists' });
    }

    const result = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING id, name',
      [name]
    );
    res.status(201).json({ success: true, category: result.rows[0] });
  } catch (err) {
    // 23505 = unique violation (two requests raced past the check above)
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'That category already exists' });
    }
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error adding category' });
  }
});

// ADMIN: delete a category (its products become Uncategorized)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error deleting category' });
  }
});

module.exports = router;
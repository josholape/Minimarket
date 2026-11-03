const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

const COLUMNS = 'id, name, phone, address, city, province, postal_code, is_default';

// [field name, label for error messages, max length]
const FIELDS = [
  ['name', 'Full name', 100],
  ['phone', 'Phone number', 30],
  ['address', 'Street address', 255],
  ['city', 'City', 100],
  ['province', 'Province', 100],
  ['postal_code', 'Postal code', 20],
];

function validateAddress(input) {
  const data = {};
  for (const [key, label, max] of FIELDS) {
    const value = String(input?.[key] ?? '').trim();
    if (!value) return { error: `${label} is required` };
    if (value.length > max) return { error: `${label} must be ${max} characters or less` };
    data[key] = value;
  }
  return { data };
}

function toId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// LIST my addresses (default first)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${COLUMNS} FROM addresses
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC, id DESC`,
      [req.user.userId]
    );
    res.json({ success: true, addresses: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching addresses' });
  }
});

// ADD an address (the first one is automatically the default)
router.post('/', async (req, res) => {
  const { data, error } = validateAddress(req.body);
  if (error) return res.status(400).json({ success: false, error });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const count = await client.query(
      'SELECT COUNT(*) FROM addresses WHERE user_id = $1',
      [req.user.userId]
    );
    const makeDefault = Number(count.rows[0].count) === 0 || req.body.is_default === true;

    // Only one default allowed, so clear the old one first
    if (makeDefault) {
      await client.query(
        'UPDATE addresses SET is_default = FALSE WHERE user_id = $1',
        [req.user.userId]
      );
    }

    const result = await client.query(
      `INSERT INTO addresses
         (user_id, name, phone, address, city, province, postal_code, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${COLUMNS}`,
      [req.user.userId, data.name, data.phone, data.address, data.city,
       data.province, data.postal_code, makeDefault]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, address: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error adding address' });
  } finally {
    client.release();
  }
});

// MAKE an address the default
router.put('/:id/default', async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ success: false, error: 'Invalid address id' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT id FROM addresses WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [id, req.user.userId]
    );
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    await client.query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [req.user.userId]);
    await client.query('UPDATE addresses SET is_default = TRUE WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error setting default' });
  } finally {
    client.release();
  }
});

// EDIT an address
router.put('/:id', async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ success: false, error: 'Invalid address id' });

  const { data, error } = validateAddress(req.body);
  if (error) return res.status(400).json({ success: false, error });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // WHERE user_id makes sure nobody can edit someone else's address
    const existing = await client.query(
      'SELECT is_default FROM addresses WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [id, req.user.userId]
    );
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    // Editing can make an address the default, but never leaves the user with none
    const makeDefault = req.body.is_default === true;
    if (makeDefault) {
      await client.query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [req.user.userId]);
    }
    const isDefault = existing.rows[0].is_default || makeDefault;

    const result = await client.query(
      `UPDATE addresses
       SET name = $1, phone = $2, address = $3, city = $4,
           province = $5, postal_code = $6, is_default = $7
       WHERE id = $8 AND user_id = $9
       RETURNING ${COLUMNS}`,
      [data.name, data.phone, data.address, data.city, data.province,
       data.postal_code, isDefault, id, req.user.userId]
    );

    await client.query('COMMIT');
    res.json({ success: true, address: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error updating address' });
  } finally {
    client.release();
  }
});

// DELETE an address (if it was the default, the newest remaining one takes over)
router.delete('/:id', async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ success: false, error: 'Invalid address id' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const deleted = await client.query(
      'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING is_default',
      [id, req.user.userId]
    );
    if (deleted.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    if (deleted.rows[0].is_default) {
      await client.query(
        `UPDATE addresses SET is_default = TRUE
         WHERE id = (
           SELECT id FROM addresses WHERE user_id = $1
           ORDER BY created_at DESC, id DESC LIMIT 1
         )`,
        [req.user.userId]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error deleting address' });
  } finally {
    client.release();
  }
});

module.exports = router;
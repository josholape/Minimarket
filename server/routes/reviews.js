const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

function toId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Has this user received (completed order) this product?
async function hasPurchased(userId, productId) {
  const result = await pool.query(
    `SELECT EXISTS (
       SELECT 1
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 'completed'
     ) AS purchased`,
    [userId, productId]
  );
  return result.rows[0].purchased;
}

// PUBLIC: rating summary + all reviews for a product
router.get('/product/:productId', async (req, res) => {
  const productId = toId(req.params.productId);
  if (!productId) return res.status(400).json({ success: false, error: 'Invalid product id' });

  try {
    const [summary, reviews] = await Promise.all([
      // AVG returns numeric (a string in JS), so round it and cast to float
      pool.query(
        `SELECT COALESCE(ROUND(AVG(rating), 1), 0)::float AS average,
                COUNT(*)::int AS count
         FROM reviews
         WHERE product_id = $1`,
        [productId]
      ),
      pool.query(
        `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         WHERE r.product_id = $1
         ORDER BY r.created_at DESC`,
        [productId]
      ),
    ]);

    res.json({ success: true, summary: summary.rows[0], reviews: reviews.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error fetching reviews' });
  }
});

// LOGGED IN: can I review this product, and what did I write?
router.get('/product/:productId/mine', authMiddleware, async (req, res) => {
  const productId = toId(req.params.productId);
  if (!productId) return res.status(400).json({ success: false, error: 'Invalid product id' });

  try {
    const canReview = await hasPurchased(req.user.userId, productId);
    const existing = await pool.query(
      'SELECT id, rating, comment FROM reviews WHERE product_id = $1 AND user_id = $2',
      [productId, req.user.userId]
    );
    res.json({ success: true, canReview, review: existing.rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// LOGGED IN: create or update my review (one per product)
router.post('/product/:productId', authMiddleware, async (req, res) => {
  const productId = toId(req.params.productId);
  if (!productId) return res.status(400).json({ success: false, error: 'Invalid product id' });

  const rating = Number(req.body.rating);
  const comment = String(req.body.comment ?? '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, error: 'Rating must be a whole number from 1 to 5' });
  }
  if (comment.length > 1000) {
    return res.status(400).json({ success: false, error: 'Comment must be 1000 characters or less' });
  }

  try {
    // 403, not 401: a 401 would make the frontend think the token expired and log the user out
    if (!(await hasPurchased(req.user.userId, productId))) {
      return res.status(403).json({
        success: false,
        error: 'You can review a product after your order for it is completed'
      });
    }

    // Insert, or update if this user already reviewed this product
    const result = await pool.query(
      `INSERT INTO reviews (product_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating,
                     comment = EXCLUDED.comment,
                     updated_at = NOW()
       RETURNING id, rating, comment`,
      [productId, req.user.userId, rating, comment || null]
    );

    res.json({ success: true, review: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error saving review' });
  }
});

// LOGGED IN: delete my review
router.delete('/product/:productId', authMiddleware, async (req, res) => {
  const productId = toId(req.params.productId);
  if (!productId) return res.status(400).json({ success: false, error: 'Invalid product id' });

  try {
    // user_id in the WHERE clause means you can only delete your own review
    const result = await pool.query(
      'DELETE FROM reviews WHERE product_id = $1 AND user_id = $2 RETURNING id',
      [productId, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error deleting review' });
  }
});

module.exports = router;
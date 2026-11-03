const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const sendResetEmail = require('../utils/sendResetEmail');

const router = express.Router();

// Reset tokens are stored hashed, so we always hash before comparing
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// REGISTER
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, is_admin, created_at',
      [name, email, passwordHash]
    );

    const newUser = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser.id, isAdmin: newUser.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ success: true, user: newUser, token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error during registration' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  try {
    // Find user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Compare submitted password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, isAdmin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin },
      token
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
});

// GET current user's profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, is_admin, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// UPDATE current user's name
router.put('/me', authMiddleware, async (req, res) => {
  const name = (req.body.name || '').trim();

  if (!name) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }
  if (name.length > 100) {
    return res.status(400).json({ success: false, error: 'Name must be 100 characters or less' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email, is_admin',
      [name, req.user.userId]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error updating profile' });
  }
});

// CHANGE current user's password
router.put('/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Current and new password are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
  }

  try {
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.userId]
    );
    const user = result.rows[0];

    const matches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!matches) {
      // 400, NOT 401: a 401 would make the frontend think the token expired and log the user out
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.userId]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error changing password' });
  }
});

// FORGOT PASSWORD: create a reset token and "send" the link
router.post('/forgot-password', async (req, res) => {
  const email = String(req.body.email || '').trim();

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  // Same answer whether or not the account exists, so the form can't be used
  // to find out which emails are registered
  const GENERIC_MESSAGE = 'If that email is registered, a reset link has been sent.';

  try {
    const result = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (user) {
      // The raw token goes in the link; only its hash goes in the database
      const token = crypto.randomBytes(32).toString('hex');

      // A new request cancels any older reset links for this user
      await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
        [user.id, hashToken(token)]
      );

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      await sendResetEmail(user, `${clientUrl}/reset-password?token=${token}`);
    }

    res.json({ success: true, message: GENERIC_MESSAGE });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

// RESET PASSWORD: use the token from the link to set a new password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, error: 'Token and new password are required' });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Valid = right token, not used yet, not expired. FOR UPDATE stops two requests using it at once.
    const found = await client.query(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       FOR UPDATE`,
      [hashToken(String(token))]
    );

    if (found.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'This reset link is invalid or has expired. Please request a new one.'
      });
    }

    const { id: tokenId, user_id: userId } = found.rows[0];
    const newHash = await bcrypt.hash(String(newPassword), 10);

    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
    await client.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [tokenId]);

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error resetting password' });
  } finally {
    client.release();
  }
});

module.exports = router;
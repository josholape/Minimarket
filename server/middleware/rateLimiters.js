const { rateLimit } = require('express-rate-limit');

function makeLimiter({ minutes, limit, message, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs: minutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests,
    message: { success: false, error: message },
  });
}

// Every /api request (per IP)
const apiLimiter = makeLimiter({
  minutes: 15,
  limit: 500,
  message: 'Too many requests. Please slow down and try again shortly.',
});

// Only failed logins count, so normal users are never blocked
const loginLimiter = makeLimiter({
  minutes: 15,
  limit: 10,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

const registerLimiter = makeLimiter({
  minutes: 60,
  limit: 10,
  message: 'Too many sign-ups from this connection. Please try again later.',
});

const forgotLimiter = makeLimiter({
  minutes: 60,
  limit: 5,
  message: 'Too many reset requests. Please try again in an hour.',
});

const resetLimiter = makeLimiter({
  minutes: 60,
  limit: 10,
  message: 'Too many attempts. Please try again later.',
});

module.exports = { apiLimiter, loginLimiter, registerLimiter, forgotLimiter, resetLimiter };
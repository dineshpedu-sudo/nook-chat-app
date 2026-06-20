import rateLimit from 'express-rate-limit';

// Slows down brute-force / credential-stuffing attempts against login and register.
// 10 attempts per 15 minutes per IP address.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

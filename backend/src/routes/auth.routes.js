import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { isValidEmail, isValidPassword, isValidUsername } from '../utils/validators.js';

const router = Router();

router.post('/register', authLimiter, async (req, res) => {
  const { username, email, password } = req.body;

  if (!isValidUsername(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 characters (letters, numbers, underscores)' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: { username, email, passwordHash },
      select: { id: true, username: true, email: true, createdAt: true },
    });

    const token = signToken(user.id, user.username);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!isValidEmail(email) || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid email or password' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Same generic error whether the email doesn't exist or the password is wrong -
    // this stops attackers from learning which emails are registered (user enumeration).
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user.id, user.username);
    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      token,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

function signToken(userId, username) {
  return jwt.sign({ userId, username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export default router;

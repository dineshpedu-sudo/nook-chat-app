import { Router } from 'express';
import prisma from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Lists everyone except the logged-in user, so the frontend can show "start a chat with..."
router.get('/', requireAuth, async (req, res) => {
  const users = await prisma.user.findMany({
    where: { id: { not: req.userId } },
    select: { id: true, username: true },
    orderBy: { username: 'asc' },
  });
  res.json(users);
});

export default router;

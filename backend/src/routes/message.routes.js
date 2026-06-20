import { Router } from 'express';
import prisma from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Returns the conversation history between the logged-in user and :otherUserId
router.get('/:otherUserId', requireAuth, async (req, res) => {
  const { otherUserId } = req.params;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: req.userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.userId },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  res.json(messages);
});

export default router;

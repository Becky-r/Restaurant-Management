import express from 'express';
import { PrismaClient } from '@prisma/client';
import { checkRole } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Fetch all inventory audit trails
router.get('/inventory/audit', checkRole(['ADMIN']), async (req, res) => {
  try {
    const audits = await prisma.inventoryAudit.findMany({
      include: {
        item: { select: { name: true, unit: true } },
        requestedBy: { select: { name: true, role: true } },
        approvedBy: { select: { name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(audits);
  } catch (error) {
    console.error('Error fetching inventory audits:', error);
    res.status(500).json({ error: 'Failed to fetch inventory audit trail' });
  }
});

export default router;

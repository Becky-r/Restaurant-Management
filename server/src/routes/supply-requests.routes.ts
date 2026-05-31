import express from 'express';
import { checkRole } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

const router = express.Router();

// Chef submits a new supply request
router.post('/supply-requests', checkRole(['CHEF']), async (req: any, res) => {
  try {
    const chefId = req.user.id;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const supplyRequest = await prisma.supplyRequest.create({
      data: {
        chefId,
        items,
        status: 'PENDING',
      },
      include: {
        chef: { select: { name: true } }
      }
    });

    // Notify Inventory Managers (Admins)
    if (req.io) {
      req.io.to('inventory').emit('new-supply-request', supplyRequest);
    }

    res.status(201).json(supplyRequest);
  } catch (error) {
    console.error('Error creating supply request:', error);
    res.status(500).json({ error: 'Failed to create supply request' });
  }
});

// Admin (Inventory Manager) fetching pending requests
router.get('/supply-requests', checkRole(['ADMIN']), async (req, res) => {
  try {
    const { status } = req.query;
    const requests = await prisma.supplyRequest.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        chef: { select: { name: true } },
        managedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching supply requests:', error);
    res.status(500).json({ error: 'Failed to fetch supply requests' });
  }
});

// Admin (Inventory Manager) approves a request
router.patch('/supply-requests/:id/approve', checkRole(['ADMIN']), async (req: any, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  try {
    // We use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      const supplyRequest = await tx.supplyRequest.findUnique({
        where: { id }
      });

      if (!supplyRequest) {
        throw new Error('Supply request not found');
      }

      if (supplyRequest.status !== 'PENDING') {
        throw new Error('Supply request is not pending');
      }

      // Update status
      const updatedRequest = await tx.supplyRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          managedById: adminId
        }
      });

      // Deduct items from inventory and log audit
      const items = supplyRequest.items as Array<{ id: string, quantity: number, name: string }>;
      
      for (const item of items) {
        // Ensure atomic decrement to avoid race conditions
        const updatedItem = await tx.inventoryItem.update({
          where: { id: item.id },
          data: {
            currentStock: {
              decrement: item.quantity
            }
          }
        });

        await tx.inventoryAudit.create({
          data: {
            actionType: 'SUPPLY_REQUEST',
            itemId: item.id,
            quantityChange: -item.quantity,
            requestedById: supplyRequest.chefId,
            approvedById: adminId
          }
        });
      }

      return updatedRequest;
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error approving supply request:', error);
    res.status(400).json({ error: error.message || 'Failed to approve supply request' });
  }
});

// Reject a supply request
router.patch('/supply-requests/:id/reject', checkRole(['ADMIN']), async (req: any, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  try {
    const request = await prisma.supplyRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        managedById: adminId
      }
    });
    res.json(request);
  } catch (error) {
    console.error('Error rejecting supply request:', error);
    res.status(500).json({ error: 'Failed to reject supply request' });
  }
});

export default router;

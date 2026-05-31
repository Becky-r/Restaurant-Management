import express from 'express';
import { checkRole } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

const router = express.Router();

// Admin creates a new purchase order
router.post('/purchase-orders', checkRole(['ADMIN']), async (req: any, res) => {
  try {
    const managerId = req.user.id;
    const { items, totalEstimatedCost } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        managerId,
        items,
        totalEstimatedCost,
        status: 'PENDING',
      },
      include: {
        manager: { select: { name: true } }
      }
    });

    res.status(201).json(purchaseOrder);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// Admin fetches purchase orders
router.get('/purchase-orders', checkRole(['ADMIN']), async (req, res) => {
  try {
    const { status } = req.query;
    const orders = await prisma.purchaseOrder.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        manager: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// Admin approves a purchase order
router.patch('/purchase-orders/:id/approve', checkRole(['ADMIN']), async (req, res) => {
  const { id } = req.params;

  try {
    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'ADMIN_APPROVED' }
    });
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error approving purchase order:', error);
    res.status(500).json({ error: 'Failed to approve purchase order' });
  }
});

// Admin receives a purchase order
router.patch('/purchase-orders/:id/receive', checkRole(['ADMIN']), async (req: any, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({
        where: { id }
      });

      if (!order) {
        throw new Error('Purchase order not found');
      }

      if (order.status !== 'ADMIN_APPROVED') {
        throw new Error('Purchase order must be ADMIN_APPROVED to receive goods');
      }

      const updatedOrder = await tx.purchaseOrder.update({
        where: { id },
        data: { status: 'RECEIVED' }
      });

      const items = order.items as Array<{ id: string, quantity: number, name: string }>;
      
      for (const item of items) {
        // Atomic increment
        await tx.inventoryItem.update({
          where: { id: item.id },
          data: {
            currentStock: { increment: item.quantity }
          }
        });

        // Audit log
        await tx.inventoryAudit.create({
          data: {
            actionType: 'PURCHASE_ORDER',
            itemId: item.id,
            quantityChange: item.quantity,
            requestedById: order.managerId,
            approvedById: adminId // the person who marked it received, or maybe another field is better, but this works
          }
        });
      }

      return updatedOrder;
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error receiving purchase order:', error);
    res.status(400).json({ error: error.message || 'Failed to receive purchase order' });
  }
});

export default router;

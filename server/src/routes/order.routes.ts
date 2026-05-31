import { Router, Request, Response } from 'express';
import { generateOrderNumber } from '../utils';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/orders/active - Fetch pending orders for KDS
router.get('/orders/active', async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['PENDING', 'PREPARING', 'READY']
        }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active orders' });
  }
});

// POST /api/orders/finalize - Finalize order from POS
router.post('/orders/finalize', async (req: any, res: Response) => {
  const { items, waiterName, tableId, paymentMethod, totalAmount } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain items' });
  }

  try {
    const orderNumber = await generateOrderNumber();
    const receiptNumber = `REC-${Date.now()}`;

    // Transactional save
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          totalAmount,
          waiterName,
          tableId,
          status: 'PENDING',
          items: {
            create: items.map((item: any) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              priceAtTime: item.priceAtTime,
              notes: item.notes
            }))
          }
        },
        include: {
          items: {
            include: {
              menuItem: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      });

      // 2. Create Receipt
      await tx.receipt.create({
        data: {
          orderId: order.id,
          receiptNumber,
          paymentMethod
        }
      });

      return { order };
    });

    // Multi-printer routing logic (Phase 2.5)
    const KITCHEN_CATEGORIES = ['FOOD', 'DESSERTS', 'SPECIALS', 'APPETIZERS', 'MAIN COURSES'];
    const JUICE_CATEGORIES   = ['JUICE', 'DRINKS', 'BEVERAGES'];

    const kitchenItems = result.order.items.filter((item: any) => {
      const cat = item.menuItem.category.name.toUpperCase();
      return KITCHEN_CATEGORIES.includes(cat);
    });
    
    const juiceItems = result.order.items.filter((item: any) => {
      const cat = item.menuItem.category.name.toUpperCase();
      return JUICE_CATEGORIES.includes(cat);
    });

    const printPayload = {
      orderNumber,
      tableId,
      waiterName,
      timestamp: new Date(),
      payloadA: kitchenItems.map((i: any) => ({
        name: i.menuItem.name,
        quantity: i.quantity,
        notes: i.notes
      })),
      payloadB: juiceItems.map((i: any) => ({
        name: i.menuItem.name,
        quantity: i.quantity,
        notes: i.notes
      }))
    };

    // Emit Socket events
    const io = req.io;
    
    // Generic KDS update
    io.to('kitchen').emit('new-order', result.order);
    
    // specialized print event for local agent
    io.emit('PRINT_ORDER', printPayload);

    res.json(result);
  } catch (error) {
    console.error('Finalize order error:', error);
    res.status(500).json({ error: 'Failed to finalize order' });
  }
});

// PATCH /api/orders/:id/status - Update order status (KDS -> Waiter sync)
router.patch('/orders/:id/status', async (req: any, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate status against Prisma OrderStatus enum
  const validStatuses = ['PENDING', 'PREPARING', 'READY', 'PAID'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status: status as any },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    // Real-time Trigger: Emit Socket.io event
    const io = req.io;
    if (io) {
      io.emit('order-updated', order);
    }

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

export default router;

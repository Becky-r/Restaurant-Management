import { Router, Request, Response } from 'express';
import { generateOrderNumber } from '../utils';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/products
router.get('/products', async (req: Request, res: Response) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: { isAvailable: true }
    });
    // Map to expected format by the component
    res.json(items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price
    })));
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/orders (Simplified for the new PaymentProcessing component)
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const { items, total } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain items' });
    }

    const orderNumber = await generateOrderNumber();
    const receiptNumber = `REC-${Date.now()}`;

    const order = await prisma.$transaction(async (tx) => {
      // Create the order directly as PAID for this simplified POS
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          totalAmount: total,
          status: 'PAID',
          items: {
            create: items.map((item: any) => ({
              menuItemId: item.id, // we expect item.id to be the menuItemId (string)
              quantity: 1, // simplified since cart items are added individually in the UI
              priceAtTime: item.price
            }))
          }
        }
      });

      // Create Receipt
      await tx.receipt.create({
        data: {
          orderId: newOrder.id,
          receiptNumber,
          paymentMethod: 'CASH' // default for simple POS
        }
      });

      return newOrder;
    });

    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

export default router;

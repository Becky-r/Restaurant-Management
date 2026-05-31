import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/reports/monthly
router.get('/reports/monthly', async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: 'PAID'
      },
      select: {
        totalAmount: true,
        createdAt: true
      }
    });

    const monthlySales: Record<string, number> = {};

    orders.forEach((order) => {
      const monthYear = new Date(order.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlySales[monthYear]) {
        monthlySales[monthYear] = 0;
      }
      monthlySales[monthYear] += order.totalAmount;
    });

    const result = Object.entries(monthlySales).map(([month, total]) => ({
      month,
      total
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching monthly sales:', error);
    res.status(500).json({ error: 'Failed to fetch monthly sales data' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/admin/dashboard-stats — Live aggregated dashboard statistics
router.get('/admin/dashboard-stats', async (req: Request, res: Response) => {
  try {
    // Start of today (UTC)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      todayOrdersAgg,
      activeOrdersCount,
      allInventory,
      recentOrders,
      pendingSupplyRequests,
      pendingPurchaseOrders,
    ] = await Promise.all([
      // Today's orders count + revenue
      prisma.order.aggregate({
        where: {
          createdAt: { gte: todayStart },
        },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),

      // Active orders (PENDING or PREPARING)
      prisma.order.count({
        where: {
          status: { in: ['PENDING', 'PREPARING'] },
        },
      }),

      // Fetch all inventory to compute low-stock in JS
      // (Prisma doesn't support column-to-column comparison)
      prisma.inventoryItem.findMany({
        select: { currentStock: true, minStock: true },
      }),

      // 10 most recent orders
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          orderNumber: true,
          tableId: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
      }),

      // Pending Supply Requests
      prisma.supplyRequest.count({
        where: { status: 'PENDING' },
      }),

      // Pending Purchase Orders
      prisma.purchaseOrder.count({
        where: { status: 'PENDING' },
      }),
    ]);

    const lowStockCount = allInventory.filter(
      (i) => i.minStock > 0 && i.currentStock <= i.minStock
    ).length;

    res.json({
      todayOrders: todayOrdersAgg._count.id,
      todayRevenue: todayOrdersAgg._sum.totalAmount || 0,
      activeOrders: activeOrdersCount,
      lowStockItems: lowStockCount,
      pendingSupplyRequests,
      pendingPurchases: pendingPurchaseOrders,
      recentOrders,
    });
  } catch (error) {
    console.error('GET /admin/dashboard-stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;

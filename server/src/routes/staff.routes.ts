import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/staff — List all staff (filterable by ?role= and ?active=)
router.get('/staff', async (req: Request, res: Response) => {
  try {
    const { role, active } = req.query;
    const where: any = {};

    if (role && typeof role === 'string') {
      where.role = role.toUpperCase();
    }
    if (active === 'true') {
      where.isActive = true;
    } else if (active === 'false') {
      where.isActive = false;
    }

    const staff = await prisma.staff.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(staff);
  } catch (error) {
    console.error('GET /staff error:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// POST /api/staff — Create a new staff member
router.post('/staff', async (req: Request, res: Response) => {
  const { name, email, phone, role } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'name, email, and phone are required' });
  }

  try {
    const staff = await prisma.staff.create({
      data: {
        name,
        email,
        phone,
        role: role ? role.toUpperCase() : 'CASHIER',
      },
    });

    res.status(201).json(staff);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A staff member with this email already exists' });
    }
    console.error('POST /staff error:', error);
    res.status(500).json({ error: 'Failed to create staff member' });
  }
});

// PATCH /api/staff/:id — Update staff member fields
router.patch('/staff/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, role, isActive } = req.body;

  try {
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (role !== undefined) data.role = role.toUpperCase();
    if (isActive !== undefined) data.isActive = isActive;

    const staff = await prisma.staff.update({
      where: { id },
      data,
    });

    res.json(staff);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    console.error('PATCH /staff error:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
});

// DELETE /api/staff/:id — Soft-delete (set isActive = false)
router.delete('/staff/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const staff = await prisma.staff.update({
      where: { id },
      data: { isActive: false },
    });

    res.json(staff);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    console.error('DELETE /staff error:', error);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
});

// GET /api/staff/:id/stats — Order count and total sales for a staff member
router.get('/staff/:id/stats', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const [staff, aggregation] = await Promise.all([
      prisma.staff.findUnique({ where: { id } }),
      prisma.order.aggregate({
        where: { staffId: id },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
    ]);

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({
      staffId: id,
      name: staff.name,
      totalOrders: aggregation._count.id,
      totalSales: aggregation._sum.totalAmount || 0,
    });
  } catch (error) {
    console.error('GET /staff/:id/stats error:', error);
    res.status(500).json({ error: 'Failed to fetch staff stats' });
  }
});

export default router;

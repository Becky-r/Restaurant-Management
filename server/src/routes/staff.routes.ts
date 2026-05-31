import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/staff — List all staff
router.get('/', async (req: Request, res: Response) => {
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

    const staffList = await prisma.staff.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        password: true // We need this to check if it's set, but we won't return it
      }
    });

    // We'll also fetch aggregated stats for each staff member
    // In a real app with many staff, doing this per-staff might be a N+1 problem,
    // but Prisma's groupBy or manual mapping is okay for this scale.
    // However, it's easier to just fetch all orders grouped by staffId.
    const aggregations = await prisma.order.groupBy({
      by: ['staffId'],
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    const statsMap = new Map();
    for (const agg of aggregations) {
      if (agg.staffId) {
        statsMap.set(agg.staffId, {
          totalOrders: agg._count.id,
          totalSales: agg._sum.totalAmount || 0,
        });
      }
    }

    const formattedStaff = staffList.map(staff => {
      const stats = statsMap.get(staff.id) || { totalOrders: 0, totalSales: 0 };
      return {
        id: staff.id,
        name: staff.name,
        username: staff.username,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        isActive: staff.isActive,
        createdAt: staff.createdAt,
        passwordSet: !!staff.password,
        ...stats
      };
    });

    res.json({ success: true, data: formattedStaff });
  } catch (error) {
    console.error('GET /staff error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch staff' });
  }
});

// POST /api/staff — Create a new staff member
router.post('/', async (req: Request, res: Response) => {
  const { name, email, phone, role, username, password } = req.body;

  if (!name || !role || !username || !password) {
    return res.status(400).json({ success: false, error: 'name, role, username, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
  }

  const validRoles = ['ADMIN', 'CHEF', 'WAITER', 'CASHIER'];
  if (!validRoles.includes(role.toUpperCase())) {
    return res.status(400).json({ success: false, error: `Role must be one of: ${validRoles.join(', ')}` });
  }

  try {
    const existingUsername = await prisma.staff.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ success: false, error: 'Username is already taken' });
    }

    const staff = await prisma.staff.create({
      data: {
        name,
        username,
        email: email || `${username}@restaurant.local`,
        phone: phone || '',
        password,
        role: role.toUpperCase(),
      },
    });

    const { password: _, ...staffWithoutPassword } = staff;
    res.status(201).json({ success: true, data: staffWithoutPassword });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'A staff member with this email or username already exists' });
    }
    console.error('POST /staff error:', error);
    res.status(500).json({ success: false, error: 'Failed to create staff member' });
  }
});

// GET /api/staff/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const staff = await prisma.staff.findUnique({
      where: { id: id as string }
    });

    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    const aggregation = await prisma.order.aggregate({
      where: { staffId: id as string },
      _count: { id: true },
      _sum: { totalAmount: true },
    });

    const { password: _, ...staffWithoutPassword } = staff;
    
    res.json({
      success: true,
      data: {
        ...staffWithoutPassword,
        totalOrders: aggregation._count?.id || 0,
        totalSales: aggregation._sum?.totalAmount || 0,
      }
    });
  } catch (error) {
    console.error('GET /staff/:id error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch staff details' });
  }
});

// PATCH /api/staff/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, role, isActive, username, password } = req.body;

  try {
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    
    if (role !== undefined) {
      const validRoles = ['ADMIN', 'CHEF', 'WAITER', 'CASHIER'];
      if (!validRoles.includes(role.toUpperCase())) {
        return res.status(400).json({ success: false, error: `Role must be one of: ${validRoles.join(', ')}` });
      }
      data.role = role.toUpperCase();
    }
    
    if (isActive !== undefined) data.isActive = isActive;

    if (username !== undefined) {
      const existing = await prisma.staff.findUnique({ where: { username } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ success: false, error: 'Username is already taken' });
      }
      data.username = username;
    }

    if (password !== undefined) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
      }
      data.password = password;
    }

    const staff = await prisma.staff.update({
      where: { id: id as string },
      data,
    });

    const { password: _, ...staffWithoutPassword } = staff;
    res.json({ success: true, data: staffWithoutPassword });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }
    console.error('PATCH /staff error:', error);
    res.status(500).json({ success: false, error: 'Failed to update staff member' });
  }
});

// POST /api/staff/:id/reset-credentials
router.post('/:id/reset-credentials', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, password } = req.body;

  if (!username && !password) {
    return res.status(400).json({ success: false, error: 'Must provide either username or password' });
  }

  try {
    const data: any = {};
    
    if (username) {
      const existing = await prisma.staff.findUnique({ where: { username } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ success: false, error: 'Username is already taken' });
      }
      data.username = username;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
      }
      data.password = password;
    }

    const staff = await prisma.staff.update({
      where: { id: id as string },
      data,
    });

    const { password: _, ...staffWithoutPassword } = staff;
    res.json({ success: true, data: staffWithoutPassword });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }
    console.error('POST /staff/:id/reset-credentials error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset credentials' });
  }
});

// DELETE /api/staff/:id (Soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const staff = await prisma.staff.update({
      where: { id: id as string },
      data: { isActive: false },
    });

    const { password: _, ...staffWithoutPassword } = staff;
    res.json({ success: true, data: staffWithoutPassword });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }
    console.error('DELETE /staff error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete staff member' });
  }
});

// DELETE /api/staff/:id/permanent (Hard delete)
router.delete('/:id/permanent', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.staff.delete({
      where: { id: id as string }
    });

    res.json({ success: true, data: { deleted: true } });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }
    // Prisma will throw a foreign key constraint error (P2003) if there are linked orders
    if (error.code === 'P2003') {
      return res.status(400).json({ success: false, error: 'Cannot permanently delete a staff member with associated orders or audit logs.' });
    }
    console.error('DELETE /staff/:id/permanent error:', error);
    res.status(500).json({ success: false, error: 'Failed to permanently delete staff member' });
  }
});

export default router;

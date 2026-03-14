import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Simple API Key middleware for admin routes
const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey === process.env.API_KEY || process.env.NODE_ENV === 'development') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// PUBLIC API
router.get('/public/menu', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        items: {
          where: { isAvailable: true },
        },
      },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// ADMIN API
router.get('/admin/menu', adminAuth, async (req: Request, res: Response) => {
  try {
    const items = await prisma.menuItem.findMany({
      include: { category: true },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin menu' });
  }
});

router.post('/admin/menu', adminAuth, async (req: Request, res: Response) => {
  const { name, description, price, image, isAvailable, categoryId } = req.body;
  
  if (!name || !price || !categoryId) {
    return res.status(400).json({ error: 'Name, price, and category are required' });
  }

  try {
    const item = await prisma.menuItem.create({
      data: { name, description: description || "", price: parseFloat(price), image, isAvailable, categoryId },
    });
    res.json(item);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

router.patch('/admin/menu/:id', adminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  if (data.price) data.price = parseFloat(data.price);
  
  try {
    const item = await prisma.menuItem.update({
      where: { id: id as string },
      data,
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

router.delete('/admin/menu/:id', adminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.menuItem.delete({
      where: { id: id as string },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// Category helper for admin (to add categories)
router.post('/admin/categories', adminAuth, async (req: Request, res: Response) => {
  const { name, orderIndex } = req.body;
  try {
    const category = await prisma.category.create({
      data: { name, orderIndex: parseInt(orderIndex) },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

export default router;

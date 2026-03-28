import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

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

router.post('/admin/menu', adminAuth, upload.single('image'), async (req: Request, res: Response) => {
  const { name, description, price, isAvailable, categoryId } = req.body;
  
  if (!name || !price || !categoryId) {
    return res.status(400).json({ error: 'Name, price, and category are required' });
  }

  try {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.image || null);
    const item = await prisma.menuItem.create({
      data: {
        name,
        description: description || "",
        price: parseFloat(price),
        image: imageUrl,
        isAvailable: isAvailable === 'true' || isAvailable === true,
        categoryId,
      },
    });
    res.json(item);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

router.patch('/admin/menu/:id', adminAuth, upload.single('image'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, price, isAvailable, categoryId } = req.body;
  
  try {
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable === 'true' || isAvailable === true;
    if (req.file) updateData.image = `/uploads/${req.file.filename}`;

    const item = await prisma.menuItem.update({
      where: { id: id as string },
      data: updateData,
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

router.get('/admin/categories', adminAuth, async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { orderIndex: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/admin/categories', adminAuth, async (req: Request, res: Response) => {
  const { name, orderIndex } = req.body;
  try {
    const category = await prisma.category.create({
      data: { name, orderIndex: orderIndex ? parseInt(orderIndex) : 0 },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

export default router;

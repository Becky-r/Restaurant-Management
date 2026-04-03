import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/inventory — List all items (filterable by ?category= and ?stockLevel=low|out)
router.get('/inventory', async (req: Request, res: Response) => {
  try {
    const { category, stockLevel } = req.query;
    const where: any = {};

    if (category && typeof category === 'string') {
      where.category = category;
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    let result = items;

    // Post-filter by stock level (requires comparing columns)
    if (stockLevel === 'low') {
      result = items.filter((i) => i.currentStock > 0 && i.currentStock <= i.minStock);
    } else if (stockLevel === 'out') {
      result = items.filter((i) => i.currentStock === 0);
    }

    res.json(result);
  } catch (error) {
    console.error('GET /inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST /api/inventory — Create a new inventory item
router.post('/inventory', async (req: Request, res: Response) => {
  const { name, category, unit, currentStock, minStock, maxStock, unitCost, supplier } = req.body;

  if (!name || !category || !unit) {
    return res.status(400).json({ error: 'name, category, and unit are required' });
  }

  try {
    const item = await prisma.inventoryItem.create({
      data: {
        name,
        category,
        unit,
        currentStock: currentStock ?? 0,
        minStock: minStock ?? 0,
        maxStock: maxStock ?? 0,
        unitCost: unitCost ?? 0,
        supplier: supplier || null,
        lastRestocked: currentStock > 0 ? new Date() : null,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('POST /inventory error:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// PATCH /api/inventory/:id — Update item fields
router.patch('/inventory/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, category, unit, currentStock, minStock, maxStock, unitCost, supplier } = req.body;

  try {
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category;
    if (unit !== undefined) data.unit = unit;
    if (currentStock !== undefined) data.currentStock = currentStock;
    if (minStock !== undefined) data.minStock = minStock;
    if (maxStock !== undefined) data.maxStock = maxStock;
    if (unitCost !== undefined) data.unitCost = unitCost;
    if (supplier !== undefined) data.supplier = supplier;

    const item = await prisma.inventoryItem.update({
      where: { id },
      data,
    });

    res.json(item);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    console.error('PATCH /inventory error:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// DELETE /api/inventory/:id — Delete an inventory item
router.delete('/inventory/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.inventoryItem.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    console.error('DELETE /inventory error:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// POST /api/inventory/:id/restock — Add to currentStock and update lastRestocked
router.post('/inventory/:id/restock', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'quantity must be a positive number' });
  }

  try {
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        currentStock: { increment: quantity },
        lastRestocked: new Date(),
      },
    });

    res.json(item);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    console.error('POST /inventory/:id/restock error:', error);
    res.status(500).json({ error: 'Failed to restock item' });
  }
});

// POST /api/inventory/:id/deduct — Chef → Inventory Manager "Allow" flow
// Atomically deducts stock; rejects if resulting stock < 0
router.post('/inventory/:id/deduct', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'quantity must be a positive number' });
  }

  try {
    // Use a transaction to ensure atomic check-and-deduct
    const item = await prisma.$transaction(async (tx) => {
      const current = await tx.inventoryItem.findUnique({ where: { id } });

      if (!current) {
        throw new Error('NOT_FOUND');
      }

      if (current.currentStock < quantity) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      return tx.inventoryItem.update({
        where: { id },
        data: {
          currentStock: { decrement: quantity },
        },
      });
    });

    res.json(item);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    if (error.message === 'INSUFFICIENT_STOCK') {
      return res.status(400).json({ error: 'Insufficient stock for this deduction' });
    }
    console.error('POST /inventory/:id/deduct error:', error);
    res.status(500).json({ error: 'Failed to deduct stock' });
  }
});

export default router;

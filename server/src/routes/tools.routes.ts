import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/tools
router.get('/tools', async (req: Request, res: Response) => {
  try {
    const tools = await prisma.tool.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(tools);
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ error: 'Failed to fetch tools data' });
  }
});

// POST /api/tools (Optional: for testing purposes to create tools)
router.post('/tools', async (req: Request, res: Response) => {
  try {
    const { name, status } = req.body;
    const tool = await prisma.tool.create({
      data: { name, status }
    });
    res.json(tool);
  } catch (error) {
    console.error('Error creating tool:', error);
    res.status(500).json({ error: 'Failed to create tool' });
  }
});

export default router;

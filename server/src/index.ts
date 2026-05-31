import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import menuRoutes from './routes/menu.routes';
import orderRoutes from './routes/order.routes';
import staffRoutes from './routes/staff.routes';
import inventoryRoutes from './routes/inventory.routes';
import dashboardRoutes from './routes/dashboard.routes';
import supplyRequestsRoutes from './routes/supply-requests.routes';
import purchaseOrdersRoutes from './routes/purchase-orders.routes';
import inventoryAuditRoutes from './routes/inventory-audit.routes';
import reportsRoutes from './routes/reports.routes';
import toolsRoutes from './routes/tools.routes';
import posRoutes from './routes/pos.routes';

import authRoutes from './routes/auth.routes';
import { verifyToken, checkRole } from './middleware/auth.middleware';
import prisma from './lib/prisma';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  },
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));


// Seed fixed categories on startup
const FIXED_CATEGORIES = ['Food', 'Drinks', 'Juice', 'Desserts', 'Specials'];
const seedCategories = async () => {
  for (let i = 0; i < FIXED_CATEGORIES.length; i++) {
    const name = FIXED_CATEGORIES[i];
    const existing = await prisma.category.findFirst({ where: { name } });
    if (!existing) {
      await prisma.category.create({ data: { name, orderIndex: i } });
      console.log(`Seeded category: ${name}`);
    }
  }
};
seedCategories().catch(console.error);

// Socket.io
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-kitchen', () => {
    socket.join('kitchen');
    console.log(`Socket ${socket.id} joined kitchen room`);
  });

  socket.on('join-inventory', () => {
    socket.join('inventory');
    console.log(`Socket ${socket.id} joined inventory room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Middleware to inject io into routes
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

// Public Routes
app.use('/api', authRoutes);
app.use('/api', menuRoutes); // Registered before verifyToken so /api/public/menu is accessible without auth. Admin routes inside have their own adminAuth guard.

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Protected Routes (Require JWT)
app.use('/api/*', verifyToken); // Apply to all subsequent /api routes

// Waiters, Cashiers, Chefs, Admin can access these based on specific logic inside if needed,
// but for now we protect them with general authentication
app.use('/api', orderRoutes);
app.use('/api', posRoutes);

// Admin-Only Routes
app.use('/api/admin', checkRole(['ADMIN']));
app.use('/api/staff', checkRole(['ADMIN']), staffRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', supplyRequestsRoutes);
app.use('/api', purchaseOrdersRoutes);
app.use('/api', inventoryAuditRoutes);
app.use('/api', reportsRoutes);
app.use('/api', toolsRoutes);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;

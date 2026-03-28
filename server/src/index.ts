import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import menuRoutes from './routes/menu.routes';
import orderRoutes from './routes/order.routes';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const prisma = new PrismaClient();

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

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Middleware to inject io into routes
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api', menuRoutes);
app.use('/api', orderRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

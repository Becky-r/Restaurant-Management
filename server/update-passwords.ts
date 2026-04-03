import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateCredentials() {
  console.log('Updating credentials...');

  try {
    const adminHash = await bcrypt.hash('password123', 10);
    const chefHash = await bcrypt.hash('pasword123', 10); // Extracted exact spelling from prompt
    const cashierHash = await bcrypt.hash('password123', 10);

    // Update or Create Admin
    await prisma.staff.upsert({
      where: { username: 'admin' },
      update: { password: adminHash, role: 'ADMIN', isActive: true },
      create: { name: 'Admin', username: 'admin', email: 'admin@local.test', phone: '0001', role: 'ADMIN', password: adminHash, isActive: true },
    });
    console.log('Admin account updated: admin / password123');

    // Update or Create Chef
    await prisma.staff.upsert({
      where: { username: 'chefs' },
      update: { password: chefHash, role: 'CHEF', isActive: true },
      create: { name: 'Chefs', username: 'chefs', email: 'chefs@local.test', phone: '0002', role: 'CHEF', password: chefHash, isActive: true },
    });
    console.log('Chef account updated: chefs / pasword123');

    // Update or Create Cashier
    await prisma.staff.upsert({
      where: { username: 'cashier' },
      update: { password: cashierHash, role: 'CASHIER', isActive: true },
      create: { name: 'Cashier', username: 'cashier', email: 'cashier@local.test', phone: '0003', role: 'CASHIER', password: cashierHash, isActive: true },
    });
    console.log('Cashier account updated: cashier / password123');

  } catch (error) {
    console.error('Error updating credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCredentials();

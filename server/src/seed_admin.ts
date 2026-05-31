import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminHash = 'admin123';
  const chefHash = 'chef123';
  const waiterHash = 'waiter123';
  const cashierHash = 'cashier123';

  // 1. Admin
  await prisma.staff.upsert({
    where: { username: 'admin' },
    update: { password: adminHash, role: 'ADMIN', isActive: true },
    create: { name: 'System Admin', username: 'admin', email: 'admin@restaurant.com', phone: '1000', password: adminHash, role: 'ADMIN' }
  });

  // 2. Second Admin
  await prisma.staff.upsert({
    where: { username: 'admin2' },
    update: { password: adminHash, role: 'ADMIN', isActive: true },
    create: { name: 'Backup Admin', username: 'admin2', email: 'admin2@restaurant.com', phone: '1001', password: adminHash, role: 'ADMIN' }
  });

  // 3. Chef
  await prisma.staff.upsert({
    where: { username: 'chef1' },
    update: { password: chefHash, role: 'CHEF', isActive: true },
    create: { name: 'Head Chef', username: 'chef1', email: 'chef1@restaurant.com', phone: '2000', password: chefHash, role: 'CHEF' }
  });

  // 4. Waiter
  await prisma.staff.upsert({
    where: { username: 'waiter1' },
    update: { password: waiterHash, role: 'WAITER', isActive: true },
    create: { name: 'Lead Waiter', username: 'waiter1', email: 'waiter1@restaurant.com', phone: '3000', password: waiterHash, role: 'WAITER' }
  });

  // 5. Cashier
  await prisma.staff.upsert({
    where: { username: 'cashier1' },
    update: { password: cashierHash, role: 'CASHIER', isActive: true },
    create: { name: 'Front Desk', username: 'cashier1', email: 'cashier1@restaurant.com', phone: '4000', password: cashierHash, role: 'CASHIER' }
  });

  const credentials = [
    { role: 'ADMIN', username: 'admin', password: 'admin123' },
    { role: 'ADMIN', username: 'admin2', password: 'admin123' },
    { role: 'CHEF', username: 'chef1', password: 'chef123' },
    { role: 'WAITER', username: 'waiter1', password: 'waiter123' },
    { role: 'CASHIER', username: 'cashier1', password: 'cashier123' }
  ];

  console.log('\n--- Seed Complete! Staff Credentials ---');
  console.table(credentials);
  console.log('----------------------------------------\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

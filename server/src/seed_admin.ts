import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.staff.findFirst({
    where: { role: 'ADMIN' }
  });

  const hashedPassword = await bcrypt.hash('admin123', 10);

  if (existingAdmin) {
    console.log('Admin already exists, updating credentials...');
    await prisma.staff.update({
      where: { id: existingAdmin.id },
      data: {
        username: 'admin',
        password: hashedPassword,
      }
    });
    console.log('Admin credentials updated! Username: admin, Password: admin123');
  } else {
    // There was an existing staff member in the DB, let's just make sure there is an admin
    console.log('Creating new admin user...');
    await prisma.staff.create({
      data: {
        name: 'System Admin',
        username: 'admin',
        email: 'admin@restaurant.com',
        phone: '1234567890',
        password: hashedPassword,
        role: 'ADMIN',
      }
    });
    console.log('Admin created! Username: admin, Password: admin123');
  }

  // Update existing staffs without username/password to have defaults so we can make the fields mandatory later
  const staffsWithoutCreds = await prisma.staff.findMany({
    where: { OR: [{ username: null }, { password: null }] }
  });

  if (staffsWithoutCreds.length > 0) {
    const defaultPassword = await bcrypt.hash('password123', 10);
    for (const staff of staffsWithoutCreds) {
      await prisma.staff.update({
        where: { id: staff.id },
        data: {
          username: `user_${staff.id.substring(0,6)}`,
          password: defaultPassword
        }
      });
      console.log(`Updated staff ${staff.name} with default credentials`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

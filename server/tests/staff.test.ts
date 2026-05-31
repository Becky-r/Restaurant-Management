import request from 'supertest';
import app from '../src/index';
import prisma from '../src/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

jest.setTimeout(30000);

describe('Staff Routes Integration Tests', () => {
  let adminToken: string;
  let nonAdminToken: string;
  let testStaffId: string;
  const uniqueSuffix = Date.now().toString();
  const adminUsername = `test_admin_${uniqueSuffix}`;
  const nonAdminUsername = `test_chef_${uniqueSuffix}`;
  
  beforeAll(async () => {
    // Create an admin user for testing
    const adminPassword = 'admin123';
    const admin = await prisma.staff.create({
      data: {
        name: 'Test Admin',
        username: adminUsername,
        email: `${adminUsername}@test.local`,
        phone: '123456',
        password: adminPassword,
        role: 'ADMIN',
        isActive: true,
      }
    });

    adminToken = jwt.sign({ id: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '1h' });

    // Create a non-admin user for testing role checks
    const chefPassword = 'chef123';
    const chef = await prisma.staff.create({
      data: {
        name: 'Test Chef',
        username: nonAdminUsername,
        email: `${nonAdminUsername}@test.local`,
        phone: '123456',
        password: chefPassword,
        role: 'CHEF',
        isActive: true,
      }
    });

    nonAdminToken = jwt.sign({ id: chef.id, role: chef.role }, JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    // Cleanup created test users
    await prisma.staff.deleteMany({
      where: {
        username: {
          contains: uniqueSuffix
        }
      }
    });
    await prisma.$disconnect();
  });

  describe('Auth and Roles', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/staff');
      expect(res.status).toBe(401);
    });

    it('should reject non-admin request with 403', async () => {
      const res = await request(app).get('/api/staff').set('Authorization', `Bearer ${nonAdminToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/staff', () => {
    it('should allow admin to create a staff member', async () => {
      const newStaff = {
        name: 'New Waiter',
        username: `new_waiter_${uniqueSuffix}`,
        password: 'password123',
        role: 'WAITER'
      };

      const res = await request(app)
        .post('/api/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newStaff);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe(newStaff.username);
      expect(res.body.data.password).toBeUndefined(); // Should not return password hash
      
      testStaffId = res.body.data.id;
    });

    it('should reject creation with a duplicate username', async () => {
      const duplicateStaff = {
        name: 'Another Waiter',
        username: `new_waiter_${uniqueSuffix}`, // Same username as previous
        password: 'password123',
        role: 'WAITER'
      };

      const res = await request(app)
        .post('/api/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateStaff);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('taken');
    });

    it('should reject creation with a short password', async () => {
      const shortPassStaff = {
        name: 'Short Pass Waiter',
        username: `short_pass_${uniqueSuffix}`,
        password: '123',
        role: 'WAITER'
      };

      const res = await request(app)
        .post('/api/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(shortPassStaff);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('6 characters');
    });
  });

  describe('GET /api/staff', () => {
    it('should allow admin to retrieve staff list', async () => {
      const res = await request(app)
        .get('/api/staff')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      const staffMem = res.body.data.find((s: any) => s.id === testStaffId);
      expect(staffMem).toBeDefined();
      expect(staffMem.username).toBe(`new_waiter_${uniqueSuffix}`);
      expect(staffMem.passwordSet).toBe(true);
      expect(staffMem.password).toBeUndefined();
    });
  });

  describe('POST /api/staff/:id/reset-credentials', () => {
    it('should allow admin to update a staff member password', async () => {
      // First get current hash from DB directly to compare
      const beforeUpdate = await prisma.staff.findUnique({ where: { id: testStaffId } });
      
      const res = await request(app)
        .post(`/api/staff/${testStaffId}/reset-credentials`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: 'newpassword123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify the hash changed in the DB
      const afterUpdate = await prisma.staff.findUnique({ where: { id: testStaffId } });
      expect(afterUpdate?.password).not.toBe(beforeUpdate?.password);
    });
  });

  describe('DELETE /api/staff/:id', () => {
    it('should allow admin to soft-delete a staff member', async () => {
      const res = await request(app)
        .delete(`/api/staff/${testStaffId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);

      // Verify in DB
      const dbCheck = await prisma.staff.findUnique({ where: { id: testStaffId } });
      expect(dbCheck?.isActive).toBe(false);
    });
  });
});

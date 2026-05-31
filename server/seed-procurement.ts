import prisma from './src/lib/prisma';


async function seedProcurement() {
  console.log('Injecting seed data for Supply Requests and Purchase Orders...');

  try {
    // 1. Get staff members
    let admin = await prisma.staff.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
      admin = await prisma.staff.create({
        data: {
          name: 'Admin User',
          username: 'admin_procurement',
          email: 'admin@procurement.com',
          password: 'password123',
          phone: '1234567890',
          role: 'ADMIN',
        }
      });
    }

    let chef = await prisma.staff.findFirst({ where: { role: 'CHEF' } });
    if (!chef) {
      chef = await prisma.staff.create({
        data: {
          name: 'Chef User',
          username: 'chef_procurement',
          email: 'chef@procurement.com',
          password: 'password123',
          phone: '1234567891',
          role: 'CHEF',
        }
      });
    }

    // 2. Get or create some inventory items
    let items = await prisma.inventoryItem.findMany({ take: 3 });
    if (items.length < 3) {
      // seed items
      await prisma.inventoryItem.createMany({
        data: [
          { name: 'Flour ' + Date.now(), category: 'Dry Goods', unit: 'kg', currentStock: 2, minStock: 5, maxStock: 50, unitCost: 30 },
          { name: 'Tomatoes ' + Date.now(), category: 'Vegetables', unit: 'kg', currentStock: 1, minStock: 10, maxStock: 20, unitCost: 15 },
          { name: 'Cooking Oil ' + Date.now(), category: 'Pantry', unit: 'liters', currentStock: 5, minStock: 10, maxStock: 30, unitCost: 120 }
        ]
      });
      items = await prisma.inventoryItem.findMany({ take: 3 });
    }

    // 3. Create a pending Supply Request from Chef
    const supplyReq = await prisma.supplyRequest.create({
      data: {
        chefId: chef.id,
        items: [
          { id: items[0].id, name: items[0].name, quantity: 2 },
          { id: items[1].id, name: items[1].name, quantity: 5 }
        ],
        status: 'PENDING'
      }
    });

    console.log(`Created Supply Request ID: ${supplyReq.id}`);

    // 4. Create an already APPROVED Supply Request
    const approvedSupReq = await prisma.supplyRequest.create({
      data: {
        chefId: chef.id,
        managedById: admin.id,
        items: [
          { id: items[2].id, name: items[2].name, quantity: 1 }
        ],
        status: 'APPROVED'
      }
    });

    // matching audit for the approved supply request
    await prisma.inventoryAudit.create({
      data: {
        actionType: 'SUPPLY_REQUEST',
        itemId: items[2].id,
        quantityChange: -1,
        requestedById: chef.id,
        approvedById: admin.id
      }
    });

    console.log(`Created Approved Supply Request ID: ${approvedSupReq.id}`);

    // 5. Create a PENDING Purchase Order from Inventory Manager
    const po1 = await prisma.purchaseOrder.create({
      data: {
        managerId: admin.id,
        status: 'PENDING',
        totalEstimatedCost: 1500,
        items: [
          { id: items[0].id, name: items[0].name, quantity: 20 },
          { id: items[1].id, name: items[1].name, quantity: 15 }
        ]
      }
    });

    console.log(`Created Pending Purchase Order ID: ${po1.id}`);

    // 6. Create an ADMIN_APPROVED Purchase Order waiting to be received
    const po2 = await prisma.purchaseOrder.create({
      data: {
        managerId: admin.id,
        status: 'ADMIN_APPROVED',
        totalEstimatedCost: 600,
        items: [
          { id: items[2].id, name: items[2].name, quantity: 5 }
        ]
      }
    });

    console.log(`Created Admin Approved Purchase Order ID: ${po2.id}`);

    // 7. Create a RECEIVED Purchase Order
    const po3 = await prisma.purchaseOrder.create({
      data: {
        managerId: admin.id,
        status: 'RECEIVED',
        totalEstimatedCost: 300,
        items: [
          { id: items[0].id, name: items[0].name, quantity: 10 }
        ]
      }
    });

    // matching audit for the received purchase order
    await prisma.inventoryAudit.create({
      data: {
        actionType: 'PURCHASE_ORDER',
        itemId: items[0].id,
        quantityChange: 10,
        requestedById: admin.id,
        approvedById: admin.id
      }
    });

    console.log(`Created Received Purchase Order ID: ${po3.id}`);

    console.log('Seed injection complete!');
  } catch (error) {
    console.error('Error injecting data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedProcurement();

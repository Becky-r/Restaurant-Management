'use server'

import { pool } from './db';
import { Order, OrderItem } from './types';

export async function getKitchenOrders(): Promise<Order[]> {
        const client = await pool.connect();
        try {
                const res = await client.query(`
      SELECT
        o.id,
        o.customer_name,
        o.table_number,
        o.total_amount,
        o.status,
        o.created_at,
        o.special_instructions,
        o.order_type,
        o.payment_method,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'item_id', oi.item_id, 
              'name', oi.name,
              'price', oi.price,
              'quantity', oi.quantity
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status IN ('pending', 'new', 'preparing')
      GROUP BY o.id
      ORDER BY o.created_at ASC
    `);

                // Transform DB rows to Order type
                return res.rows.map((row: any) => {
                        const items = (row.items || []).map((item: any): OrderItem => ({
                                menuItem: {
                                        id: item.item_id || item.id || 'unknown',
                                        name: item.name || 'Unknown Item',
                                        description: '',
                                        price: parseFloat(item.price || '0'),
                                        category: 'food',
                                        available: true,
                                        ingredients: [],
                                        preparationTime: 15, // Default prep time
                                        allergens: []
                                },
                                quantity: parseInt(item.quantity || '1'),
                                price: parseFloat(item.price || '0'),
                                notes: ''
                        }));

                        // Map status
                        let status: Order['status'] = 'new';
                        if (row.status === 'pending') status = 'new';
                        else if (['preparing', 'ready', 'served', 'cancelled'].includes(row.status)) {
                                status = row.status as Order['status'];
                        }

                        return {
                                id: row.id.toString(),
                                orderNumber: row.id.toString().padStart(4, '0'),
                                tableNumber: row.table_number?.toString(),
                                customerName: row.customer_name,
                                orderType: (row.order_type as any) || 'dine-in',
                                status: status,
                                items: items,
                                subtotal: parseFloat(row.total_amount || '0'),
                                tax: 0,
                                total: parseFloat(row.total_amount || '0'),
                                paymentMethod: row.payment_method as any,
                                paymentStatus: 'pending',
                                createdAt: new Date(row.created_at),
                                updatedAt: new Date(row.created_at),
                                staffId: 'system',
                                notes: row.special_instructions,
                                estimatedReadyTime: new Date(new Date(row.created_at).getTime() + 30 * 60000) // +30 mins default
                        };
                });
        } catch (error) {
                console.error('Error fetching kitchen orders:', error);
                return [];
        } finally {
                client.release();
        }
}

export async function updateKitchenOrderStatus(orderId: string, status: Order['status']): Promise<void> {
        const client = await pool.connect();
        try {
                let dbStatus = status;
                // Map UI status back to DB status if needed. 
                // Assuming DB uses 'pending' instead of 'new'
                if (status === 'new') dbStatus = 'pending' as any;

                await client.query('UPDATE orders SET status = $1 WHERE id = $2', [dbStatus, orderId]);
        } catch (error) {
                console.error('Error updating order status:', error);
                throw error;
        } finally {
                client.release();
        }
}

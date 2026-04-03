'use client'

// Deprecated: Moving to direct API calls for better performance and Prisma support.
// Use fetch("http://localhost:4000/api/orders/active") instead.

export async function getKitchenOrders(): Promise<any[]> {
        console.warn("getKitchenOrders is deprecated. Use API instead.");
        return [];
}

export async function updateKitchenOrderStatus(orderId: string, status: string): Promise<void> {
        console.warn("updateKitchenOrderStatus is deprecated. Use PATCH /api/orders/:id/status instead.");
}

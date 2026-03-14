export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: "food" | "drinks" | "combos"
  image?: string
  available: boolean
  ingredients: string[]
  preparationTime: number // in minutes
  allergens?: string[]
}

export interface OrderItem {
  menuItem: MenuItem
  quantity: number
  notes?: string
  price: number
}

export interface Order {
  id: string
  orderNumber: string
  items: OrderItem[]
  tableNumber?: string
  customerName?: string
  orderType: "dine-in" | "takeaway" | "delivery"
  status: "new" | "preparing" | "ready" | "served" | "cancelled"
  notes?: string
  subtotal: number
  tax: number
  total: number
  paymentMethod?: "cash" | "card" | "telebirr" | "mobile"
  paymentStatus: "pending" | "paid" | "refunded"
  createdAt: Date
  updatedAt: Date
  staffId: string
  estimatedReadyTime?: Date
}

export interface Staff {
  id: string
  name: string
  email: string
  phone: string
  role: "admin" | "cashier" | "waiter" | "chef"
  isActive: boolean
  createdAt: Date
  lastLogin?: Date
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  unitCost: number
  supplier?: string
  lastRestocked?: Date
  expiryDate?: Date
}

export interface Table {
  id: string
  number: string
  capacity: number
  status: "available" | "occupied" | "reserved" | "cleaning"
  currentOrderId?: string
}

export interface PaymentTransaction {
  id: string
  orderId: string
  amount: number
  method: "cash" | "card" | "telebirr" | "mobile"
  status: "completed" | "pending" | "failed"
  transactionId?: string
  timestamp: Date
}

export interface SalesReport {
  date: string
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  topSellingItems: { item: string; quantity: number; revenue: number }[]
  paymentMethodBreakdown: Record<string, number>
}

export interface AttendanceRecord {
  id: string
  staffId: string
  date: string
  clockIn: Date
  clockOut?: Date
  totalHours?: number
  status: "present" | "absent" | "late"
}

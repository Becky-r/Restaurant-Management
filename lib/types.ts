export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: "food" | "drinks" | "combos" | any // Allowing any for Category object
  image?: string
  isAvailable: boolean
  ingredients: string[]
  preparationTime: number // in minutes
  allergens?: string[]
}

export interface OrderItem {
  id: string
  orderId: string
  menuItemId: string
  menuItem: MenuItem
  quantity: number
  priceAtTime: number
  notes?: string
}

export interface Order {
  id: string
  orderNumber: string
  items: OrderItem[]
  tableId?: string
  waiterName?: string
  status: "PENDING" | "PREPARING" | "READY" | "PAID"
  createdAt: Date
  updatedAt: Date
  staffId?: string
  receipt?: any
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

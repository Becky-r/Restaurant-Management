import type { MenuItem, Order, Staff, InventoryItem, Table, PaymentTransaction, AttendanceRecord } from "./types"

class DataStore {
  private getStorageKey(key: string): string {
    return `restaurant_${key}`
  }

  // Generic storage methods
  private getFromStorage<T>(key: string): T[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(this.getStorageKey(key))
    return data ? JSON.parse(data) : []
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(this.getStorageKey(key), JSON.stringify(data))
  }

  // Menu Items
  getMenuItems(): MenuItem[] {
    return this.getFromStorage<MenuItem>("menu_items")
  }

  saveMenuItem(item: MenuItem): void {
    const items = this.getMenuItems()
    const existingIndex = items.findIndex((i) => i.id === item.id)
    if (existingIndex >= 0) {
      items[existingIndex] = item
    } else {
      items.push(item)
    }
    this.saveToStorage("menu_items", items)
  }

  deleteMenuItem(id: string): void {
    const items = this.getMenuItems().filter((i) => i.id !== id)
    this.saveToStorage("menu_items", items)
  }

  // Orders
  getOrders(): Order[] {
    const orders = this.getFromStorage<Order>("orders")
    return orders.map((order) => ({
      ...order,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
      estimatedReadyTime: order.estimatedReadyTime ? new Date(order.estimatedReadyTime) : undefined,
    }))
  }

  saveOrder(order: Order): void {
    const orders = this.getOrders()
    const existingIndex = orders.findIndex((o) => o.id === order.id)
    if (existingIndex >= 0) {
      orders[existingIndex] = order
    } else {
      orders.push(order)
    }
    this.saveToStorage("orders", orders)
  }

  // Staff
  getStaff(): Staff[] {
    const staff = this.getFromStorage<Staff>("staff")
    return staff.map((s) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      lastLogin: s.lastLogin ? new Date(s.lastLogin) : undefined,
    }))
  }

  saveStaff(staff: Staff): void {
    const staffList = this.getStaff()
    const existingIndex = staffList.findIndex((s) => s.id === staff.id)
    if (existingIndex >= 0) {
      staffList[existingIndex] = staff
    } else {
      staffList.push(staff)
    }
    this.saveToStorage("staff", staffList)
  }

  // Inventory
  getInventoryItems(): InventoryItem[] {
    const items = this.getFromStorage<InventoryItem>("inventory")
    return items.map((item) => ({
      ...item,
      lastRestocked: item.lastRestocked ? new Date(item.lastRestocked) : undefined,
      expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
    }))
  }

  saveInventoryItem(item: InventoryItem): void {
    const items = this.getInventoryItems()
    const existingIndex = items.findIndex((i) => i.id === item.id)
    if (existingIndex >= 0) {
      items[existingIndex] = item
    } else {
      items.push(item)
    }
    this.saveToStorage("inventory", items)
  }

  // Tables
  getTables(): Table[] {
    return this.getFromStorage<Table>("tables")
  }

  saveTable(table: Table): void {
    const tables = this.getTables()
    const existingIndex = tables.findIndex((t) => t.id === table.id)
    if (existingIndex >= 0) {
      tables[existingIndex] = table
    } else {
      tables.push(table)
    }
    this.saveToStorage("tables", tables)
  }

  // Payments
  getPaymentTransactions(): PaymentTransaction[] {
    const transactions = this.getFromStorage<PaymentTransaction>("payments")
    return transactions.map((t) => ({
      ...t,
      timestamp: new Date(t.timestamp),
    }))
  }

  savePaymentTransaction(transaction: PaymentTransaction): void {
    const transactions = this.getPaymentTransactions()
    transactions.push(transaction)
    this.saveToStorage("payments", transactions)
  }

  // Attendance
  getAttendanceRecords(): AttendanceRecord[] {
    const records = this.getFromStorage<AttendanceRecord>("attendance")
    return records.map((r) => ({
      ...r,
      clockIn: new Date(r.clockIn),
      clockOut: r.clockOut ? new Date(r.clockOut) : undefined,
    }))
  }

  saveAttendanceRecord(record: AttendanceRecord): void {
    const records = this.getAttendanceRecords()
    const existingIndex = records.findIndex((r) => r.id === record.id)
    if (existingIndex >= 0) {
      records[existingIndex] = record
    } else {
      records.push(record)
    }
    this.saveToStorage("attendance", records)
  }

  // Utility methods
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  generateOrderNumber(): string {
    const orders = this.getOrders()
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "")
    const todayOrders = orders.filter((o) => o.orderNumber.startsWith(today))
    return `${today}${(todayOrders.length + 1).toString().padStart(3, "0")}`
  }
}

export const dataStore = new DataStore()

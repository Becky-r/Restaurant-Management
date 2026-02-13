import type { MenuItem, Staff, Table, InventoryItem } from "./types"
import { dataStore } from "./data-store"

export function initializeSampleData() {
  // Check if data already exists
  if (dataStore.getMenuItems().length > 0) return

  // Sample Menu Items
  const sampleMenuItems: MenuItem[] = [
    {
      id: "1",
      name: "Doro Wat",
      description: "Traditional Ethiopian chicken stew with berbere spice",
      price: 250,
      category: "food",
      available: true,
      ingredients: ["chicken", "berbere", "onions", "garlic", "ginger"],
      preparationTime: 25,
      allergens: ["eggs"],
    },
    {
      id: "2",
      name: "Kitfo",
      description: "Ethiopian steak tartare with mitmita spice",
      price: 300,
      category: "food",
      available: true,
      ingredients: ["beef", "mitmita", "butter", "cheese"],
      preparationTime: 15,
    },
    {
      id: "3",
      name: "Vegetarian Combo",
      description: "Assorted vegetarian dishes with injera",
      price: 180,
      category: "food",
      available: true,
      ingredients: ["lentils", "cabbage", "collard greens", "injera"],
      preparationTime: 20,
    },
    {
      id: "4",
      name: "Ethiopian Coffee",
      description: "Traditional coffee ceremony coffee",
      price: 50,
      category: "drinks",
      available: true,
      ingredients: ["coffee beans"],
      preparationTime: 10,
    },
    {
      id: "5",
      name: "Fresh Juice",
      description: "Mixed fruit juice",
      price: 40,
      category: "drinks",
      available: true,
      ingredients: ["mixed fruits"],
      preparationTime: 5,
    },
    {
      id: "6",
      name: "Family Combo",
      description: "Doro Wat + Kitfo + sides for 4 people",
      price: 800,
      category: "combos",
      available: true,
      ingredients: ["chicken", "beef", "vegetables", "injera"],
      preparationTime: 30,
    },
  ]

  // Sample Staff
  const sampleStaff: Staff[] = [
    {
      id: "1",
      name: "Admin User",
      email: "admin@restaurant.com",
      phone: "+251911234567",
      role: "admin",
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "2",
      name: "Almaz Tadesse",
      email: "almaz@restaurant.com",
      phone: "+251911234568",
      role: "cashier",
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "3",
      name: "Dawit Bekele",
      email: "dawit@restaurant.com",
      phone: "+251911234569",
      role: "waiter",
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "4",
      name: "Hanan Mohammed",
      email: "hanan@restaurant.com",
      phone: "+251911234570",
      role: "chef",
      isActive: true,
      createdAt: new Date(),
    },
  ]

  // Sample Tables
  const sampleTables: Table[] = [
    { id: "1", number: "1", capacity: 2, status: "available" },
    { id: "2", number: "2", capacity: 4, status: "available" },
    { id: "3", number: "3", capacity: 4, status: "available" },
    { id: "4", number: "4", capacity: 6, status: "available" },
    { id: "5", number: "5", capacity: 2, status: "available" },
    { id: "6", number: "6", capacity: 8, status: "available" },
  ]

  // Sample Inventory
  const sampleInventory: InventoryItem[] = [
    {
      id: "1",
      name: "Chicken",
      category: "Meat",
      unit: "kg",
      currentStock: 50,
      minStock: 10,
      maxStock: 100,
      unitCost: 180,
      supplier: "Local Farm",
    },
    {
      id: "2",
      name: "Berbere Spice",
      category: "Spices",
      unit: "kg",
      currentStock: 5,
      minStock: 2,
      maxStock: 20,
      unitCost: 400,
      supplier: "Spice Market",
    },
    {
      id: "3",
      name: "Injera",
      category: "Bread",
      unit: "pieces",
      currentStock: 100,
      minStock: 20,
      maxStock: 200,
      unitCost: 5,
      supplier: "Local Bakery",
    },
  ]

  // Save sample data
  sampleMenuItems.forEach((item) => dataStore.saveMenuItem(item))
  sampleStaff.forEach((staff) => dataStore.saveStaff(staff))
  sampleTables.forEach((table) => dataStore.saveTable(table))
  sampleInventory.forEach((item) => dataStore.saveInventoryItem(item))
}

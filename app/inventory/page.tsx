"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertTriangle, Package, Plus, Edit, Trash2, Search, TrendingUp, ArrowLeft, RefreshCw } from "lucide-react"
import { dataStore } from "@/lib/data-store"
import { initializeSampleData } from "@/lib/sample-data"
import type { InventoryItem } from "@/lib/types"

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<string>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showRestockDialog, setShowRestockDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: "",
    category: "",
    unit: "",
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unitCost: 0,
    supplier: "",
  })
  const [restockAmount, setRestockAmount] = useState<number>(0)

  useEffect(() => {
    initializeSampleData()
    loadInventory()
  }, [])

  useEffect(() => {
    filterItems()
  }, [inventoryItems, searchTerm, categoryFilter, stockFilter])

  const loadInventory = () => {
    const items = dataStore.getInventoryItems()
    setInventoryItems(items)
  }

  const filterItems = () => {
    let filtered = inventoryItems

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.supplier?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    // Filter by stock level
    if (stockFilter === "low") {
      filtered = filtered.filter((item) => item.currentStock <= item.minStock)
    } else if (stockFilter === "out") {
      filtered = filtered.filter((item) => item.currentStock === 0)
    } else if (stockFilter === "overstocked") {
      filtered = filtered.filter((item) => item.currentStock > item.maxStock)
    }

    // Sort by stock level (low stock first)
    filtered.sort((a, b) => {
      const aRatio = a.currentStock / a.maxStock
      const bRatio = b.currentStock / b.maxStock
      return aRatio - bRatio
    })

    setFilteredItems(filtered)
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return "out"
    if (item.currentStock <= item.minStock) return "low"
    if (item.currentStock > item.maxStock) return "overstocked"
    return "normal"
  }

  const getStockColor = (status: string) => {
    switch (status) {
      case "out":
        return "bg-red-500 text-white"
      case "low":
        return "bg-yellow-500 text-white"
      case "overstocked":
        return "bg-blue-500 text-white"
      default:
        return "bg-green-500 text-white"
    }
  }

  const getStockText = (status: string) => {
    switch (status) {
      case "out":
        return "OUT OF STOCK"
      case "low":
        return "LOW STOCK"
      case "overstocked":
        return "OVERSTOCKED"
      default:
        return "IN STOCK"
    }
  }

  const getCategories = () => {
    const categories = [...new Set(inventoryItems.map((item) => item.category))]
    return categories.sort()
  }

  const saveItem = () => {
    if (!newItem.name || !newItem.category || !newItem.unit) return

    const item: InventoryItem = {
      id: dataStore.generateId(),
      name: newItem.name,
      category: newItem.category,
      unit: newItem.unit,
      currentStock: newItem.currentStock || 0,
      minStock: newItem.minStock || 0,
      maxStock: newItem.maxStock || 0,
      unitCost: newItem.unitCost || 0,
      supplier: newItem.supplier || "",
      lastRestocked: new Date(),
    }

    dataStore.saveInventoryItem(item)
    loadInventory()
    setShowAddDialog(false)
    setNewItem({
      name: "",
      category: "",
      unit: "",
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      unitCost: 0,
      supplier: "",
    })
  }

  const updateItem = () => {
    if (!selectedItem) return

    const updatedItem: InventoryItem = {
      ...selectedItem,
      name: newItem.name || selectedItem.name,
      category: newItem.category || selectedItem.category,
      unit: newItem.unit || selectedItem.unit,
      currentStock: newItem.currentStock ?? selectedItem.currentStock,
      minStock: newItem.minStock ?? selectedItem.minStock,
      maxStock: newItem.maxStock ?? selectedItem.maxStock,
      unitCost: newItem.unitCost ?? selectedItem.unitCost,
      supplier: newItem.supplier ?? selectedItem.supplier,
    }

    dataStore.saveInventoryItem(updatedItem)
    loadInventory()
    setShowEditDialog(false)
    setSelectedItem(null)
    setNewItem({})
  }

  const restockItem = () => {
    if (!selectedItem || restockAmount <= 0) return

    const updatedItem: InventoryItem = {
      ...selectedItem,
      currentStock: selectedItem.currentStock + restockAmount,
      lastRestocked: new Date(),
    }

    dataStore.saveInventoryItem(updatedItem)
    loadInventory()
    setShowRestockDialog(false)
    setSelectedItem(null)
    setRestockAmount(0)
  }

  const deleteItem = (itemId: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      const updatedItems = inventoryItems.filter((item) => item.id !== itemId)
      updatedItems.forEach((item) => dataStore.saveInventoryItem(item))
      loadInventory()
    }
  }

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item)
    setNewItem({
      name: item.name,
      category: item.category,
      unit: item.unit,
      currentStock: item.currentStock,
      minStock: item.minStock,
      maxStock: item.maxStock,
      unitCost: item.unitCost,
      supplier: item.supplier,
    })
    setShowEditDialog(true)
  }

  const openRestockDialog = (item: InventoryItem) => {
    setSelectedItem(item)
    setRestockAmount(0)
    setShowRestockDialog(true)
  }

  const getInventoryStats = () => {
    const totalItems = inventoryItems.length
    const lowStockItems = inventoryItems.filter((item) => item.currentStock <= item.minStock).length
    const outOfStockItems = inventoryItems.filter((item) => item.currentStock === 0).length
    const totalValue = inventoryItems.reduce((sum, item) => sum + item.currentStock * item.unitCost, 0)

    return { totalItems, lowStockItems, outOfStockItems, totalValue }
  }

  const stats = getInventoryStats()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Inventory Management</h1>
                <p className="text-muted-foreground">Track stock levels and manage supplies</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={loadInventory} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalItems}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</div>
              <div className="text-sm text-muted-foreground">Low Stock</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.outOfStockItems}</div>
              <div className="text-sm text-muted-foreground">Out of Stock</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalValue.toFixed(2)} ETB</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items, categories, or suppliers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getCategories().map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock Levels</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                  <SelectItem value="overstocked">Overstocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Items Found</h3>
              <p className="text-muted-foreground">No inventory items match your search criteria.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const status = getStockStatus(item)
              const stockPercentage = (item.currentStock / item.maxStock) * 100

              return (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <Badge className={getStockColor(status)}>{getStockText(status)}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{item.category}</Badge>
                      <span>•</span>
                      <span>{item.unit}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stock Level */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Current Stock</span>
                        <span className="font-medium">
                          {item.currentStock} / {item.maxStock} {item.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            status === "out"
                              ? "bg-red-500"
                              : status === "low"
                                ? "bg-yellow-500"
                                : status === "overstocked"
                                  ? "bg-blue-500"
                                  : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Min: {item.minStock}</span>
                        <span>Max: {item.maxStock}</span>
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unit Cost:</span>
                        <span className="font-medium">{item.unitCost} ETB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Value:</span>
                        <span className="font-medium">{(item.currentStock * item.unitCost).toFixed(2)} ETB</span>
                      </div>
                      {item.supplier && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Supplier:</span>
                          <span className="font-medium">{item.supplier}</span>
                        </div>
                      )}
                      {item.lastRestocked && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Restocked:</span>
                          <span className="font-medium">{item.lastRestocked.toLocaleDateString()}</span>
                        </div>
                      )}
                      {item.expiryDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expires:</span>
                          <span
                            className={`font-medium ${
                              new Date(item.expiryDate) < new Date() ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {item.expiryDate.toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => openRestockDialog(item)} className="flex-1">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Restock
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Low Stock Warning */}
                    {status === "low" || status === "out" ? (
                      <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-800">
                          {status === "out" ? "Urgent: Restock immediately" : "Warning: Stock running low"}
                        </span>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={newItem.name || ""}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Enter item name"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={newItem.category || ""}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                placeholder="e.g., Meat, Spices, Vegetables"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={newItem.unit || ""}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                placeholder="e.g., kg, pieces, liters"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="currentStock">Current</Label>
                <Input
                  id="currentStock"
                  type="number"
                  value={newItem.currentStock || 0}
                  onChange={(e) => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="minStock">Min</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={newItem.minStock || 0}
                  onChange={(e) => setNewItem({ ...newItem, minStock: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="maxStock">Max</Label>
                <Input
                  id="maxStock"
                  type="number"
                  value={newItem.maxStock || 0}
                  onChange={(e) => setNewItem({ ...newItem, maxStock: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="unitCost">Unit Cost (ETB)</Label>
              <Input
                id="unitCost"
                type="number"
                step="0.01"
                value={newItem.unitCost || 0}
                onChange={(e) => setNewItem({ ...newItem, unitCost: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="supplier">Supplier (Optional)</Label>
              <Input
                id="supplier"
                value={newItem.supplier || ""}
                onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                placeholder="Supplier name"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={saveItem} className="flex-1">
                Add Item
              </Button>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editName">Item Name</Label>
              <Input
                id="editName"
                value={newItem.name || ""}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editCategory">Category</Label>
              <Input
                id="editCategory"
                value={newItem.category || ""}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editUnit">Unit</Label>
              <Input
                id="editUnit"
                value={newItem.unit || ""}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="editCurrentStock">Current</Label>
                <Input
                  id="editCurrentStock"
                  type="number"
                  value={newItem.currentStock ?? 0}
                  onChange={(e) => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="editMinStock">Min</Label>
                <Input
                  id="editMinStock"
                  type="number"
                  value={newItem.minStock ?? 0}
                  onChange={(e) => setNewItem({ ...newItem, minStock: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="editMaxStock">Max</Label>
                <Input
                  id="editMaxStock"
                  type="number"
                  value={newItem.maxStock ?? 0}
                  onChange={(e) => setNewItem({ ...newItem, maxStock: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editUnitCost">Unit Cost (ETB)</Label>
              <Input
                id="editUnitCost"
                type="number"
                step="0.01"
                value={newItem.unitCost ?? 0}
                onChange={(e) => setNewItem({ ...newItem, unitCost: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="editSupplier">Supplier</Label>
              <Input
                id="editSupplier"
                value={newItem.supplier || ""}
                onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={updateItem} className="flex-1">
                Update Item
              </Button>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog open={showRestockDialog} onOpenChange={setShowRestockDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restock Item</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium">{selectedItem.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Current Stock: {selectedItem.currentStock} {selectedItem.unit}
                </p>
              </div>
              <div>
                <Label htmlFor="restockAmount">Restock Amount</Label>
                <Input
                  id="restockAmount"
                  type="number"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(Number(e.target.value))}
                  placeholder="Enter amount to add"
                />
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>New Stock Level:</strong> {selectedItem.currentStock + restockAmount} {selectedItem.unit}
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={restockItem} className="flex-1" disabled={restockAmount <= 0}>
                  Restock
                </Button>
                <Button variant="outline" onClick={() => setShowRestockDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

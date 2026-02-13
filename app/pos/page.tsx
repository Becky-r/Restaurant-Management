"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ArrowLeft, Receipt } from "lucide-react"
import { dataStore } from "@/lib/data-store"
import { initializeSampleData } from "@/lib/sample-data"
import type { MenuItem, OrderItem, Order, Table } from "@/lib/types"

export default function POSPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [cart, setCart] = useState<OrderItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<"all" | "food" | "drinks" | "combos">("all")
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway">("dine-in")
  const [customerName, setCustomerName] = useState("")
  const [orderNotes, setOrderNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "telebirr" | "mobile">("cash")
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [lastOrder, setLastOrder] = useState<Order | null>(null)

  useEffect(() => {
    initializeSampleData()
    setMenuItems(dataStore.getMenuItems())
    setTables(dataStore.getTables())
  }, [])

  const filteredMenuItems = menuItems.filter(
    (item) => item.available && (selectedCategory === "all" || item.category === selectedCategory),
  )

  const addToCart = (menuItem: MenuItem) => {
    const existingItem = cart.find((item) => item.menuItem.id === menuItem.id)
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1, price: item.price + menuItem.price }
            : item,
        ),
      )
    } else {
      setCart([...cart, { menuItem, quantity: 1, price: menuItem.price }])
    }
  }

  const updateCartItemQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter((item) => item.menuItem.id !== menuItemId))
    } else {
      setCart(
        cart.map((item) =>
          item.menuItem.id === menuItemId
            ? { ...item, quantity: newQuantity, price: item.menuItem.price * newQuantity }
            : item,
        ),
      )
    }
  }

  const addNoteToCartItem = (menuItemId: string, note: string) => {
    setCart(cart.map((item) => (item.menuItem.id === menuItemId ? { ...item, notes: note } : item)))
  }

  const clearCart = () => {
    setCart([])
    setSelectedTable("")
    setCustomerName("")
    setOrderNotes("")
  }

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price, 0)
  }

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.15 // 15% VAT for Ethiopia
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax(subtotal)
    return subtotal + tax
  }

  const processOrder = () => {
    if (cart.length === 0) return

    const subtotal = calculateSubtotal()
    const tax = calculateTax(subtotal)
    const total = calculateTotal()

    const order: Order = {
      id: dataStore.generateId(),
      orderNumber: dataStore.generateOrderNumber(),
      items: cart,
      tableNumber: orderType === "dine-in" ? selectedTable : undefined,
      customerName: customerName || undefined,
      orderType,
      status: "new",
      notes: orderNotes || undefined,
      subtotal,
      tax,
      total,
      paymentMethod,
      paymentStatus: "paid",
      createdAt: new Date(),
      updatedAt: new Date(),
      staffId: "1", // Current user ID
      estimatedReadyTime: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes from now
    }

    dataStore.saveOrder(order)

    // Update table status if dine-in
    if (orderType === "dine-in" && selectedTable) {
      const table = tables.find((t) => t.number === selectedTable)
      if (table) {
        dataStore.saveTable({ ...table, status: "occupied", currentOrderId: order.id })
      }
    }

    setLastOrder(order)
    setShowPaymentDialog(false)
    setShowReceiptDialog(true)
    clearCart()
  }

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
                <h1 className="text-2xl font-bold">POS System</h1>
                <p className="text-muted-foreground">Point of Sale</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">{new Date().toLocaleTimeString()}</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Menu</CardTitle>
                  <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="food">Food</TabsTrigger>
                      <TabsTrigger value="drinks">Drinks</TabsTrigger>
                      <TabsTrigger value="combos">Combos</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredMenuItems.map((item) => (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{item.name}</h3>
                              <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {item.category}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {item.preparationTime} min
                                </Badge>
                              </div>
                              <p className="font-bold text-lg text-primary">{item.price} ETB</p>
                            </div>
                            <Button onClick={() => addToCart(item)} size="sm">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Cart Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Cart ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order Type</label>
                  <Select value={orderType} onValueChange={(value) => setOrderType(value as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dine-in">Dine In</SelectItem>
                      <SelectItem value="takeaway">Takeaway</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table Selection for Dine-in */}
                {orderType === "dine-in" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Table Number</label>
                    <Select value={selectedTable} onValueChange={setSelectedTable}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables
                          .filter((t) => t.status === "available")
                          .map((table) => (
                            <SelectItem key={table.id} value={table.number}>
                              Table {table.number} (Capacity: {table.capacity})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Customer Name for Takeaway */}
                {orderType === "takeaway" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Customer Name</label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                    />
                  </div>
                )}

                <Separator />

                {/* Cart Items */}
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {cart.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Cart is empty</p>
                    ) : (
                      cart.map((item) => (
                        <Card key={item.menuItem.id} className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium">{item.menuItem.name}</h4>
                              <p className="text-sm text-muted-foreground">{item.price} ETB</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateCartItemQuantity(item.menuItem.id, 0)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCartItemQuantity(item.menuItem.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCartItemQuantity(item.menuItem.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Input
                              placeholder="Add notes (e.g., no onion)"
                              value={item.notes || ""}
                              onChange={(e) => addNoteToCartItem(item.menuItem.id, e.target.value)}
                              className="text-xs"
                            />
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* Order Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order Notes</label>
                  <Textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Special instructions..."
                    rows={2}
                  />
                </div>

                <Separator />

                {/* Order Summary */}
                {cart.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{calculateSubtotal()} ETB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (15%):</span>
                      <span>{calculateTax(calculateSubtotal()).toFixed(2)} ETB</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>{calculateTotal().toFixed(2)} ETB</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full"
                        disabled={cart.length === 0 || (orderType === "dine-in" && !selectedTable)}
                      >
                        Process Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Payment Method</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            variant={paymentMethod === "cash" ? "default" : "outline"}
                            onClick={() => setPaymentMethod("cash")}
                            className="h-20 flex-col gap-2"
                          >
                            <Banknote className="h-6 w-6" />
                            Cash
                          </Button>
                          <Button
                            variant={paymentMethod === "card" ? "default" : "outline"}
                            onClick={() => setPaymentMethod("card")}
                            className="h-20 flex-col gap-2"
                          >
                            <CreditCard className="h-6 w-6" />
                            Card
                          </Button>
                          <Button
                            variant={paymentMethod === "telebirr" ? "default" : "outline"}
                            onClick={() => setPaymentMethod("telebirr")}
                            className="h-20 flex-col gap-2"
                          >
                            <Smartphone className="h-6 w-6" />
                            TeleBirr
                          </Button>
                          <Button
                            variant={paymentMethod === "mobile" ? "default" : "outline"}
                            onClick={() => setPaymentMethod("mobile")}
                            className="h-20 flex-col gap-2"
                          >
                            <Smartphone className="h-6 w-6" />
                            Mobile Money
                          </Button>
                        </div>
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total Amount:</span>
                            <span>{calculateTotal().toFixed(2)} ETB</span>
                          </div>
                        </div>
                        <Button onClick={processOrder} className="w-full">
                          Complete Order
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" onClick={clearCart} className="w-full bg-transparent">
                    Clear Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Order Receipt
            </DialogTitle>
          </DialogHeader>
          {lastOrder && (
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <h3 className="font-bold text-lg">Restaurant Name</h3>
                <p className="text-sm text-muted-foreground">Order #{lastOrder.orderNumber}</p>
                <p className="text-xs text-muted-foreground">{lastOrder.createdAt.toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Type:</span>
                  <span className="capitalize">{lastOrder.orderType}</span>
                </div>
                {lastOrder.tableNumber && (
                  <div className="flex justify-between text-sm">
                    <span>Table:</span>
                    <span>{lastOrder.tableNumber}</span>
                  </div>
                )}
                {lastOrder.customerName && (
                  <div className="flex justify-between text-sm">
                    <span>Customer:</span>
                    <span>{lastOrder.customerName}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                {lastOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.menuItem.name}
                    </span>
                    <span>{item.price} ETB</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{lastOrder.subtotal} ETB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>{lastOrder.tax.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{lastOrder.total.toFixed(2)} ETB</span>
                </div>
              </div>

              <div className="text-center text-xs text-muted-foreground pt-4 border-t">
                <p>Thank you for your business!</p>
                <p>Estimated ready time: {lastOrder.estimatedReadyTime?.toLocaleTimeString()}</p>
              </div>

              <Button onClick={() => setShowReceiptDialog(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Clock, Search, Eye, CheckCircle, XCircle, ArrowLeft, Users, MapPin, Calendar, DollarSign } from "lucide-react"
import { dataStore } from "@/lib/data-store"
import { initializeSampleData } from "@/lib/sample-data"
import type { Order, Table } from "@/lib/types"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  useEffect(() => {
    initializeSampleData()
    loadData()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, statusFilter, typeFilter])

  const loadData = () => {
    const ordersData = dataStore.getOrders()
    const tablesData = dataStore.getTables()
    setOrders(ordersData)
    setTables(tablesData)
  }

  const filterOrders = () => {
    let filtered = orders

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.tableNumber?.includes(searchTerm),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((order) => order.orderType === typeFilter)
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setFilteredOrders(filtered)
  }

  const updateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    const updatedOrders = orders.map((order) => {
      if (order.id === orderId) {
        const updatedOrder = { ...order, status: newStatus, updatedAt: new Date() }
        dataStore.saveOrder(updatedOrder)
        return updatedOrder
      }
      return order
    })
    setOrders(updatedOrders)

    // Update selected order if it's the one being updated
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus, updatedAt: new Date() })
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "new":
        return "bg-blue-500"
      case "preparing":
        return "bg-yellow-500"
      case "ready":
        return "bg-green-500"
      case "served":
        return "bg-gray-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "new":
        return "New"
      case "preparing":
        return "Preparing"
      case "ready":
        return "Ready"
      case "served":
        return "Served"
      case "cancelled":
        return "Cancelled"
      default:
        return status
    }
  }

  const getNextStatus = (currentStatus: Order["status"]): Order["status"] | null => {
    switch (currentStatus) {
      case "new":
        return "preparing"
      case "preparing":
        return "ready"
      case "ready":
        return "served"
      default:
        return null
    }
  }

  const canAdvanceStatus = (status: Order["status"]) => {
    return ["new", "preparing", "ready"].includes(status)
  }

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      new: orders.filter((o) => o.status === "new").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      ready: orders.filter((o) => o.status === "ready").length,
      served: orders.filter((o) => o.status === "served").length,
    }
    return stats
  }

  const stats = getOrderStats()

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
                <h1 className="text-2xl font-bold">Order Management</h1>
                <p className="text-muted-foreground">Track and manage all orders</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">{new Date().toLocaleTimeString()}</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
              <div className="text-sm text-muted-foreground">New</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.preparing}</div>
              <div className="text-sm text-muted-foreground">Preparing</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
              <div className="text-sm text-muted-foreground">Ready</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.served}</div>
              <div className="text-sm text-muted-foreground">Served</div>
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
                    placeholder="Search by order number, customer name, or table..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="served">Served</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="dine-in">Dine In</SelectItem>
                  <SelectItem value="takeaway">Takeaway</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No orders found matching your criteria.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">#{order.orderNumber}</CardTitle>
                    <Badge className={`${getStatusColor(order.status)} text-white`}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {order.createdAt.toLocaleTimeString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {order.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {order.orderType === "dine-in" ? (
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Users className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">
                        {order.orderType === "dine-in"
                          ? `Table ${order.tableNumber}`
                          : order.customerName || "Takeaway"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{order.total.toFixed(2)} ETB</span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""} •{" "}
                    {order.orderType === "dine-in" ? "Dine In" : "Takeaway"}
                  </div>

                  {order.estimatedReadyTime && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Ready by: </span>
                      <span className="font-medium">{order.estimatedReadyTime.toLocaleTimeString()}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                    </Dialog>

                    {canAdvanceStatus(order.status) && (
                      <Button
                        size="sm"
                        onClick={() => {
                          const nextStatus = getNextStatus(order.status)
                          if (nextStatus) {
                            updateOrderStatus(order.id, nextStatus)
                          }
                        }}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {order.status === "new" ? "Start" : order.status === "preparing" ? "Ready" : "Serve"}
                      </Button>
                    )}

                    {order.status !== "cancelled" && order.status !== "served" && (
                      <Button variant="destructive" size="sm" onClick={() => updateOrderStatus(order.id, "cancelled")}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Order Details - #{selectedOrder?.orderNumber}</span>
              {selectedOrder && (
                <Badge className={`${getStatusColor(selectedOrder.status)} text-white`}>
                  {getStatusText(selectedOrder.status)}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Number:</span>
                      <span>#{selectedOrder.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="capitalize">{selectedOrder.orderType}</span>
                    </div>
                    {selectedOrder.tableNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Table:</span>
                        <span>{selectedOrder.tableNumber}</span>
                      </div>
                    )}
                    {selectedOrder.customerName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Customer:</span>
                        <span>{selectedOrder.customerName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{selectedOrder.createdAt.toLocaleString()}</span>
                    </div>
                    {selectedOrder.estimatedReadyTime && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ready Time:</span>
                        <span>{selectedOrder.estimatedReadyTime.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Payment Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method:</span>
                      <span className="capitalize">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={selectedOrder.paymentStatus === "paid" ? "default" : "secondary"}>
                        {selectedOrder.paymentStatus}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>{selectedOrder.subtotal} ETB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax:</span>
                      <span>{selectedOrder.tax.toFixed(2)} ETB</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>{selectedOrder.total.toFixed(2)} ETB</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-3">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.menuItem.name}</span>
                          <Badge variant="outline" className="text-xs">
                            x{item.quantity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.menuItem.description}</p>
                        {item.notes && (
                          <p className="text-sm text-blue-600 mt-1">
                            <strong>Note:</strong> {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.price} ETB</div>
                        <div className="text-sm text-muted-foreground">{item.menuItem.price} ETB each</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Order Notes</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedOrder.notes}</p>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                {canAdvanceStatus(selectedOrder.status) && (
                  <Button
                    onClick={() => {
                      const nextStatus = getNextStatus(selectedOrder.status)
                      if (nextStatus) {
                        updateOrderStatus(selectedOrder.id, nextStatus)
                      }
                    }}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {selectedOrder.status === "new"
                      ? "Start Preparing"
                      : selectedOrder.status === "preparing"
                        ? "Mark Ready"
                        : "Mark Served"}
                  </Button>
                )}

                {selectedOrder.status !== "cancelled" && selectedOrder.status !== "served" && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, "cancelled")
                      setShowOrderDetails(false)
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

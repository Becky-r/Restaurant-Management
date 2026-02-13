"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Clock, ChefHat, CheckCircle, AlertTriangle, ArrowLeft, Timer, Users, MapPin, RefreshCw } from "lucide-react"
import { dataStore } from "@/lib/data-store"
import { initializeSampleData } from "@/lib/sample-data"
import type { Order } from "@/lib/types"

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    initializeSampleData()
    loadOrders()

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Auto-refresh orders every 30 seconds
    const refreshInterval = setInterval(() => {
      if (autoRefresh) {
        loadOrders()
      }
    }, 30000)

    return () => {
      clearInterval(timeInterval)
      clearInterval(refreshInterval)
    }
  }, [autoRefresh])

  useEffect(() => {
    filterOrders()
  }, [orders, typeFilter])

  const loadOrders = () => {
    const ordersData = dataStore.getOrders()
    // Only show orders that need kitchen attention (new and preparing)
    const kitchenOrders = ordersData.filter((order) => order.status === "new" || order.status === "preparing")
    setOrders(kitchenOrders)
  }

  const filterOrders = () => {
    let filtered = orders

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((order) => order.orderType === typeFilter)
    }

    // Sort by priority: new orders first, then by creation time
    filtered.sort((a, b) => {
      if (a.status === "new" && b.status === "preparing") return -1
      if (a.status === "preparing" && b.status === "new") return 1
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

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
    setOrders(updatedOrders.filter((order) => order.status === "new" || order.status === "preparing"))
  }

  const startOrder = (orderId: string) => {
    updateOrderStatus(orderId, "preparing")
  }

  const completeOrder = (orderId: string) => {
    updateOrderStatus(orderId, "ready")
  }

  const getOrderPriority = (order: Order) => {
    const now = new Date()
    const orderTime = new Date(order.createdAt)
    const minutesElapsed = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))

    if (minutesElapsed > 30) return "high"
    if (minutesElapsed > 15) return "medium"
    return "normal"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-500 bg-red-50"
      case "medium":
        return "border-yellow-500 bg-yellow-50"
      default:
        return "border-green-500 bg-green-50"
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-500 text-white">URGENT</Badge>
      case "medium":
        return <Badge className="bg-yellow-500 text-white">PRIORITY</Badge>
      default:
        return <Badge className="bg-green-500 text-white">NORMAL</Badge>
    }
  }

  const getElapsedTime = (order: Order) => {
    const now = new Date()
    const orderTime = new Date(order.createdAt)
    const minutesElapsed = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))
    return minutesElapsed
  }

  const getEstimatedTotalTime = (order: Order) => {
    return order.items.reduce((max, item) => Math.max(max, item.menuItem.preparationTime), 0)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <ChefHat className="h-8 w-8 text-orange-500" />
                <div>
                  <h1 className="text-2xl font-bold">Kitchen Display</h1>
                  <p className="text-muted-foreground">Active Orders: {filteredOrders.length}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-lg font-mono font-bold">{currentTime.toLocaleTimeString()}</div>
                <div className="text-sm text-muted-foreground">{currentTime.toLocaleDateString()}</div>
              </div>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
                Auto Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="dine-in">Dine In Only</SelectItem>
              <SelectItem value="takeaway">Takeaway Only</SelectItem>
              <SelectItem value="delivery">Delivery Only</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Active Orders</h3>
            <p className="text-muted-foreground">All caught up! No orders need kitchen attention right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOrders.map((order) => {
              const priority = getOrderPriority(order)
              const elapsedTime = getElapsedTime(order)
              const estimatedTime = getEstimatedTotalTime(order)

              return (
                <Card
                  key={order.id}
                  className={`${getPriorityColor(priority)} border-2 hover:shadow-lg transition-all duration-200`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-2xl font-bold">#{order.orderNumber}</CardTitle>
                        {getPriorityBadge(priority)}
                      </div>
                      <Badge variant={order.status === "new" ? "default" : "secondary"} className="text-sm">
                        {order.status === "new" ? "NEW" : "PREPARING"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          {order.orderType === "dine-in" ? (
                            <MapPin className="h-4 w-4" />
                          ) : (
                            <Users className="h-4 w-4" />
                          )}
                          <span className="font-medium">
                            {order.orderType === "dine-in"
                              ? `Table ${order.tableNumber}`
                              : order.customerName || "Takeaway"}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {order.orderType}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Ordered: {order.createdAt.toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        <span
                          className={`font-medium ${elapsedTime > estimatedTime ? "text-red-600" : "text-green-600"}`}
                        >
                          {elapsedTime}m / {estimatedTime}m
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Order Items */}
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="bg-white/80 p-3 rounded-lg border">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-lg">
                                  {item.quantity}x {item.menuItem.name}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {item.menuItem.preparationTime}min
                                </Badge>
                              </div>
                              {item.notes && (
                                <div className="bg-blue-100 p-2 rounded text-sm mt-2">
                                  <strong className="text-blue-800">Special Instructions:</strong>
                                  <p className="text-blue-700 mt-1">{item.notes}</p>
                                </div>
                              )}
                              {item.menuItem.allergens && item.menuItem.allergens.length > 0 && (
                                <div className="flex items-center gap-1 mt-2">
                                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                  <span className="text-xs text-yellow-700">
                                    Allergens: {item.menuItem.allergens.join(", ")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Notes */}
                    {order.notes && (
                      <div className="bg-yellow-100 p-3 rounded-lg border border-yellow-300">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <div>
                            <strong className="text-yellow-800">Order Notes:</strong>
                            <p className="text-yellow-700 text-sm mt-1">{order.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {order.status === "new" ? (
                        <Button
                          onClick={() => startOrder(order.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          size="lg"
                        >
                          <ChefHat className="h-5 w-5 mr-2" />
                          Start Cooking
                        </Button>
                      ) : (
                        <Button
                          onClick={() => completeOrder(order.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          size="lg"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Mark Ready
                        </Button>
                      )}
                    </div>

                    {/* Estimated Ready Time */}
                    {order.estimatedReadyTime && (
                      <div className="text-center text-sm text-muted-foreground pt-2 border-t">
                        <span>Est. Ready: {order.estimatedReadyTime.toLocaleTimeString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Summary Stats */}
        {filteredOrders.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredOrders.filter((o) => o.status === "new").length}
                </div>
                <div className="text-sm text-muted-foreground">New Orders</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredOrders.filter((o) => o.status === "preparing").length}
                </div>
                <div className="text-sm text-muted-foreground">Preparing</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {filteredOrders.filter((o) => getOrderPriority(o) === "high").length}
                </div>
                <div className="text-sm text-muted-foreground">Urgent Orders</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(filteredOrders.reduce((sum, o) => sum + getElapsedTime(o), 0) / filteredOrders.length) ||
                    0}
                  m
                </div>
                <div className="text-sm text-muted-foreground">Avg. Wait Time</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

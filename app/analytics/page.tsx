"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Calendar,
  Download,
  ArrowLeft,
  RefreshCw,
} from "lucide-react"
import { dataStore } from "@/lib/data-store"
import { initializeSampleData } from "@/lib/sample-data"
import type { Order, Staff, InventoryItem, MenuItem } from "@/lib/types"

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [dateRange, setDateRange] = useState<string>("7days")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    initializeSampleData()
    loadData()
  }, [])

  const loadData = () => {
    const ordersData = dataStore.getOrders()
    const staffData = dataStore.getStaff()
    const inventoryData = dataStore.getInventoryItems()
    const menuData = dataStore.getMenuItems()
    setOrders(ordersData)
    setStaff(staffData)
    setInventory(inventoryData)
    setMenuItems(menuData)
  }

  const getDateRangeFilter = () => {
    const now = new Date()
    const days = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : dateRange === "90days" ? 90 : 365
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return startDate
  }

  const getFilteredOrders = () => {
    const startDate = getDateRangeFilter()
    return orders.filter((order) => new Date(order.createdAt) >= startDate && order.paymentStatus === "paid")
  }

  const getOverviewStats = () => {
    const filteredOrders = getFilteredOrders()
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = filteredOrders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const totalTax = filteredOrders.reduce((sum, order) => sum + order.tax, 0)

    // Compare with previous period
    const periodDays = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : dateRange === "90days" ? 90 : 365
    const previousPeriodStart = new Date(getDateRangeFilter().getTime() - periodDays * 24 * 60 * 60 * 1000)
    const previousPeriodEnd = getDateRangeFilter()
    const previousOrders = orders.filter(
      (order) =>
        new Date(order.createdAt) >= previousPeriodStart &&
        new Date(order.createdAt) < previousPeriodEnd &&
        order.paymentStatus === "paid",
    )
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0)
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalTax,
      revenueGrowth,
      previousRevenue,
    }
  }

  const getDailySalesData = () => {
    const filteredOrders = getFilteredOrders()
    const dailyData: { [key: string]: { date: string; revenue: number; orders: number } } = {}

    filteredOrders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split("T")[0]
      if (!dailyData[date]) {
        dailyData[date] = { date, revenue: 0, orders: 0 }
      }
      dailyData[date].revenue += order.total
      dailyData[date].orders += 1
    })

    return Object.values(dailyData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const getTopSellingItems = () => {
    const filteredOrders = getFilteredOrders()
    const itemSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {}

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.menuItem.id
        if (!itemSales[key]) {
          itemSales[key] = { name: item.menuItem.name, quantity: 0, revenue: 0 }
        }
        itemSales[key].quantity += item.quantity
        itemSales[key].revenue += item.price
      })
    })

    return Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
  }

  const getPaymentMethodBreakdown = () => {
    const filteredOrders = getFilteredOrders()
    const paymentData: { [key: string]: number } = {}

    filteredOrders.forEach((order) => {
      const method = order.paymentMethod || "unknown"
      paymentData[method] = (paymentData[method] || 0) + order.total
    })

    return Object.entries(paymentData).map(([method, amount]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1),
      amount,
      percentage: (amount / filteredOrders.reduce((sum, o) => sum + o.total, 0)) * 100,
    }))
  }

  const getStaffPerformance = () => {
    const filteredOrders = getFilteredOrders()
    const staffData: { [key: string]: { name: string; orders: number; revenue: number } } = {}

    filteredOrders.forEach((order) => {
      const staffMember = staff.find((s) => s.id === order.staffId)
      const key = order.staffId
      if (!staffData[key]) {
        staffData[key] = { name: staffMember?.name || "Unknown", orders: 0, revenue: 0 }
      }
      staffData[key].orders += 1
      staffData[key].revenue += order.total
    })

    return Object.values(staffData).sort((a, b) => b.revenue - a.revenue)
  }

  const getOrderTypeBreakdown = () => {
    const filteredOrders = getFilteredOrders()
    const typeData: { [key: string]: number } = {}

    filteredOrders.forEach((order) => {
      const type = order.orderType
      typeData[type] = (typeData[type] || 0) + 1
    })

    return Object.entries(typeData).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1).replace("-", " "),
      count,
      percentage: (count / filteredOrders.length) * 100,
    }))
  }

  const getInventoryTurnover = () => {
    const filteredOrders = getFilteredOrders()
    const itemUsage: { [key: string]: number } = {}

    // Calculate usage based on orders (simplified)
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        item.menuItem.ingredients.forEach((ingredient) => {
          itemUsage[ingredient] = (itemUsage[ingredient] || 0) + item.quantity
        })
      })
    })

    return inventory
      .map((item) => ({
        name: item.name,
        currentStock: item.currentStock,
        usage: itemUsage[item.name.toLowerCase()] || 0,
        turnoverRate: item.currentStock > 0 ? (itemUsage[item.name.toLowerCase()] || 0) / item.currentStock : 0,
        value: item.currentStock * item.unitCost,
      }))
      .sort((a, b) => b.turnoverRate - a.turnoverRate)
      .slice(0, 10)
  }

  const stats = getOverviewStats()
  const dailySales = getDailySalesData()
  const topItems = getTopSellingItems()
  const paymentBreakdown = getPaymentMethodBreakdown()
  const staffPerformance = getStaffPerformance()
  const orderTypes = getOrderTypeBreakdown()
  const inventoryTurnover = getInventoryTurnover()

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

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
                <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                <p className="text-muted-foreground">Business insights and reports</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="365days">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} ETB</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stats.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                )}
                <span className={stats.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                  {Math.abs(stats.revenueGrowth).toFixed(1)}%
                </span>
                <span className="ml-1">from previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">Orders completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageOrderValue.toFixed(2)} ETB</div>
              <p className="text-xs text-muted-foreground">Per order average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tax Collected</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTax.toFixed(2)} ETB</div>
              <p className="text-xs text-muted-foreground">VAT (15%)</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Sales Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailySales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ method, percentage }) => `${method} (${percentage.toFixed(1)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {paymentBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Order Types */}
            <Card>
              <CardHeader>
                <CardTitle>Order Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {orderTypes.map((type, index) => (
                    <div key={type.type} className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                        {type.count}
                      </div>
                      <div className="text-sm text-muted-foreground">{type.type}</div>
                      <div className="text-xs text-muted-foreground">{type.percentage.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue & Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={dailySales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue (ETB)" />
                      <Bar yAxisId="right" dataKey="orders" fill="#82ca9d" name="Orders" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sales Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalRevenue.toFixed(0)}</div>
                      <div className="text-sm text-blue-600">Total Revenue (ETB)</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.totalOrders}</div>
                      <div className="text-sm text-green-600">Total Orders</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{stats.averageOrderValue.toFixed(0)}</div>
                      <div className="text-sm text-purple-600">Avg Order Value</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{stats.totalTax.toFixed(0)}</div>
                      <div className="text-sm text-orange-600">Tax Collected</div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Tax Report (Ethiopia VAT)</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Gross Sales:</span>
                        <span>{(stats.totalRevenue - stats.totalTax).toFixed(2)} ETB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT (15%):</span>
                        <span>{stats.totalTax.toFixed(2)} ETB</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total Sales:</span>
                        <span>{stats.totalRevenue.toFixed(2)} ETB</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Items</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {topItems.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.quantity} units sold</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{item.revenue.toFixed(2)} ETB</div>
                          <div className="text-sm text-muted-foreground">Revenue</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Staff Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {staffPerformance.map((staff, index) => (
                      <div key={staff.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div>
                            <div className="font-medium">{staff.name}</div>
                            <div className="text-sm text-muted-foreground">{staff.orders} orders processed</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{staff.revenue.toFixed(2)} ETB</div>
                          <div className="text-sm text-muted-foreground">
                            {staff.orders > 0 ? (staff.revenue / staff.orders).toFixed(2) : "0"} ETB avg
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Turnover</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {inventoryTurnover.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Stock: {item.currentStock} | Usage: {item.usage}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{item.turnoverRate.toFixed(2)}x</div>
                          <div className="text-sm text-muted-foreground">{item.value.toFixed(2)} ETB value</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

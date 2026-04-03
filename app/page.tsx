"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Users, ChefHat, BarChart3, Package, Settings, Clock, DollarSign } from "lucide-react"
import Link from "next/link"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

interface RecentOrder {
  orderNumber: string
  tableId: string | null
  status: string
  totalAmount: number
  createdAt: string
}

import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"

export default function HomePage() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    activeOrders: 0,
    lowStockItems: 0,
    pendingSupplyRequests: 0,
    pendingPurchases: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get("/api/admin/dashboard-stats")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setStats({
        todayOrders: data.todayOrders,
        todayRevenue: data.todayRevenue,
        activeOrders: data.activeOrders,
        lowStockItems: data.lowStockItems,
        pendingSupplyRequests: data.pendingSupplyRequests || 0,
        pendingPurchases: data.pendingPurchases || 0,
      })
      setRecentOrders(data.recentOrders || [])
    } catch (err) {
      console.error("Dashboard fetch error:", err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500"
      case "PREPARING":
        return "bg-blue-500"
      case "READY":
        return "bg-green-500"
      case "PAID":
        return "bg-gray-500"
      default:
        return "bg-gray-400"
    }
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins} min ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const allActions = [
    {
      title: "POS System",
      description: "Take orders and process payments",
      icon: ShoppingCart,
      href: "/pos",
      color: "bg-blue-500",
      allowedRoles: ["ADMIN", "WAITER", "CASHIER"],
    },
    {
      title: "Kitchen Display",
      description: "View and manage orders in kitchen",
      icon: ChefHat,
      href: "/kitchen",
      color: "bg-orange-500",
      allowedRoles: ["ADMIN", "CHEF"],
    },
    {
      title: "Order Management",
      description: "Track all orders and tables",
      icon: Clock,
      href: "/orders",
      color: "bg-green-500",
      allowedRoles: ["ADMIN", "WAITER", "CASHIER"],
    },
    {
      title: "Staff Management",
      description: "Manage staff and attendance",
      icon: Users,
      href: "/staff",
      color: "bg-purple-500",
      allowedRoles: ["ADMIN"],
    },
    {
      title: "Inventory",
      description: "Track stock and supplies",
      icon: Package,
      href: "/inventory",
      color: "bg-yellow-500",
      allowedRoles: ["ADMIN"],
    },
    {
      title: "Menu Management",
      description: "Manage digital menu items and categories",
      icon: ChefHat,
      href: "/admin/menu",
      color: "bg-red-500",
      allowedRoles: ["ADMIN"],
    },
    {
      title: "Analytics",
      description: "View reports and insights",
      icon: BarChart3,
      href: "/analytics",
      color: "bg-indigo-500",
      allowedRoles: ["ADMIN"],
    },
    {
      title: "Procurement & Audit",
      description: "Manage purchases and view audit logs",
      icon: Settings,
      href: "/staff",
      color: "bg-teal-500",
      allowedRoles: ["ADMIN"],
    },
  ]

  const quickActions = allActions.filter(action => 
    user && action.allowedRoles.includes(user.role)
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Restaurant Management</h1>
              <p className="text-muted-foreground">Welcome back, {user?.name || "User"}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                {user?.role}
              </Badge>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>


      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayOrders}</div>
              <p className="text-xs text-muted-foreground">Orders processed today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayRevenue} ETB</div>
              <p className="text-xs text-muted-foreground">Total sales today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeOrders}</div>
              <p className="text-xs text-muted-foreground">Orders in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">Items need restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Supply Requests</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingSupplyRequests}</div>
              <p className="text-xs text-muted-foreground">Kitchen requests waiting</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Purchases</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pendingPurchases}</div>
              <p className="text-xs text-muted-foreground">Orders needing admin approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Card key={action.title} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${action.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{action.title}</CardTitle>
                        <CardDescription>{action.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link href={action.href}>
                      <Button className="w-full bg-transparent" variant="outline">
                        Open {action.title}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest orders and system updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent orders</p>
              ) : (
                recentOrders.slice(0, 5).map((order) => (
                  <div key={order.orderNumber} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className={`h-2 w-2 ${getStatusColor(order.status)} rounded-full`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Order {order.orderNumber} — {order.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.tableId ? `Table ${order.tableId}` : "Takeaway"} — {order.totalAmount} ETB
                      </p>
                    </div>
                    <Badge variant="secondary">{timeAgo(order.createdAt)}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

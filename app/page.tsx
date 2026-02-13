"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Users, ChefHat, BarChart3, Package, Settings, Clock, DollarSign } from "lucide-react"
import { initializeSampleData } from "@/lib/sample-data"
import { dataStore } from "@/lib/data-store"
import Link from "next/link"

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<string>("admin")
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    activeOrders: 0,
    lowStockItems: 0,
  })

  useEffect(() => {
    // Initialize sample data on first load
    initializeSampleData()

    // Calculate stats
    const orders = dataStore.getOrders()
    const today = new Date().toDateString()
    const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today)
    const activeOrders = orders.filter((o) => ["new", "preparing"].includes(o.status))
    const inventory = dataStore.getInventoryItems()
    const lowStockItems = inventory.filter((i) => i.currentStock <= i.minStock)

    setStats({
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum, o) => sum + o.total, 0),
      activeOrders: activeOrders.length,
      lowStockItems: lowStockItems.length,
    })
  }, [])

  const quickActions = [
    {
      title: "POS System",
      description: "Take orders and process payments",
      icon: ShoppingCart,
      href: "/pos",
      color: "bg-blue-500",
    },
    {
      title: "Kitchen Display",
      description: "View and manage orders in kitchen",
      icon: ChefHat,
      href: "/kitchen",
      color: "bg-orange-500",
    },
    {
      title: "Order Management",
      description: "Track all orders and tables",
      icon: Clock,
      href: "/orders",
      color: "bg-green-500",
    },
    {
      title: "Staff Management",
      description: "Manage staff and attendance",
      icon: Users,
      href: "/staff",
      color: "bg-purple-500",
    },
    {
      title: "Inventory",
      description: "Track stock and supplies",
      icon: Package,
      href: "/inventory",
      color: "bg-yellow-500",
    },
    {
      title: "Analytics",
      description: "View reports and insights",
      icon: BarChart3,
      href: "/analytics",
      color: "bg-indigo-500",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Restaurant Management</h1>
              <p className="text-muted-foreground">Welcome back, Admin</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                {new Date().toLocaleDateString("en-ET")}
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New order #001 received</p>
                  <p className="text-xs text-muted-foreground">Table 3 - Doro Wat combo</p>
                </div>
                <Badge variant="secondary">2 min ago</Badge>
              </div>

              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Order #002 ready for serving</p>
                  <p className="text-xs text-muted-foreground">Table 1 - Vegetarian combo</p>
                </div>
                <Badge variant="secondary">5 min ago</Badge>
              </div>

              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Low stock alert</p>
                  <p className="text-xs text-muted-foreground">Berbere spice running low</p>
                </div>
                <Badge variant="secondary">10 min ago</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Clock, Search, Eye, CheckCircle, XCircle, ArrowLeft, Users, MapPin, Calendar, DollarSign, RefreshCw } from "lucide-react"
import type { Order } from "@/lib/types"
import { io } from "socket.io-client"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

import { api } from "@/lib/api"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()

    const socket = io(API_BASE)
    
    // ... (keep socket listeners)
    socket.on("order-updated", (updatedOrder: any) => {
      setOrders(prev => {
        const parsed = { ...updatedOrder, createdAt: new Date(updatedOrder.createdAt) }
        const exists = prev.some(o => o.id === parsed.id)
        if (exists) {
          return prev.map(o => o.id === parsed.id ? parsed : o)
        }
        return [parsed, ...prev]
      })

      if (updatedOrder.status === "READY") {
        console.log(`Order #${updatedOrder.orderNumber} is READY!`)
      }
    })

    socket.on("new-order", (newOrder: any) => {
      setOrders(prev => {
        if (prev.some(o => o.id === newOrder.id)) return prev
        const parsed = { ...newOrder, createdAt: new Date(newOrder.createdAt) }
        return [parsed, ...prev]
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const resp = await api.get("/api/orders/active")
      const data = await resp.json()
      setOrders(data.map((o: any) => ({ ...o, createdAt: new Date(o.createdAt) })))
    } catch (e) {
      console.error("Failed to load orders", e)
    } finally {
      setLoading(false)
    }
  }

  // ... (keep filterOrders, getStatusColor, stats)
  const filterOrders = () => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.waiterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.tableId?.includes(searchTerm),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setFilteredOrders(filtered)
  }

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const res = await api.patch(`/api/orders/${orderId}/status`, { status })
      if (!res.ok) throw new Error("Update failed")
    } catch (e) {
      console.error(e)
    }
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-blue-500"
      case "PREPARING": return "bg-yellow-500"
      case "READY": return "bg-green-500"
      case "PAID": return "bg-gray-500"
      default: return "bg-gray-400"
    }
  }

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "PENDING").length,
    preparing: orders.filter(o => o.status === "PREPARING").length,
    ready: orders.filter(o => o.status === "READY").length,
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.history.back()}><ArrowLeft className="h-4 w-4 mr-2"/>Back</Button>
            <h1 className="text-2xl font-bold">Orders Management</h1>
          </div>
          <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{stats.pending}</div>
              <div className="text-sm text-blue-600">Pending</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-700">{stats.preparing}</div>
              <div className="text-sm text-yellow-600">Preparing</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200 animate-pulse-subtle">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{stats.ready}</div>
              <div className="text-sm text-green-600 font-bold">READY FOR PICKUP</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Active</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search orders..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PREPARING">Preparing</SelectItem>
                <SelectItem value="READY">Ready</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <Card key={order.id} className={`hover:shadow-md transition-all ${order.status === "READY" ? "ring-2 ring-green-500 bg-green-50" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-black">{order.orderNumber}</span>
                  <Badge className={`${getStatusColor(order.status)} text-white`}>{order.status}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" /> {order.createdAt.toLocaleTimeString()}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center font-medium">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> {order.tableId ? `Table ${order.tableId}` : "Takeaway"}
                  </div>
                  <span>{order.items.reduce((sum, i) => sum + i.quantity * i.priceAtTime, 0).toFixed(2)} ETB</span>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setSelectedOrder(order); setShowOrderDetails(true); }}>
                    <Eye className="h-4 w-4 mr-2" /> Details
                  </Button>
                  {order.status === "READY" && (
                    <Button className="flex-1 bg-green-600" onClick={() => updateStatus(order.id, "PAID")}>
                      <DollarSign className="h-4 w-4 mr-2" /> Mark Paid
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-md">
          <DialogTitle>Order Summary {selectedOrder?.orderNumber}</DialogTitle>
          {selectedOrder && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span>{item.quantity}x {item.menuItem.name}</span>
                    <span className="font-mono">{(item.quantity * item.priceAtTime).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{selectedOrder.items.reduce((sum, i) => sum + i.quantity * i.priceAtTime, 0).toFixed(2)} ETB</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  )
}

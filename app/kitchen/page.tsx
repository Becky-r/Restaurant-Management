"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, ChefHat, CheckCircle, AlertTriangle, ArrowLeft, Timer, RefreshCw, Send, Plus, Trash } from "lucide-react"
import type { Order } from "@/lib/types"
import { io } from "socket.io-client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [supplyRequestOpen, setSupplyRequestOpen] = useState(false)
  const [selectedSupplies, setSelectedSupplies] = useState<{id: string, name: string, quantity: number}[]>([])
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadOrders()
    loadInventory()

    const socket = io(API_BASE)
    socket.emit("join-kitchen")

    socket.on("new-order", (newOrder: any) => {
      setOrders(prev => {
        if (prev.some(o => o.id === newOrder.id)) return prev
        const parsed = { ...newOrder, createdAt: new Date(newOrder.createdAt) }
        return [...prev, parsed].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      })
      new Audio("/notification.mp3").play().catch(() => {})
    })

    socket.on("order-updated", (updatedOrder: any) => {
      setOrders(prev => {
        // If it's PAID or READY, we might want to remove it from KDS depending on logic
        // But KDS usually shows PENDING -> PREPARING -> READY
        // Requirement: READY should be shown to Waiter. 
        // For KDS, let's keep PENDING and PREPARING.
        if (updatedOrder.status === "READY" || updatedOrder.status === "PAID") {
          return prev.filter(o => o.id !== updatedOrder.id)
        }
        return prev.map(o => o.id === updatedOrder.id ? { ...updatedOrder, createdAt: new Date(updatedOrder.createdAt) } : o)
      })
    })

    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => {
      socket.disconnect()
      clearInterval(timer)
    }
  }, [])

  const loadOrders = async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/orders/active`)
      const data = await resp.json()
      // Only show PENDING and PREPARING in KDS cards
      const active = data.filter((o: any) => o.status === "PENDING" || o.status === "PREPARING")
      setOrders(active.map((o: any) => ({ ...o, createdAt: new Date(o.createdAt) })))
    } catch (e) {
      console.error("Failed to load orders", e)
    }
  }

  const loadInventory = async () => {
    try {
      const resp = await api.get('/api/inventory')
      const data = await resp.json()
      setInventoryItems(data)
    } catch (e) {
      console.error("Failed to load inventory", e)
    }
  }

  const submitSupplyRequest = async () => {
    if (selectedSupplies.length === 0) return
    try {
      const resp = await api.post('/api/supply-requests', { items: selectedSupplies })
      if (!resp.ok) throw new Error("Failed to submit request")
      toast({ title: "Success", description: "Supply request submitted to Inventory Manager." })
      setSupplyRequestOpen(false)
      setSelectedSupplies([])
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "Failed to submit request.", variant: "destructive" })
    }
  }

  const updateStatus = async (orderId: string, status: "PREPARING" | "READY") => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error("Update failed")
      // State will be updated via Socket.io 'order-updated'
    } catch (e) {
      console.error(e)
    }
  }

  const getElapsedTime = (createdAt: Date) => Math.floor((currentTime.getTime() - createdAt.getTime()) / 60000)

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="border-b bg-card sticky top-0 z-10 p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.history.back()}><ArrowLeft className="h-4 w-4 mr-2"/>Back</Button>
            <ChefHat className="h-8 w-8 text-orange-500" />
            <h1 className="text-2xl font-bold flex-1">Kitchen Display System</h1>
            
            <Dialog open={supplyRequestOpen} onOpenChange={setSupplyRequestOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="ml-4 border-blue-500 text-blue-500 hover:bg-blue-50">
                  <Send className="w-4 h-4 mr-2" /> Request Supplies
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Request Supplies from Inventory</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {selectedSupplies.map((sup, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Select 
                        value={sup.id} 
                        onValueChange={(val) => {
                          const item = inventoryItems.find((i: any) => i.id === val);
                          const newSupplies = [...selectedSupplies];
                          newSupplies[idx] = { ...sup, id: val, name: item?.name || '' };
                          setSelectedSupplies(newSupplies);
                        }}
                      >
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Select raw material" /></SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map(item => (
                            <SelectItem key={item.id} value={item.id}>{item.name} ({item.unit})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input 
                        type="number" 
                        min="1"
                        className="w-24"
                        value={sup.quantity}
                        onChange={(e) => {
                          const newSupplies = [...selectedSupplies];
                          newSupplies[idx].quantity = Number(e.target.value);
                          setSelectedSupplies(newSupplies);
                        }}
                      />
                      <Button variant="ghost" size="icon" onClick={() => setSelectedSupplies(prev => prev.filter((_, i) => i !== idx))}>
                        <Trash className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="secondary" className="w-full" onClick={() => setSelectedSupplies(prev => [...prev, { id: '', name: '', quantity: 1 }])}>
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                  </Button>
                </div>
                <div className="flex justify-end gap-2 text-black">
                  <Button variant="ghost" onClick={() => setSupplyRequestOpen(false)}>Cancel</Button>
                  <Button onClick={submitSupplyRequest} disabled={selectedSupplies.length === 0 || selectedSupplies.some(s => !s.id)}>Submit Request</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono font-bold">{mounted ? currentTime.toLocaleTimeString() : "--:--:--"}</div>
            <Badge variant="outline">Active: {orders.length}</Badge>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => {
            const elapsed = getElapsedTime(order.createdAt)
            const isUrgent = elapsed > 15
            
            return (
              <Card key={order.id} className={`border-2 ${isUrgent ? "border-red-500 bg-red-50" : "border-muted"}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-3xl font-black">{order.orderNumber}</CardTitle>
                    <Badge variant={order.status === "PENDING" ? "destructive" : "default"}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span className="font-bold text-lg">{order.tableId ? `Table ${order.tableId}` : "Takeaway"}</span>
                    <div className="flex items-center gap-1 font-mono">
                      <Clock className="h-4 w-4" /> {elapsed}m
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Separator />
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-bold text-xl">{item.quantity}x {item.menuItem.name}</p>
                          {item.notes && <p className="text-sm bg-yellow-100 p-1 rounded mt-1 text-yellow-800">Note: {item.notes}</p>}
                        </div>
                        <Badge variant="outline">{item.menuItem.preparationTime || 15}m</Badge>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex gap-2">
                    {order.status === "PENDING" ? (
                      <Button className="flex-1 h-14 text-lg font-bold bg-blue-600" onClick={() => updateStatus(order.id, "PREPARING")}>
                        <ChefHat className="mr-2" /> Start Cooking
                      </Button>
                    ) : (
                      <Button className="flex-1 h-14 text-lg font-bold bg-green-600" onClick={() => updateStatus(order.id, "READY")}>
                        <CheckCircle className="mr-2" /> Mark Ready
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ChefHat className="h-20 w-20 mb-4 opacity-20" />
            <h2 className="text-2xl font-semibold">No active kitchen orders</h2>
            <p>Wait for new orders from POS...</p>
          </div>
        )}
      </main>
    </div>
  )
}

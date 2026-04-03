"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Package, Plus, Edit, Trash2, Search, TrendingUp, ArrowLeft, RefreshCw, Send, CheckCircle, Clock } from "lucide-react"
import { io } from "socket.io-client"

import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

interface InventoryItem {
  id: string; name: string; category: string; unit: string
  currentStock: number; minStock: number; maxStock: number
  unitCost: number; supplier: string | null
  lastRestocked: string | null; createdAt: string
}

export default function InventoryPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filtered, setFiltered] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [catFilter, setCatFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showRestock, setShowRestock] = useState(false)
  const [selected, setSelected] = useState<InventoryItem | null>(null)
  const [form, setForm] = useState({ name: "", category: "", unit: "", currentStock: 0, minStock: 0, maxStock: 0, unitCost: 0, supplier: "" })
  const [restockAmt, setRestockAmt] = useState(0)

  const [supplyRequests, setSupplyRequests] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [purchaseForm, setPurchaseForm] = useState<{id: string, name: string, quantity: number}[]>([])

  useEffect(() => { 
    loadInventory()
    loadSupplyRequests()
    loadPurchaseOrders()
    
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    const socket = io(API_BASE)
    socket.emit("join-inventory")

    socket.on("new-supply-request", (req: any) => {
      setSupplyRequests(prev => [req, ...prev])
      new Audio("/notification.mp3").play().catch(() => {})
    })

    return () => { socket.disconnect() }
  }, [])
  useEffect(() => { filterItems() }, [items, searchTerm, catFilter, stockFilter])

  const loadInventory = async () => {
    try {
      const res = await api.get("/api/inventory")
      const data: InventoryItem[] = await res.json()
      setItems(data)
    } catch (err) { console.error("Load inventory error:", err) }
  }

  const loadSupplyRequests = async () => {
    try {
      const res = await api.get("/api/supply-requests")
      const data = await res.json()
      if (res.ok) setSupplyRequests(data)
    } catch(e) { console.error(e) }
  }

  const loadPurchaseOrders = async () => {
    try {
      const res = await api.get("/api/purchase-orders")
      const data = await res.json()
      if (res.ok) setPurchaseOrders(data)
    } catch(e) { console.error(e) }
  }

  const approveSupplyRequest = async (id: string) => {
    try {
      const res = await api.patch(`/api/supply-requests/${id}/approve`, {})
      if (res.ok) {
        await loadSupplyRequests()
        await loadInventory()
      } else { alert("Failed to approve") }
    } catch (e) { console.error(e) }
  }

  const receivePurchaseOrder = async (id: string) => {
    try {
      const res = await api.patch(`/api/purchase-orders/${id}/receive`, {})
      if (res.ok) {
        await loadPurchaseOrders()
        await loadInventory()
      } else { alert("Failed to receive") }
    } catch (e) { console.error(e) }
  }

  const submitPurchaseOrder = async () => {
    try {
      const totalEstimatedCost = purchaseForm.reduce((sum, item) => sum + (items.find(i=>i.id===item.id)?.unitCost || 0) * item.quantity, 0)
      const res = await api.post("/api/purchase-orders", { items: purchaseForm, totalEstimatedCost })
      if (res.ok) {
        await loadPurchaseOrders()
        setShowPurchaseDialog(false)
        setPurchaseForm([])
      } else { alert("Failed to submit purchase order") }
    } catch (e) { console.error(e) }
  }

  // ... (keep filterItems, stockStatus, stockColor, stockText, categories)
  const filterItems = () => {
    let f = items
    if (searchTerm) f = f.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.category.toLowerCase().includes(searchTerm.toLowerCase()) || (i.supplier || "").toLowerCase().includes(searchTerm.toLowerCase()))
    if (catFilter !== "all") f = f.filter(i => i.category === catFilter)
    if (stockFilter === "low") f = f.filter(i => i.currentStock > 0 && i.currentStock <= i.minStock)
    else if (stockFilter === "out") f = f.filter(i => i.currentStock === 0)
    else if (stockFilter === "overstocked") f = f.filter(i => i.maxStock > 0 && i.currentStock > i.maxStock)
    f.sort((a, b) => { const ar = a.maxStock > 0 ? a.currentStock / a.maxStock : 1; const br = b.maxStock > 0 ? b.currentStock / b.maxStock : 1; return ar - br })
    setFiltered(f)
  }

  const stockStatus = (i: InventoryItem) => { if (i.currentStock === 0) return "out"; if (i.currentStock <= i.minStock) return "low"; if (i.maxStock > 0 && i.currentStock > i.maxStock) return "overstocked"; return "normal" }
  const stockColor = (s: string) => ({ out: "bg-red-500 text-white", low: "bg-yellow-500 text-white", overstocked: "bg-blue-500 text-white", normal: "bg-green-500 text-white" }[s] || "bg-green-500 text-white")
  const stockText = (s: string) => ({ out: "OUT OF STOCK", low: "LOW STOCK", overstocked: "OVERSTOCKED", normal: "IN STOCK" }[s] || "IN STOCK")
  const getCategories = () => [...new Set(items.map(i => i.category))].sort()

  const saveItem = async () => {
    if (!form.name || !form.category || !form.unit) return
    try {
      const res = await api.post("/api/inventory", form)
      if (!res.ok) { const e = await res.json(); alert(e.error); return }
      await loadInventory(); setShowAdd(false)
      setForm({ name: "", category: "", unit: "", currentStock: 0, minStock: 0, maxStock: 0, unitCost: 0, supplier: "" })
    } catch (err) { console.error(err) }
  }

  const updateItem = async () => {
    if (!selected) return
    try {
      const res = await api.patch(`/api/inventory/${selected.id}`, form)
      if (!res.ok) { const e = await res.json(); alert(e.error); return }
      await loadInventory(); setShowEdit(false); setSelected(null)
    } catch (err) { console.error(err) }
  }

  const restockItem = async () => {
    if (!selected || restockAmt <= 0) return
    try {
      const res = await api.post(`/api/inventory/${selected.id}/restock`, { quantity: restockAmt })
      if (!res.ok) { const e = await res.json(); alert(e.error); return }
      await loadInventory(); setShowRestock(false); setSelected(null); setRestockAmt(0)
    } catch (err) { console.error(err) }
  }

  const deleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return
    try {
      await api.delete(`/api/inventory/${id}`); await loadInventory()
    } catch (err) { console.error(err) }
  }

  const openEdit = (i: InventoryItem) => { setSelected(i); setForm({ name: i.name, category: i.category, unit: i.unit, currentStock: i.currentStock, minStock: i.minStock, maxStock: i.maxStock, unitCost: i.unitCost, supplier: i.supplier || "" }); setShowEdit(true) }
  const openRestock = (i: InventoryItem) => { setSelected(i); setRestockAmt(0); setShowRestock(true) }


  const invStats = { total: items.length, low: items.filter(i => i.currentStock <= i.minStock && i.currentStock > 0).length, out: items.filter(i => i.currentStock === 0).length, value: items.reduce((s, i) => s + i.currentStock * i.unitCost, 0) }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
              <div><h1 className="text-2xl font-bold">Inventory Management</h1><p className="text-muted-foreground">Track stock levels and manage supplies</p></div>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={loadInventory} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
              <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Item</Button></DialogTrigger></Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="inventory">
          <TabsList className="mb-4">
            <TabsTrigger value="inventory">Inventory Items</TabsTrigger>
            <TabsTrigger value="supply">Supply Requests</TabsTrigger>
            <TabsTrigger value="purchase">Purchase Orders</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{invStats.total}</div><div className="text-sm text-muted-foreground">Total Items</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-yellow-600">{invStats.low}</div><div className="text-sm text-muted-foreground">Low Stock</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{invStats.out}</div><div className="text-sm text-muted-foreground">Out of Stock</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{invStats.value.toFixed(2)} ETB</div><div className="text-sm text-muted-foreground">Total Value</div></CardContent></Card>
        </div>

        <Card className="mb-6"><CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search items, categories, or suppliers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" /></div></div>
            <Select value={catFilter} onValueChange={setCatFilter}><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by category" /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{getCategories().map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            <Select value={stockFilter} onValueChange={setStockFilter}><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by stock" /></SelectTrigger><SelectContent><SelectItem value="all">All Stock Levels</SelectItem><SelectItem value="low">Low Stock</SelectItem><SelectItem value="out">Out of Stock</SelectItem><SelectItem value="overstocked">Overstocked</SelectItem></SelectContent></Select>
          </div>
        </CardContent></Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12"><Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">No Items Found</h3><p className="text-muted-foreground">No inventory items match your search criteria.</p></div>
          ) : filtered.map(item => {
            const status = stockStatus(item)
            const pct = item.maxStock > 0 ? (item.currentStock / item.maxStock) * 100 : 0
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between"><CardTitle className="text-lg">{item.name}</CardTitle><Badge className={stockColor(status)}>{stockText(status)}</Badge></div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Badge variant="outline">{item.category}</Badge><span>•</span><span>{item.unit}</span></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2"><span>Current Stock</span><span className="font-medium">{item.currentStock} / {item.maxStock} {item.unit}</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${status === "out" ? "bg-red-500" : status === "low" ? "bg-yellow-500" : status === "overstocked" ? "bg-blue-500" : "bg-green-500"}`} style={{ width: `${Math.min(pct, 100)}%` }}></div></div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>Min: {item.minStock}</span><span>Max: {item.maxStock}</span></div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Unit Cost:</span><span className="font-medium">{item.unitCost} ETB</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Value:</span><span className="font-medium">{(item.currentStock * item.unitCost).toFixed(2)} ETB</span></div>
                    {item.supplier && <div className="flex justify-between"><span className="text-muted-foreground">Supplier:</span><span className="font-medium">{item.supplier}</span></div>}
                    {item.lastRestocked && <div className="flex justify-between"><span className="text-muted-foreground">Last Restocked:</span><span className="font-medium">{new Date(item.lastRestocked).toLocaleDateString()}</span></div>}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => openRestock(item)} className="flex-1"><TrendingUp className="h-4 w-4 mr-2" />Restock</Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => deleteItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  {(status === "low" || status === "out") && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm"><AlertTriangle className="h-4 w-4 text-yellow-600" /><span className="text-yellow-800">{status === "out" ? "Urgent: Restock immediately" : "Warning: Stock running low"}</span></div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
          </TabsContent>

          <TabsContent value="supply">
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Pending Supply Requests from Kitchen</h2>
              {supplyRequests.length === 0 && <p className="text-muted-foreground">No supply requests.</p>}
              {supplyRequests.map(req => (
                <Card key={req.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold">Chef: {req.chef?.name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">Status: {req.status} | {new Date(req.createdAt).toLocaleString()}</p>
                      <ul className="mt-2 text-sm list-disc list-inside">
                        {req.items.map((i: any, idx: number) => <li key={idx}>{i.quantity}x {i.name}</li>)}
                      </ul>
                    </div>
                    {req.status === "PENDING" && (
                      <Button onClick={() => approveSupplyRequest(req.id)}><CheckCircle className="w-4 h-4 mr-2"/> Approve</Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="purchase">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Purchase Orders</h2>
                <Button onClick={() => setShowPurchaseDialog(true)}><Plus className="w-4 h-4 mr-2"/> New Purchase Order</Button>
              </div>
              {purchaseOrders.length === 0 && <p className="text-muted-foreground">No purchase orders.</p>}
              {purchaseOrders.map(po => (
                <Card key={po.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-bold">Manager: {po.manager?.name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">Status: {po.status} | Cost: {po.totalEstimatedCost} ETB</p>
                      <ul className="mt-2 text-sm list-disc list-inside">
                        {po.items.map((i: any, idx: number) => <li key={idx}>{i.quantity}x {i.name}</li>)}
                      </ul>
                    </div>
                    {po.status === "ADMIN_APPROVED" && (
                      <Button onClick={() => receivePurchaseOrder(po.id)} className="bg-green-600 hover:bg-green-700">
                        <Package className="w-4 h-4 mr-2"/> Mark Received
                      </Button>
                    )}
                    {po.status === "PENDING" && <Badge variant="outline"><Clock className="w-4 h-4 mr-1"/> Pending Admin Approval</Badge>}
                    {po.status === "RECEIVED" && <Badge className="bg-green-500">Received</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Add New Inventory Item</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="name">Item Name</Label><Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter item name" /></div>
            <div><Label htmlFor="category">Category</Label><Input id="category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g., Meat, Spices, Vegetables" /></div>
            <div><Label htmlFor="unit">Unit</Label><Input id="unit" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="e.g., kg, pieces, liters" /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label htmlFor="currentStock">Current</Label><Input id="currentStock" type="number" value={form.currentStock} onChange={e => setForm({ ...form, currentStock: Number(e.target.value) })} /></div>
              <div><Label htmlFor="minStock">Min</Label><Input id="minStock" type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: Number(e.target.value) })} /></div>
              <div><Label htmlFor="maxStock">Max</Label><Input id="maxStock" type="number" value={form.maxStock} onChange={e => setForm({ ...form, maxStock: Number(e.target.value) })} /></div>
            </div>
            <div><Label htmlFor="unitCost">Unit Cost (ETB)</Label><Input id="unitCost" type="number" step="0.01" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: Number(e.target.value) })} /></div>
            <div><Label htmlFor="supplier">Supplier (Optional)</Label><Input id="supplier" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Supplier name" /></div>
            <div className="flex gap-2 pt-4"><Button onClick={saveItem} className="flex-1">Add Item</Button><Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Edit Inventory Item</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Item Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
            <div><Label>Unit</Label><Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Current</Label><Input type="number" value={form.currentStock} onChange={e => setForm({ ...form, currentStock: Number(e.target.value) })} /></div>
              <div><Label>Min</Label><Input type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: Number(e.target.value) })} /></div>
              <div><Label>Max</Label><Input type="number" value={form.maxStock} onChange={e => setForm({ ...form, maxStock: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Unit Cost (ETB)</Label><Input type="number" step="0.01" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: Number(e.target.value) })} /></div>
            <div><Label>Supplier</Label><Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} /></div>
            <div className="flex gap-2 pt-4"><Button onClick={updateItem} className="flex-1">Update Item</Button><Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog open={showRestock} onOpenChange={setShowRestock}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Restock Item</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg"><h4 className="font-medium">{selected.name}</h4><p className="text-sm text-muted-foreground">Current Stock: {selected.currentStock} {selected.unit}</p></div>
              <div><Label htmlFor="restockAmount">Restock Amount</Label><Input id="restockAmount" type="number" value={restockAmt} onChange={e => setRestockAmt(Number(e.target.value))} placeholder="Enter amount to add" /></div>
              <div className="bg-green-50 p-3 rounded-lg"><p className="text-sm"><strong>New Stock Level:</strong> {selected.currentStock + restockAmt} {selected.unit}</p></div>
              <div className="flex gap-2 pt-4"><Button onClick={restockItem} className="flex-1" disabled={restockAmt <= 0}>Restock</Button><Button variant="outline" onClick={() => setShowRestock(false)}>Cancel</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Purchase Order Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {purchaseForm.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Select value={item.id} onValueChange={(val) => {
                  const inv = items.find(i => i.id === val);
                  const newF = [...purchaseForm];
                  newF[idx] = { ...item, id: val, name: inv?.name || '' };
                  setPurchaseForm(newF);
                }}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select item to buy" /></SelectTrigger>
                  <SelectContent>
                    {items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" min="1" className="w-24" value={item.quantity} onChange={e => {
                  const newF = [...purchaseForm]; newF[idx].quantity = Number(e.target.value); setPurchaseForm(newF)
                }} />
                <Button variant="ghost" size="icon" onClick={() => setPurchaseForm(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            ))}
            <Button variant="secondary" className="w-full" onClick={() => setPurchaseForm(prev => [...prev, { id: '', name: '', quantity: 1 }])}><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
            <div className="flex gap-2 pt-4"><Button onClick={submitPurchaseOrder} className="flex-1" disabled={purchaseForm.length === 0 || purchaseForm.some(i => !i.id)}>Submit Order</Button><Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>Cancel</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
